export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
    source?: string;
    traceId?: string;
    spanId?: string;
    error?: {
        name: string;
        message: string;
        stack?: string;
        cause?: string;
    };
}
export type LogFormatter = (entry: LogEntry) => string;
export interface LogTransport {
    write(entry: LogEntry): void;
    flush(): void | Promise<void>;
}
export interface StructuredLogger {
    trace(message: string, meta?: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>, err?: Error): void;
    fatal(message: string, meta?: Record<string, unknown>, err?: Error): void;
    child(bindings: Record<string, unknown>): StructuredLogger;
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
    addTransport(transport: LogTransport): void;
    removeTransport(transport: LogTransport): void;
    flush(): Promise<void>;
}
//# sourceMappingURL=logger.d.ts.map