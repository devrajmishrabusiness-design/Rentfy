import type { PluginDefinition, PluginInitContext, PluginExecutionContext, PluginShutdownContext, PluginResult, PluginLogger } from '../types';
export interface PluginExecutor {
    initialize<Config>(plugin: PluginDefinition, context: PluginInitContext<Config>): Promise<void>;
    execute<Input, Output, Config>(plugin: PluginDefinition<Input, Output, Config>, input: Input, context: PluginExecutionContext<Config>): Promise<PluginResult<Output>>;
    shutdown(plugin: PluginDefinition, context: PluginShutdownContext): Promise<void>;
    abort(pluginId: string): void;
    abortAll(): void;
}
export interface ExecutionOptions {
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    onProgress?: (progress: number, message: string) => void;
}
export declare class DefaultPluginExecutor implements PluginExecutor {
    private activeExecutions;
    private logger;
    constructor(logger: PluginLogger);
    initialize<Config>(plugin: PluginDefinition, context: PluginInitContext<Config>): Promise<void>;
    execute<Input, Output, Config>(plugin: PluginDefinition<Input, Output, Config>, input: Input, context: PluginExecutionContext<Config>): Promise<PluginResult<Output>>;
    shutdown(plugin: PluginDefinition, context: PluginShutdownContext): Promise<void>;
    abort(pluginId: string): void;
    abortAll(): void;
    private withTimeout;
}
//# sourceMappingURL=executor.d.ts.map