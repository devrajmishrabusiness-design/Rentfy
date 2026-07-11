"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJobMetadata = createJobMetadata;
exports.createJob = createJob;
exports.cloneJob = cloneJob;
const job_1 = require("../interfaces/job");
function createJobMetadata(options) {
    return {
        createdAt: options.createdAt ?? Date.now(),
        retryCount: 0,
        maxRetries: options.maxRetries,
        timeout: options.timeout,
        meta: options.meta,
    };
}
function createJob(id, type, payload, priority, metadata, status = job_1.JobStatus.Pending, scheduledAt) {
    return {
        id,
        type,
        priority,
        status,
        payload,
        metadata: {
            ...metadata,
            scheduledAt,
        },
    };
}
function cloneJob(job, overrides = {}) {
    return {
        ...job,
        status: overrides.status ?? job.status,
        metadata: {
            ...job.metadata,
            ...overrides.metadata,
        },
    };
}
//# sourceMappingURL=job.js.map