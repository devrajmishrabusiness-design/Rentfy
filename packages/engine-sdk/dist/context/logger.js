"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultEngineLogger = void 0;
class DefaultEngineLogger {
    prefix;
    context;
    constructor(prefix, context = {}) {
        this.prefix = prefix;
        this.context = context;
    }
    debug(message, meta) {
        this.log('debug', message, meta);
    }
    info(message, meta) {
        this.log('info', message, meta);
    }
    warn(message, meta) {
        this.log('warn', message, meta);
    }
    error(message, meta) {
        this.log('error', message, meta);
    }
    child(meta) {
        return new DefaultEngineLogger(this.prefix, { ...this.context, ...meta });
    }
    log(level, message, meta) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            prefix: this.prefix,
            message,
            context: { ...this.context, ...meta },
        };
        switch (level) {
            case 'debug':
            case 'info':
                console.log(JSON.stringify(logEntry));
                break;
            case 'warn':
                console.warn(JSON.stringify(logEntry));
                break;
            case 'error':
                console.error(JSON.stringify(logEntry));
                break;
        }
    }
}
exports.DefaultEngineLogger = DefaultEngineLogger;
//# sourceMappingURL=logger.js.map