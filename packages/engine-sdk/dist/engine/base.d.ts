import type { EngineInfo, EngineConfig, EngineMetrics, EngineHooks, EngineEvent, EngineEventHandler, EngineHealth, PluginDefinition, PluginConfig, PluginInitContext, PluginExecutionContext, PluginShutdownContext, PluginLogger, PluginStorage, PluginMetrics, EventBus, PluginRegistry, PluginExecutor } from '../types';
import { EngineStatus } from '../types';
import { EngineErrorCode, EngineError } from '../errors';
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
export declare abstract class AbstractEngine<Config extends EngineConfig = EngineConfig> implements BaseEngine<Config> {
    readonly info: EngineInfo;
    readonly config: Config;
    status: EngineStatus;
    metrics: EngineMetrics;
    protected readonly hooks: EngineHooks;
    protected readonly eventBus: EventBus;
    protected readonly logger: PluginLogger;
    protected readonly storage: PluginStorage;
    protected readonly pluginRegistry: PluginRegistry;
    protected readonly pluginExecutor: PluginExecutor;
    protected readonly pluginMetrics: PluginMetrics;
    protected initialized: boolean;
    protected running: boolean;
    protected abortController: AbortController;
    constructor(info: EngineInfo, config: Config, hooks?: EngineHooks, options?: {
        eventBus?: EventBus;
        logger?: PluginLogger;
        storage?: PluginStorage;
        pluginRegistry?: PluginRegistry;
        pluginExecutor?: PluginExecutor;
        pluginMetrics?: PluginMetrics;
    });
    protected setupDefaultHooks(): void;
    protected getInitialMetrics(): EngineMetrics;
    initialize(config?: Partial<Config>): Promise<void>;
    protected abstract validateConfig(config: Config): Promise<void>;
    protected abstract registerPlugins(plugins: PluginConfig[]): Promise<void>;
    protected abstract onInitialize(): Promise<void>;
    start(): Promise<void>;
    protected abstract onStart(): Promise<void>;
    stop(): Promise<void>;
    protected abstract onStop(): Promise<void>;
    dispose(): Promise<void>;
    protected abstract onDispose(): Promise<void>;
    health(): Promise<EngineHealth>;
    protected checkStorage(): Promise<boolean>;
    on(event: string, handler: EngineEventHandler): void;
    off(event: string, handler: EngineEventHandler): void;
    emit(event: EngineEvent): void;
    protected initializePlugins(): Promise<void>;
    protected shutdownPlugins(): Promise<void>;
    protected createInitContext<Config>(plugin: PluginDefinition): PluginInitContext<Config>;
    protected createExecutionContext<Config>(plugin: PluginDefinition, metadata?: Record<string, unknown>): PluginExecutionContext<Config>;
    protected createShutdownContext(plugin: PluginDefinition): PluginShutdownContext;
    protected generateRunId(): string;
    protected createError(code: EngineErrorCode, message: string, options?: {
        metadata?: Record<string, unknown>;
        cause?: Error;
        pluginId?: string;
    }): EngineError;
}
//# sourceMappingURL=base.d.ts.map