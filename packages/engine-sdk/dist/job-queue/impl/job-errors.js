"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJobError = toJobError;
exports.createTimeoutError = createTimeoutError;
exports.createCancellationError = createCancellationError;
const errors_1 = require("../../errors");
function toJobError(job, error) {
    if (errors_1.BaseEngineError.isEngineError(error)) {
        return error;
    }
    const message = error instanceof Error ? error.message : String(error);
    return new errors_1.EngineError(errors_1.EngineErrorCode.PLUGIN_EXECUTION_FAILED, message, {
        metadata: { jobId: job.id, jobType: job.type },
        cause: error instanceof Error ? error : undefined,
    });
}
function createTimeoutError(job, timeoutMs) {
    return new errors_1.EngineError(errors_1.EngineErrorCode.TIMEOUT, `Job ${job.id} timed out after ${timeoutMs}ms`, {
        metadata: { jobId: job.id, jobType: job.type, timeout: timeoutMs },
    });
}
function createCancellationError(job) {
    return new errors_1.EngineError(errors_1.EngineErrorCode.ABORTED, `Job ${job.id} was cancelled`, {
        metadata: { jobId: job.id, jobType: job.type },
    });
}
//# sourceMappingURL=job-errors.js.map