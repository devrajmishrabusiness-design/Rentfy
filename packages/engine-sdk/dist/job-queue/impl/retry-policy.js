"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixedBackoffRetryPolicy = exports.LinearBackoffRetryPolicy = exports.ExponentialBackoffRetryPolicy = void 0;
class ExponentialBackoffRetryPolicy {
    maxRetries;
    backoff = 'exponential';
    baseDelay;
    maxDelay;
    jitter;
    constructor(options = {}) {
        this.maxRetries = options.maxRetries ?? 3;
        this.baseDelay = options.baseDelay ?? 100;
        this.maxDelay = options.maxDelay ?? 30_000;
        this.jitter = options.jitter ?? true;
    }
    shouldRetry(job, _error) {
        return job.metadata.retryCount < this.maxRetries;
    }
    getDelay(job) {
        const exp = job.metadata.retryCount;
        let delay = this.baseDelay * Math.pow(2, exp);
        delay = Math.min(delay, this.maxDelay);
        if (this.jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }
        return Math.round(delay);
    }
}
exports.ExponentialBackoffRetryPolicy = ExponentialBackoffRetryPolicy;
class LinearBackoffRetryPolicy {
    maxRetries;
    backoff = 'linear';
    baseDelay;
    maxDelay;
    jitter;
    constructor(options = {}) {
        this.maxRetries = options.maxRetries ?? 3;
        this.baseDelay = options.baseDelay ?? 500;
        this.maxDelay = options.maxDelay ?? 30_000;
        this.jitter = options.jitter ?? false;
    }
    shouldRetry(job, _error) {
        return job.metadata.retryCount < this.maxRetries;
    }
    getDelay(job) {
        let delay = this.baseDelay * (job.metadata.retryCount + 1);
        delay = Math.min(delay, this.maxDelay);
        if (this.jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }
        return Math.round(delay);
    }
}
exports.LinearBackoffRetryPolicy = LinearBackoffRetryPolicy;
class FixedBackoffRetryPolicy {
    maxRetries;
    backoff = 'fixed';
    baseDelay;
    maxDelay;
    jitter;
    constructor(options = {}) {
        this.maxRetries = options.maxRetries ?? 3;
        this.baseDelay = options.baseDelay ?? 500;
        this.maxDelay = this.baseDelay;
        this.jitter = options.jitter ?? false;
    }
    shouldRetry(job, _error) {
        return job.metadata.retryCount < this.maxRetries;
    }
    getDelay(_job) {
        let delay = this.baseDelay;
        if (this.jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }
        return Math.round(delay);
    }
}
exports.FixedBackoffRetryPolicy = FixedBackoffRetryPolicy;
//# sourceMappingURL=retry-policy.js.map