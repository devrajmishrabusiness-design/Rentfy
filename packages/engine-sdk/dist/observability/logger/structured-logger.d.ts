import type { StructuredLogger, LogLevel, LogEntry, LogTransport, LogFormatter } from '../interfaces/logger';
export declare class DefaultStructuredLogger implements StructuredLogger {
    private minLevel;
    private transports;
    private bindings;
    private source;
    private formatter;
    private traceId?;
    private spanId?;
    constructor(options?: {
        minLevel?: LogLevel;
        source?: string;
        bindings?: Record<string, unknown>;
        transports?: LogTransport[];
        formatter?: LogFormatter;
        traceId?: string;
        spanId?: string;
    });
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
    setTraceContext(traceId: string, spanId: string): void;
    private write;
}
export declare class ConsoleLogTransport implements LogTransport {
    write(entry: LogEntry): void;
    flush(): void;
}
//# sourceMappingURL=structured-logger.d.ts.map