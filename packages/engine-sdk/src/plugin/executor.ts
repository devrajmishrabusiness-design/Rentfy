import type { PluginDefinition, PluginInitContext, PluginExecutionContext, PluginShutdownContext, PluginResult, PluginLogger, PluginExecutor } from '../types';
import { PluginError, LifecycleError, EngineError, EngineErrorCode, BaseEngineError } from '../errors';

export class DefaultPluginExecutor implements PluginExecutor {
  private activeExecutions = new Map<string, AbortController>();
  private logger: PluginLogger;

  constructor(logger: PluginLogger) {
    this.logger = logger;
  }

  async initialize<Config>(plugin: PluginDefinition, context: PluginInitContext<Config>): Promise<void> {
    if (!plugin.onInit) {
      return;
    }

    try {
      await this.withTimeout(
        Promise.resolve(plugin.onInit(context)),
        30000,
        `Plugin '${plugin.id}' initialization timeout`
      );
    } catch (error) {
      if (error instanceof BaseEngineError) {
        throw error;
      }
      throw new PluginError(plugin.id, EngineErrorCode.LIFECYCLE_HOOK_FAILED, `Plugin '${plugin.id}' initialization failed`, {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async execute<Input, Output, Config>(
    plugin: PluginDefinition<Input, Output, Config>,
    input: Input,
    context: PluginExecutionContext<Config>
  ): Promise<PluginResult<Output>> {
    const startTime = Date.now();
    const abortController = new AbortController();
    this.activeExecutions.set(plugin.id, abortController);

    // Link to parent abort signal
    const abortHandler = () => abortController.abort();
    if (context.signals && typeof context.signals.addEventListener === 'function') {
      context.signals.addEventListener('abort', abortHandler);
    }

    const executionContext: PluginExecutionContext<Config> = {
      ...context,
      signals: abortController.signal,
    };

    let rejectAbort: (() => void) | undefined;
    let removeAbortListener: (() => void) | undefined;
    try {
      if (plugin.validateConfig && !plugin.validateConfig(context.config)) {
        throw new PluginError(
          plugin.id,
          EngineErrorCode.PLUGIN_EXECUTION_FAILED,
          `Plugin '${plugin.id}' config validation failed`
        );
      }

      // Wrap plugin execution in a cancellable promise. The abort promise is
      // tracked and cleaned up so that, if the execution wins the race, the
      // dangling abort rejection does not surface as an unhandled rejection.
      const executionPromise = Promise.resolve(plugin.execute(input, executionContext));

      const abortPromise = new Promise<never>((_, reject) => {
        rejectAbort = () => reject(new LifecycleError('execution', EngineErrorCode.ABORTED, 'Execution aborted'));
        abortController.signal.addEventListener('abort', rejectAbort, { once: true });
        removeAbortListener = () => abortController.signal.removeEventListener('abort', rejectAbort!);
      });

      const output = await this.withTimeout(
        Promise.race([executionPromise.then((v) => v), abortPromise]),
        context.signals && (context.signals as AbortSignal).reason ? 0 : 300000,
        `Plugin '${plugin.id}' execution timeout`
      );

      return {
        success: true,
        output: output as Output,
        executionTime: Date.now() - startTime,
        skipped: false,
      };
    } catch (error) {
      // Pass through existing EngineError instances (including PluginError and
      // LifecycleError) so callers see the original error/code, e.g. ABORTED.
      if (error instanceof BaseEngineError) {
        return {
          success: false,
          error: error,
          executionTime: Date.now() - startTime,
          skipped: false,
        };
      }

      const engineError = new EngineError(EngineErrorCode.PLUGIN_EXECUTION_FAILED, `Plugin '${plugin.id}' execution failed`, {
        cause: error instanceof Error ? error : undefined,
      });

      return {
        success: false,
        error: engineError,
        executionTime: Date.now() - startTime,
        skipped: false,
      };
    } finally {
      if (removeAbortListener) {
        removeAbortListener();
      }
      if (context.signals && typeof context.signals.removeEventListener === 'function') {
        context.signals.removeEventListener('abort', abortHandler);
      }
      this.activeExecutions.delete(plugin.id);
    }
  }

  async shutdown(plugin: PluginDefinition, context: PluginShutdownContext): Promise<void> {
    if (!plugin.onShutdown) {
      return;
    }

    try {
      await this.withTimeout(
        Promise.resolve(plugin.onShutdown(context)),
        10000,
        `Plugin '${plugin.id}' shutdown timeout`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      context.logger.error(`Plugin '${plugin.id}' shutdown failed`, { error: message });
    }
  }

  abort(pluginId: string): void {
    const controller = this.activeExecutions.get(pluginId);
    if (controller) {
      controller.abort();
    }
  }

  abortAll(): void {
    for (const controller of this.activeExecutions.values()) {
      controller.abort();
    }
    this.activeExecutions.clear();
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
    if (timeoutMs <= 0) {
      return promise;
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new LifecycleError('execution', EngineErrorCode.TIMEOUT, timeoutMessage)), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      // Prevent the timer from firing after the main promise settled, which
      // avoids the orphaned timeout promise surfacing as an unhandled rejection.
      if (timeout) clearTimeout(timeout);
    }
  }
}
