"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultHandlerErrorReporter = void 0;
const errors_1 = require("../../errors");
class DefaultHandlerErrorReporter {
    logger;
    captured = [];
    captureEnabled;
    constructor(options) {
        this.logger = options?.logger;
        this.captureEnabled = options?.capture === true;
    }
    report = (error, context) => {
        if (this.captureEnabled) {
            this.captured.push({ context, error });
        }
        this.logger?.(error, context);
    };
    static fromUnknown(type, unknown, context) {
        const cause = unknown instanceof Error ? unknown : undefined;
        const message = cause ? cause.message : 'Unknown handler error';
        return new errors_1.EngineError(errors_1.EngineErrorCode.PLUGIN_EXECUTION_FAILED, `Event handler for "${type}" failed: ${message}`, {
            metadata: {
                eventType: type,
                eventId: context.event.id,
                subscriptionId: context.subscriptionId,
                handlerSource: context.event.source,
                correlationId: context.event.correlationId,
            },
            cause,
        });
    }
    getCaptured() {
        return [...this.captured];
    }
    clearCaptured() {
        this.captured.length = 0;
    }
}
exports.DefaultHandlerErrorReporter = DefaultHandlerErrorReporter;
//# sourceMappingURL=error-reporter.js.map