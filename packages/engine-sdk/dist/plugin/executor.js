"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultPluginExecutor = void 0;
const errors_1 = require("../errors");
class DefaultPluginExecutor {
    activeExecutions = new Map();
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    async initialize(plugin, context) {
        if (!plugin.onInit) {
            return;
        }
        try {
            await this.withTimeout(Promise.resolve(plugin.onInit(context)), 30000, `Plugin '${plugin.id}' initialization timeout`);
        }
        catch (error) {
            if (error instanceof errors_1.BaseEngineError) {
                throw error;
            }
            throw new errors_1.PluginError(plugin.id, errors_1.EngineErrorCode.LIFECYCLE_HOOK_FAILED, `Plugin '${plugin.id}' initialization failed`, {
                cause: error instanceof Error ? error : undefined,
            });
        }
    }
    async execute(plugin, input, context) {
        const startTime = Date.now();
        const abortController = new AbortController();
        this.activeExecutions.set(plugin.id, abortController);
        // Link to parent abort signal
        const abortHandler = () => abortController.abort();
        if (context.signals && typeof context.signals.addEventListener === 'function') {
            context.signals.addEventListener('abort', abortHandler);
        }
        const executionContext = {
            ...context,
            signals: abortController.signal,
        };
        let rejectAbort;
        let removeAbortListener;
        try {
            if (plugin.validateConfig && !plugin.validateConfig(context.config)) {
                throw new errors_1.PluginError(plugin.id, errors_1.EngineErrorCode.PLUGIN_EXECUTION_FAILED, `Plugin '${plugin.id}' config validation failed`);
            }
            // Wrap plugin execution in a cancellable promise. The abort promise is
            // tracked and cleaned up so that, if the execution wins the race, the
            // dangling abort rejection does not surface as an unhandled rejection.
            const executionPromise = Promise.resolve(plugin.execute(input, executionContext));
            const abortPromise = new Promise((_, reject) => {
                rejectAbort = () => reject(new errors_1.LifecycleError('execution', errors_1.EngineErrorCode.ABORTED, 'Execution aborted'));
                abortController.signal.addEventListener('abort', rejectAbort, { once: true });
                removeAbortListener = () => abortController.signal.removeEventListener('abort', rejectAbort);
            });
            const output = await this.withTimeout(Promise.race([executionPromise.then((v) => v), abortPromise]), context.signals && context.signals.reason ? 0 : 300000, `Plugin '${plugin.id}' execution timeout`);
            return {
                success: true,
                output: output,
                executionTime: Date.now() - startTime,
                skipped: false,
            };
        }
        catch (error) {
            // Pass through existing EngineError instances (including PluginError and
            // LifecycleError) so callers see the original error/code, e.g. ABORTED.
            if (error instanceof errors_1.BaseEngineError) {
                return {
                    success: false,
                    error: error,
                    executionTime: Date.now() - startTime,
                    skipped: false,
                };
            }
            const engineError = new errors_1.EngineError(errors_1.EngineErrorCode.PLUGIN_EXECUTION_FAILED, `Plugin '${plugin.id}' execution failed`, {
                cause: error instanceof Error ? error : undefined,
            });
            return {
                success: false,
                error: engineError,
                executionTime: Date.now() - startTime,
                skipped: false,
            };
        }
        finally {
            if (removeAbortListener) {
                removeAbortListener();
            }
            if (context.signals && typeof context.signals.removeEventListener === 'function') {
                context.signals.removeEventListener('abort', abortHandler);
            }
            this.activeExecutions.delete(plugin.id);
        }
    }
    async shutdown(plugin, context) {
        if (!plugin.onShutdown) {
            return;
        }
        try {
            await this.withTimeout(Promise.resolve(plugin.onShutdown(context)), 10000, `Plugin '${plugin.id}' shutdown timeout`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            context.logger.error(`Plugin '${plugin.id}' shutdown failed`, { error: message });
        }
    }
    abort(pluginId) {
        const controller = this.activeExecutions.get(pluginId);
        if (controller) {
            controller.abort();
        }
    }
    abortAll() {
        for (const controller of this.activeExecutions.values()) {
            controller.abort();
        }
        this.activeExecutions.clear();
    }
    async withTimeout(promise, timeoutMs, timeoutMessage) {
        if (timeoutMs <= 0) {
            return promise;
        }
        let timeout;
        const timeoutPromise = new Promise((_, reject) => {
            timeout = setTimeout(() => reject(new errors_1.LifecycleError('execution', errors_1.EngineErrorCode.TIMEOUT, timeoutMessage)), timeoutMs);
        });
        try {
            return await Promise.race([promise, timeoutPromise]);
        }
        finally {
            // Prevent the timer from firing after the main promise settled, which
            // avoids the orphaned timeout promise surfacing as an unhandled rejection.
            if (timeout)
                clearTimeout(timeout);
        }
    }
}
exports.DefaultPluginExecutor = DefaultPluginExecutor;
//# sourceMappingURL=executor.js.map