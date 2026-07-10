import type { PluginDefinition, PluginResult, EngineEventHandler, EngineMetrics } from '../types';
import { EngineStatus } from '../types';
import { EngineError } from '../errors';
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
export declare class DefaultLifecycleManager implements LifecycleManager {
    private status;
    private plugins;
    private pluginRegistry;
    private pluginExecutor;
    private eventBus;
    private logger;
    private storage;
    private metrics;
    private abortController;
    private options;
    constructor(options?: LifecycleOptions);
    initialize(plugins: PluginDefinition[]): Promise<void>;
    execute<Input, Output>(plugin: PluginDefinition<Input, Output>, input: Input): Promise<PluginResult<Output>>;
    shutdown(): Promise<void>;
    abortAll(): void;
    getStatus(): EngineStatus;
    getMetrics(): EngineMetrics;
    private validateDependencies;
    private initializePlugins;
    private createContext;
    private createInitContext;
    private createExecutionContext;
    private createShutdownContext;
    private generateRunId;
    private emit;
    on(event: string, handler: EngineEventHandler): void;
    off(event: string, handler: EngineEventHandler): void;
    private hooks;
}
//# sourceMappingURL=manager.d.ts.map