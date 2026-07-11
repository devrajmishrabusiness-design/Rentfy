"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleLogTransport = exports.DefaultStructuredLogger = void 0;
const LOG_LEVEL_VALUES = {
    trace: 0,
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    fatal: 50,
};
const DEFAULT_FORMATTER = (entry) => {
    return JSON.stringify(entry);
};
class DefaultStructuredLogger {
    minLevel;
    transports = [];
    bindings;
    source;
    formatter;
    traceId;
    spanId;
    constructor(options) {
        this.minLevel = options?.minLevel ?? 'trace';
        this.source = options?.source ?? 'default';
        this.bindings = options?.bindings ?? {};
        this.transports = options?.transports ?? [];
        this.formatter = options?.formatter ?? DEFAULT_FORMATTER;
        this.traceId = options?.traceId;
        this.spanId = options?.spanId;
    }
    trace(message, meta) {
        this.write('trace', message, meta);
    }
    debug(message, meta) {
        this.write('debug', message, meta);
    }
    info(message, meta) {
        this.write('info', message, meta);
    }
    warn(message, meta) {
        this.write('warn', message, meta);
    }
    error(message, meta, err) {
        this.write('error', message, meta, err);
    }
    fatal(message, meta, err) {
        this.write('fatal', message, meta, err);
    }
    child(bindings) {
        return new DefaultStructuredLogger({
            minLevel: this.minLevel,
            source: this.source,
            transports: [...this.transports],
            formatter: this.formatter,
            bindings: { ...this.bindings, ...bindings },
            traceId: this.traceId,
            spanId: this.spanId,
        });
    }
    setLevel(level) {
        this.minLevel = level;
    }
    getLevel() {
        return this.minLevel;
    }
    addTransport(transport) {
        this.transports.push(transport);
    }
    removeTransport(transport) {
        const idx = this.transports.indexOf(transport);
        if (idx >= 0) {
            this.transports.splice(idx, 1);
        }
    }
    async flush() {
        for (const transport of this.transports) {
            const result = transport.flush();
            if (result instanceof Promise) {
                await result;
            }
        }
    }
    setTraceContext(traceId, spanId) {
        this.traceId = traceId;
        this.spanId = spanId;
    }
    write(level, message, meta, err) {
        if (LOG_LEVEL_VALUES[level] < LOG_LEVEL_VALUES[this.minLevel]) {
            return;
        }
        const entry = {
            timestamp: Date.now(),
            level,
            message,
            context: { ...this.bindings, ...meta },
            source: this.source,
            traceId: this.traceId,
            spanId: this.spanId,
        };
        if (err) {
            entry.error = {
                name: err.name,
                message: err.message,
                stack: err.stack,
                cause: err.cause?.message,
            };
        }
        for (const transport of this.transports) {
            transport.write(entry);
        }
    }
}
exports.DefaultStructuredLogger = DefaultStructuredLogger;
class ConsoleLogTransport {
    write(entry) {
        const formatted = JSON.stringify(entry);
        switch (entry.level) {
            case 'fatal':
            case 'error':
                console.error(formatted);
                break;
            case 'warn':
                console.warn(formatted);
                break;
            case 'debug':
            case 'trace':
                console.debug(formatted);
                break;
            default:
                console.log(formatted);
        }
    }
    flush() { }
}
exports.ConsoleLogTransport = ConsoleLogTransport;
//# sourceMappingURL=structured-logger.js.map