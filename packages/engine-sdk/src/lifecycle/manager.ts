import type { PluginDefinition, PluginInitContext, PluginExecutionContext, PluginShutdownContext, PluginResult, EngineEvent, EngineEventHandler, EngineMetrics, PluginLogger, PluginStorage, PluginMetrics, EventBus, PluginRegistry, PluginExecutor } from '../types';
import { EngineStatus } from '../types';
import { EngineErrorCode, EngineError, PluginError, LifecycleError } from '../errors';
import { DefaultPluginRegistry } from '../plugin/registry';
import { DefaultPluginExecutor } from '../plugin/executor';
import { DefaultEventBus } from '../context/event-bus';
import { DefaultEngineLogger } from '../context/logger';
import { DefaultPluginStorage } from '../context/storage';
import { DefaultPluginMetrics } from '../context/metrics';

export interface LifecycleManager {
  initialize(plugins: PluginDefinition[]): Promise<void>;
  execute<Input, Output>(plugin: PluginDefinition<Input, Output>, input: Input): Promise<PluginResult<Output>>;
  shutdown(): Promise<void>;
  getStatus(): EngineStatus;
  getMetrics(): EngineMetrics;
}

export interface LifecycleOptions {
  onStateChange?: (status: EngineStatus) => void;
  onError?: (error: EngineError) => void;
}

export class DefaultLifecycleManager implements LifecycleManager {
  private status: EngineStatus = EngineStatus.IDLE;
  private plugins: PluginDefinition[] = [];
  private pluginRegistry: PluginRegistry;
  private pluginExecutor: PluginExecutor;
  private eventBus: EventBus;
  private logger: PluginLogger;
  private storage: PluginStorage;
  private metrics: PluginMetrics;
  private abortController = new AbortController();
  private options: LifecycleOptions;

  constructor(options: LifecycleOptions = {}) {
    this.options = options;
    this.eventBus = new DefaultEventBus();
    this.logger = new DefaultEngineLogger('engine-sdk');
    this.storage = new DefaultPluginStorage();
    this.metrics = new DefaultPluginMetrics();
    this.pluginRegistry = new DefaultPluginRegistry();
    this.pluginExecutor = new DefaultPluginExecutor(this.logger);
  }

  async initialize(plugins: PluginDefinition[]): Promise<void> {
    if (this.status !== EngineStatus.IDLE && this.status !== EngineStatus.STOPPED) {
      throw new EngineError(EngineErrorCode.ENGINE_ALREADY_RUNNING, 'Engine is already initialized');
    }

    this.status = EngineStatus.INITIALIZING;
    this.emit({ type: 'engine:initializing', engine: 'engine-sdk', timestamp: Date.now() });

    try {
      for (const plugin of plugins) {
        this.pluginRegistry.register(plugin);
        this.plugins.push(plugin);
      }

      await this.validateDependencies();
      await this.initializePlugins();
      await this.hooks.onInit?.(this.createContext());

      this.status = EngineStatus.RUNNING;
      this.emit({ type: 'engine:initialized', engine: 'engine-sdk', timestamp: Date.now() });
    } catch (error) {
      this.status = EngineStatus.ERROR;
      throw error;
    }
  }

  async execute<Input, Output>(plugin: PluginDefinition<Input, Output>, input: Input): Promise<PluginResult<Output>> {
    if (this.status !== EngineStatus.RUNNING) {
      throw new EngineError(EngineErrorCode.ENGINE_NOT_RUNNING, 'Engine is not running');
    }

    if (this.abortController.signal.aborted) {
      throw new LifecycleError('execution', EngineErrorCode.ABORTED, 'Execution aborted');
    }

    this.emit({ type: 'engine:run:start', engine: 'engine-sdk', timestamp: Date.now() });

    const pluginDef = plugin as PluginDefinition<unknown, unknown, unknown>;
    try {
      const result = await this.pluginExecutor.execute(
        pluginDef,
        input as unknown,
        this.createExecutionContext<unknown>(pluginDef)
      ) as PluginResult<Output>;
      
      this.emit({ type: 'engine:run:complete', engine: 'engine-sdk', timestamp: Date.now() });
      return result;
    } catch (error) {
      this.emit({ type: 'engine:run:complete', engine: 'engine-sdk', timestamp: Date.now() });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (this.status === EngineStatus.STOPPED || this.status === EngineStatus.IDLE) {
      return;
    }

    this.status = EngineStatus.STOPPING;
    this.abortController.abort();
    this.emit({ type: 'engine:shutdown', engine: 'engine-sdk', timestamp: Date.now() });

    try {
      const plugins = this.pluginRegistry.getEnabled().reverse();
      for (const plugin of plugins) {
        try {
          const context = this.createShutdownContext(plugin);
          await this.pluginExecutor.shutdown(plugin, context);
        } catch (error) {
          this.logger.error(`Error shutting down plugin ${plugin.id}`, { error: (error as Error).message });
        }
      }

      await this.hooks.onShutdown?.(this.createContext());
      this.status = EngineStatus.STOPPED;
      this.emit({ type: 'engine:shutdown:complete', engine: 'engine-sdk', timestamp: Date.now() });
      this.emit({ type: 'run-complete', engine: 'engine-sdk', timestamp: Date.now() });
    } catch (error) {
      this.status = EngineStatus.ERROR;
      throw error;
    }
  }

  abortAll(): void {
    this.abortController.abort();
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getMetrics(): EngineMetrics {
    return {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      averageExecutionTime: 0,
      pluginCount: this.plugins.length,
      activePlugins: this.pluginRegistry.getEnabled().length,
      pluginMetrics: {},
    };
  }

  private async validateDependencies(): Promise<void> {
    const validation = this.pluginRegistry.validateDependencies();
    if (!validation.valid) {
      const errorMessages: string[] = [];
      if (validation.cycles.length > 0) {
        errorMessages.push(`Dependency cycles: ${validation.cycles.map(c => c.join(' -> ')).join(', ')}`);
      }
      if (validation.missing.length > 0) {
        errorMessages.push(`Missing dependencies: ${validation.missing.join(', ')}`);
      }
      throw new PluginError('system', EngineErrorCode.PLUGIN_DEPENDENCY_CYCLE, errorMessages.join('; '));
    }
  }

  private async initializePlugins(): Promise<void> {
    const plugins = this.pluginRegistry.getEnabled();
    for (const plugin of plugins) {
      if (this.abortController.signal.aborted) {
        throw new LifecycleError('initialization', EngineErrorCode.ABORTED, 'Initialization aborted');
      }

      try {
        const context = this.createInitContext(plugin);
        await this.pluginExecutor.initialize(plugin, context);
      } catch (error) {
        this.status = EngineStatus.ERROR;
        throw new PluginError(
          plugin.id,
          EngineErrorCode.PLUGIN_INIT_FAILED,
          `Failed to initialize plugin ${plugin.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { cause: error instanceof Error ? error : undefined }
        );
      }
    }
  }

  private createContext(): Record<string, unknown> {
    return {
      engineId: 'engine-sdk',
      engineVersion: '1.0.0',
      runId: this.generateRunId(),
      status: this.status,
      startTime: Date.now(),
    };
  }

  private createInitContext<Config>(plugin: PluginDefinition): PluginInitContext<Config> {
    return {
      engineId: 'engine-sdk',
      engineVersion: '1.0.0',
      pluginId: plugin.id,
      config: plugin.config as Config,
      logger: this.logger,
      storage: this.storage,
      eventBus: this.eventBus,
      metrics: this.metrics,
      signals: this.abortController.signal,
    };
  }

  private createExecutionContext<Config>(plugin: PluginDefinition): PluginExecutionContext<Config> {
    return {
      engineId: 'engine-sdk',
      engineVersion: '1.0.0',
      runId: this.generateRunId(),
      pluginId: plugin.id,
      config: plugin.config as Config,
      logger: this.logger,
      storage: this.storage,
      eventBus: this.eventBus,
      metrics: this.metrics,
      signals: this.abortController.signal,
      metadata: {},
    };
  }

  private createShutdownContext(plugin: PluginDefinition): PluginShutdownContext {
    return {
      engineId: 'engine-sdk',
      pluginId: plugin.id,
      logger: this.logger,
    };
  }

  private generateRunId(): string {
    return `engine-sdk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private emit(event: EngineEvent): void {
    this.eventBus.emit(event);
  }

  on(event: string, handler: EngineEventHandler): void {
    this.eventBus.on(event, handler);
  }

  off(event: string, handler: EngineEventHandler): void {
    this.eventBus.off(event, handler);
  }

  private hooks = {
    onInit: async (_context: Record<string, unknown>) => { void _context; },
    onShutdown: async (_context: Record<string, unknown>) => { void _context; },
  };
}