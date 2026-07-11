"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultEngineLogger = void 0;
const observability_1 = require("../observability");
class DefaultEngineLogger {
    prefix;
    context;
    logger;
    constructor(prefix, context = {}) {
        this.prefix = prefix;
        this.context = context;
        this.logger = new observability_1.DefaultStructuredLogger({
            source: prefix,
            bindings: context,
            transports: [new observability_1.ConsoleLogTransport()],
        });
    }
    debug(message, meta) {
        this.logger.debug(message, meta);
    }
    info(message, meta) {
        this.logger.info(message, meta);
    }
    warn(message, meta) {
        this.logger.warn(message, meta);
    }
    error(message, meta) {
        this.logger.error(message, meta);
    }
    child(meta) {
        return new DefaultEngineLogger(this.prefix, { ...this.context, ...meta });
    }
}
exports.DefaultEngineLogger = DefaultEngineLogger;
//# sourceMappingURL=logger.js.map