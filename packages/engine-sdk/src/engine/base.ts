import type {
  EngineInfo,
  EngineConfig,
  EngineMetrics,
  EngineHooks,
  EngineEvent,
  EngineEventHandler,
  EngineHealth,
  PluginDefinition,
  PluginConfig,
  PluginInitContext,
  PluginExecutionContext,
  PluginShutdownContext,
  PluginLogger,
  PluginStorage,
  PluginMetrics,
  EventBus,
  PluginRegistry,
  PluginExecutor,
} from '../types';
import { EngineStatus } from '../types';
import { EngineErrorCode, EngineError, PluginError } from '../errors';
import { DefaultPluginRegistry } from '../plugin/registry';
import { DefaultPluginExecutor } from '../plugin/executor';
import { DefaultEventBus } from '../context/event-bus';
import { DefaultEngineLogger } from '../context/logger';
import { DefaultPluginStorage } from '../context/storage';
import { DefaultPluginMetrics } from '../context/metrics';

export interface BaseEngine<Config extends EngineConfig = EngineConfig> {
  readonly info: EngineInfo;
  readonly config: Config;
  readonly status: EngineStatus;
  readonly metrics: EngineMetrics;

  initialize(config?: Partial<Config>): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
  health(): Promise<EngineHealth>;

  on(event: string, handler: EngineEventHandler): void;
  off(event: string, handler: EngineEventHandler): void;
  emit(event: EngineEvent): void;
}

export abstract class AbstractEngine<Config extends EngineConfig = EngineConfig> implements BaseEngine<Config> {
  public readonly info: EngineInfo;
  public readonly config: Config;
  public status: EngineStatus = EngineStatus.IDLE;
  public metrics: EngineMetrics = this.getInitialMetrics();

  protected readonly hooks: EngineHooks;
  protected readonly eventBus: EventBus;
  protected readonly logger: PluginLogger;
  protected readonly storage: PluginStorage;
  protected readonly pluginRegistry: PluginRegistry;
  protected readonly pluginExecutor: PluginExecutor;
  protected readonly pluginMetrics: PluginMetrics;

  protected initialized = false;
  protected running = false;
  protected abortController = new AbortController();

  constructor(info: EngineInfo, config: Config, hooks: EngineHooks = {}, options: {
    eventBus?: EventBus;
    logger?: PluginLogger;
    storage?: PluginStorage;
    pluginRegistry?: PluginRegistry;
    pluginExecutor?: PluginExecutor;
    pluginMetrics?: PluginMetrics;
  } = {}) {
    this.info = info;
    this.config = config;
    this.hooks = hooks;
    this.eventBus = options.eventBus ?? new DefaultEventBus();
    this.logger = options.logger ?? new DefaultEngineLogger(info.name);
    this.storage = options.storage ?? new DefaultPluginStorage();
    this.pluginRegistry = options.pluginRegistry ?? new DefaultPluginRegistry();
    this.pluginExecutor = options.pluginExecutor ?? new DefaultPluginExecutor(this.logger);
    this.pluginMetrics = options.pluginMetrics ?? new DefaultPluginMetrics();

    this.setupDefaultHooks();
  }

  protected setupDefaultHooks(): void {
    this.hooks.beforeRun ??= async () => {};
    this.hooks.afterRun ??= async () => {};
    this.hooks.beforePhase ??= async () => {};
    this.hooks.afterPhase ??= async () => {};
    this.hooks.beforePlugin ??= async () => {};
    this.hooks.afterPlugin ??= async () => {};
    this.hooks.onError ??= async () => {};
    this.hooks.onInit ??= async () => {};
    this.hooks.onShutdown ??= async () => {};
  }

  protected getInitialMetrics(): EngineMetrics {
    return {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      averageExecutionTime: 0,
      pluginMetrics: {},
    };
  }

  async initialize(config?: Partial<Config>): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Engine already initialized');
      return;
    }

    if (config) {
      Object.assign(this.config, config);
    }

    this.status = EngineStatus.INITIALIZING;
    this.emit({ type: 'engine:initializing', engine: this.info.name, timestamp: Date.now() });

    try {
      await this.validateConfig(this.config);
      await this.registerPlugins((this.config['plugins'] as PluginConfig[]) || []);
      await this.initializePlugins();
      await this.onInitialize();

      this.initialized = true;
      this.status = EngineStatus.IDLE;
      this.emit({ type: 'engine:initialized', engine: this.info.name, timestamp: Date.now() });
      this.logger.info(`Engine ${this.info.name} v${this.info.version} initialized`);
    } catch (error) {
      this.status = EngineStatus.ERROR;
      const engineError = this.createError(
        EngineErrorCode.ENGINE_START_FAILED,
        `Failed to initialize engine: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { cause: error instanceof Error ? error : undefined }
      );
      this.emit({ type: 'engine:error', engine: this.info.name, error: engineError, timestamp: Date.now() });
      throw engineError;
    }
  }

  protected abstract validateConfig(config: Config): Promise<void>;
  protected abstract registerPlugins(plugins: PluginConfig[]): Promise<void>;
  protected abstract onInitialize(): Promise<void>;

  async start(): Promise<void> {
    if (!this.initialized) {
      throw this.createError(EngineErrorCode.ENGINE_NOT_INITIALIZED, 'Engine must be initialized before starting');
    }
    if (this.running) {
      throw this.createError(EngineErrorCode.ENGINE_ALREADY_RUNNING, 'Engine is already running');
    }

    this.running = true;
    this.status = EngineStatus.RUNNING;
    this.abortController = new AbortController();
    this.emit({ type: 'engine:started', engine: this.info.name, timestamp: Date.now() });
    this.logger.info(`Engine ${this.info.name} started`);

    await this.onStart();
  }

  protected abstract onStart(): Promise<void>;

  async stop(): Promise<void> {
    if (!this.running) {
      this.logger.warn('Engine not running');
      return;
    }

    this.status = EngineStatus.STOPPING;
    this.emit({ type: 'engine:stopping', engine: this.info.name, timestamp: Date.now() });
    this.logger.info(`Engine ${this.info.name} stopping`);

    try {
      this.abortController.abort();
      await this.onStop();
      this.running = false;
      this.status = EngineStatus.IDLE;
      this.emit({ type: 'engine:stopped', engine: this.info.name, timestamp: Date.now() });
      this.logger.info(`Engine ${this.info.name} stopped`);
    } catch (error) {
      this.status = EngineStatus.ERROR;
      const engineError = this.createError(
        EngineErrorCode.ENGINE_STOP_FAILED,
        `Failed to stop engine: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { cause: error instanceof Error ? error : undefined }
      );
      this.emit({ type: 'engine:error', engine: this.info.name, error: engineError, timestamp: Date.now() });
      throw engineError;
    }
  }

  protected abstract onStop(): Promise<void>;

  async dispose(): Promise<void> {
    if (this.running) {
      await this.stop();
    }

    this.status = EngineStatus.STOPPING;
    this.emit({ type: 'engine:disposing', engine: this.info.name, timestamp: Date.now() });
    this.logger.info(`Engine ${this.info.name} disposing`);

    try {
      await this.shutdownPlugins();
      await this.onDispose();
      this.initialized = false;
      this.emit({ type: 'engine:disposed', engine: this.info.name, timestamp: Date.now() });
      this.logger.info(`Engine ${this.info.name} disposed`);
    } catch (error) {
      this.logger.error(`Error during disposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  protected abstract onDispose(): Promise<void>;

  async health(): Promise<EngineHealth> {
    return {
      status: this.status === EngineStatus.ERROR ? 'unhealthy' : this.status === EngineStatus.IDLE ? 'healthy' : 'degraded',
      engine: this.info.name,
      version: this.info.version,
      uptime: this.metrics.lastRunTime ? Date.now() - this.metrics.lastRunTime : 0,
      plugins: Array.from(this.pluginRegistry.getEnabled()).map(p => ({
        id: p.id,
        status: 'healthy',
        version: p.version,
      })),
      checks: {
        initialized: this.initialized,
        running: this.running,
        storage: await this.checkStorage(),
      },
    };
  }

  protected async checkStorage(): Promise<boolean> {
    try {
      await this.storage.set('health_check', 'ok');
      const value = await this.storage.get('health_check');
      await this.storage.delete('health_check');
      return value === 'ok';
    } catch {
      return false;
    }
  }

  on(event: string, handler: EngineEventHandler): void {
    this.eventBus.on(event, handler);
  }

  off(event: string, handler: EngineEventHandler): void {
    this.eventBus.off(event, handler);
  }

  emit(event: EngineEvent): void {
    this.eventBus.emit(event);
  }

  protected async initializePlugins(): Promise<void> {
    const plugins = this.pluginRegistry.getEnabled();
    for (const plugin of plugins) {
      try {
        const context = this.createInitContext(plugin);
        await this.pluginExecutor.initialize(plugin, context);
      } catch (error) {
        const pluginError = this.createError(
          EngineErrorCode.PLUGIN_INIT_FAILED,
          `Failed to initialize plugin ${plugin.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { pluginId: plugin.id, cause: error instanceof Error ? error : undefined }
        );
        throw pluginError;
      }
    }
  }

  protected async shutdownPlugins(): Promise<void> {
    const plugins = this.pluginRegistry.getEnabled().reverse();
    for (const plugin of plugins) {
      try {
        const context = this.createShutdownContext(plugin);
        await this.pluginExecutor.shutdown(plugin, context);
      } catch (error) {
        this.logger.error(`Error shutting down plugin ${plugin.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, { pluginId: plugin.id });
      }
    }
  }

  protected createInitContext<Config>(plugin: PluginDefinition): PluginInitContext<Config> {
    return {
      engineId: this.info.name,
      engineVersion: this.info.version,
      pluginId: plugin.id,
      config: (plugin.config as Config) ?? ({} as Config),
      logger: this.logger,
      storage: this.storage,
      eventBus: this.eventBus,
      metrics: this.pluginMetrics,
      signals: this.abortController.signal,
    };
  }

  protected createExecutionContext<Config>(plugin: PluginDefinition, metadata: Record<string, unknown> = {}): PluginExecutionContext<Config> {
    return {
      engineId: this.info.name,
      engineVersion: this.info.version,
      runId: this.generateRunId(),
      pluginId: plugin.id,
      config: (plugin.config as Config) ?? ({} as Config),
      logger: this.logger,
      storage: this.storage,
      eventBus: this.eventBus,
      metrics: this.pluginMetrics,
      signals: this.abortController.signal,
      metadata,
    };
  }

  protected createShutdownContext(plugin: PluginDefinition): PluginShutdownContext {
    return {
      engineId: this.info.name,
      pluginId: plugin.id,
      logger: this.logger,
    };
  }

  protected generateRunId(): string {
    return `${this.info.name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  protected createError(
    code: EngineErrorCode,
    message: string,
    options?: { metadata?: Record<string, unknown>; cause?: Error; pluginId?: string }
  ): EngineError {
    if (options?.pluginId) {
      return new PluginError(options.pluginId, code, message, { metadata: options?.metadata, cause: options?.cause });
    }
    return new EngineError(code, message, { metadata: options?.metadata, cause: options?.cause });
  }
}