import type { PluginLogger } from '../types';
export interface EngineLogger extends PluginLogger {
    child(meta: Record<string, unknown>): PluginLogger;
}
export declare class DefaultEngineLogger implements EngineLogger {
    private readonly prefix;
    private readonly context;
    private readonly logger;
    constructor(prefix: string, context?: Record<string, unknown>);
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
    child(meta: Record<string, unknown>): PluginLogger;
}
//# sourceMappingURL=logger.d.ts.map