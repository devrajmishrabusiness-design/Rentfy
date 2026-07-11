"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryJobQueue = void 0;
const job_1 = require("../interfaces/job");
const job_2 = require("../models/job");
const worker_1 = require("./worker");
const retry_policy_1 = require("./retry-policy");
const id_factories_1 = require("../../event-bus/impl/id-factories");
const event_publisher_1 = require("./event-publisher");
const job_errors_1 = require("./job-errors");
class InMemoryJobQueue {
    jobs = new Map();
    idFactory;
    defaultTimeout;
    defaultMaxRetries;
    defaultRetryDelay;
    retryPolicy;
    eventBus;
    worker;
    eventHandlers = new Map();
    constructor(options = {}) {
        this.idFactory = options.idFactory ?? id_factories_1.defaultIdFactory;
        this.defaultTimeout = options.defaultTimeout ?? 30_000;
        this.defaultMaxRetries = options.defaultMaxRetries ?? 3;
        this.defaultRetryDelay = options.defaultRetryDelay ?? 100;
        this.retryPolicy = options.retryPolicy ?? new retry_policy_1.ExponentialBackoffRetryPolicy({
            maxRetries: this.defaultMaxRetries,
            baseDelay: this.defaultRetryDelay,
        });
        this.eventBus = options.eventBus;
        const workerOpts = {
            concurrency: options.concurrency ?? 1,
        };
        this.worker = new worker_1.InMemoryJobWorker(this, workerOpts);
    }
    async enqueue(type, payload, options = {}) {
        const id = this.idFactory();
        const timeout = options.timeout ?? this.defaultTimeout;
        const maxRetries = options.maxRetries ?? this.defaultMaxRetries;
        const meta = (0, job_2.createJobMetadata)({ timeout, maxRetries, meta: options.metadata });
        const delay = options.delay ?? 0;
        const scheduledAt = options.scheduledAt ?? (delay > 0 ? Date.now() + delay : undefined);
        const status = scheduledAt !== undefined ? job_1.JobStatus.Scheduled : job_1.JobStatus.Pending;
        const typed = (0, job_2.createJob)(id, type, payload, options.priority ?? 0, meta, status, scheduledAt);
        const job = typed;
        this.jobs.set(id, job);
        if (status === job_1.JobStatus.Scheduled && scheduledAt !== undefined) {
            const remaining = Math.max(0, scheduledAt - Date.now());
            this.scheduleJob(job, remaining);
            (0, event_publisher_1.publishJobScheduled)(this.eventBus, job);
        }
        else {
            (0, event_publisher_1.publishJobQueued)(this.eventBus, job);
        }
        this.notifyWorkers();
        return typed;
    }
    async dequeue() {
        const readyJobs = Array.from(this.jobs.values())
            .filter((j) => j.status === job_1.JobStatus.Pending)
            .sort((a, b) => {
            if (b.priority !== a.priority)
                return b.priority - a.priority;
            return a.metadata.createdAt - b.metadata.createdAt;
        });
        if (readyJobs.length === 0)
            return undefined;
        const job = readyJobs[0];
        if (!job)
            return undefined;
        return job;
    }
    markRunning(jobId) {
        const job = this.jobs.get(jobId);
        if (!job || job.status !== job_1.JobStatus.Pending)
            return undefined;
        const updated = (0, job_2.cloneJob)(job, {
            status: job_1.JobStatus.Running,
            metadata: { startedAt: Date.now() },
        });
        updated._handler = job._handler;
        updated._scheduledTimer = job._scheduledTimer;
        this.jobs.set(jobId, updated);
        return updated;
    }
    markCompleted(jobId) {
        const job = this.jobs.get(jobId);
        if (!job || job.status !== job_1.JobStatus.Running)
            return undefined;
        const updated = (0, job_2.cloneJob)(job, {
            status: job_1.JobStatus.Completed,
            metadata: { completedAt: Date.now() },
        });
        updated._handler = undefined;
        if (updated._timeoutTimer !== undefined) {
            clearTimeout(updated._timeoutTimer);
            updated._timeoutTimer = undefined;
        }
        this.jobs.set(jobId, updated);
        (0, event_publisher_1.publishJobCompleted)(this.eventBus, updated);
        this.emit('completed', updated);
        this.notifyWorkers();
        return updated;
    }
    markFailed(jobId, error) {
        const job = this.jobs.get(jobId);
        if (!job)
            return undefined;
        const hadTimeout = job._timeoutTimer;
        if (hadTimeout !== undefined) {
            clearTimeout(hadTimeout);
        }
        if (this.retryPolicy.shouldRetry(job, error)) {
            const delay = this.retryPolicy.getDelay(job);
            const retryCount = job.metadata.retryCount + 1;
            const updated = (0, job_2.cloneJob)(job, {
                status: job_1.JobStatus.Pending,
                metadata: {
                    retryCount,
                    startedAt: undefined,
                    completedAt: undefined,
                },
            });
            updated._handler = job._handler;
            updated._scheduledTimer = undefined;
            updated._timeoutTimer = undefined;
            this.jobs.set(jobId, updated);
            setTimeout(() => {
                this.notifyWorkers();
            }, delay);
            this.emit('retrying', updated);
            return updated;
        }
        const updated = (0, job_2.cloneJob)(job, {
            status: job_1.JobStatus.Failed,
            metadata: { completedAt: Date.now() },
        });
        updated._handler = undefined;
        updated._timeoutTimer = undefined;
        this.jobs.set(jobId, updated);
        const jobErr = (0, job_errors_1.toJobError)(updated, error);
        (0, event_publisher_1.publishJobFailed)(this.eventBus, updated, jobErr);
        this.emit('failed', updated);
        this.notifyWorkers();
        return updated;
    }
    markTimedOut(jobId) {
        const job = this.jobs.get(jobId);
        if (!job || job.status !== job_1.JobStatus.Running)
            return undefined;
        const updated = (0, job_2.cloneJob)(job, {
            status: job_1.JobStatus.TimedOut,
            metadata: { completedAt: Date.now() },
        });
        updated._handler = undefined;
        updated._timeoutTimer = undefined;
        this.jobs.set(jobId, updated);
        (0, event_publisher_1.publishJobTimedOut)(this.eventBus, updated);
        this.emit('timeout', updated);
        this.notifyWorkers();
        return updated;
    }
    async cancel(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            return false;
        if (job.status === job_1.JobStatus.Completed || job.status === job_1.JobStatus.Failed ||
            job.status === job_1.JobStatus.Cancelled || job.status === job_1.JobStatus.TimedOut) {
            return false;
        }
        if (job._scheduledTimer !== undefined) {
            clearTimeout(job._scheduledTimer);
            job._scheduledTimer = undefined;
        }
        if (job._timeoutTimer !== undefined) {
            clearTimeout(job._timeoutTimer);
            job._timeoutTimer = undefined;
        }
        const updated = (0, job_2.cloneJob)(job, {
            status: job_1.JobStatus.Cancelled,
            metadata: { completedAt: Date.now() },
        });
        updated._handler = undefined;
        this.jobs.set(jobId, updated);
        (0, event_publisher_1.publishJobCancelled)(this.eventBus, updated);
        this.emit('cancelled', updated);
        this.notifyWorkers();
        return true;
    }
    async retry(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            return undefined;
        if (job.status !== job_1.JobStatus.Failed && job.status !== job_1.JobStatus.TimedOut) {
            return undefined;
        }
        const updated = (0, job_2.cloneJob)(job, {
            status: job_1.JobStatus.Pending,
            metadata: {
                retryCount: 0,
                startedAt: undefined,
                completedAt: undefined,
            },
        });
        updated._handler = undefined;
        updated._scheduledTimer = undefined;
        updated._timeoutTimer = undefined;
        this.jobs.set(jobId, updated);
        this.notifyWorkers();
        return updated;
    }
    getJob(jobId) {
        return this.jobs.get(jobId);
    }
    getJobs(statuses) {
        const all = Array.from(this.jobs.values());
        if (!statuses || statuses.length === 0)
            return all;
        return all.filter((j) => statuses.includes(j.status));
    }
    async clear() {
        for (const job of this.jobs.values()) {
            if (job._scheduledTimer !== undefined) {
                clearTimeout(job._scheduledTimer);
            }
            if (job._timeoutTimer !== undefined) {
                clearTimeout(job._timeoutTimer);
            }
        }
        this.jobs.clear();
    }
    getEventBus() {
        return this.eventBus;
    }
    pause() {
        this.worker.pause();
    }
    resume() {
        this.worker.resume();
    }
    stats() {
        const all = Array.from(this.jobs.values());
        return {
            total: all.length,
            pending: all.filter((j) => j.status === job_1.JobStatus.Pending).length,
            scheduled: all.filter((j) => j.status === job_1.JobStatus.Scheduled).length,
            running: all.filter((j) => j.status === job_1.JobStatus.Running).length,
            completed: all.filter((j) => j.status === job_1.JobStatus.Completed).length,
            failed: all.filter((j) => j.status === job_1.JobStatus.Failed).length,
            cancelled: all.filter((j) => j.status === job_1.JobStatus.Cancelled).length,
            timedOut: all.filter((j) => j.status === job_1.JobStatus.TimedOut).length,
        };
    }
    getHandler(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            return undefined;
        return job._handler;
    }
    setupTimeout(jobId, timeoutMs) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        if (job._timeoutTimer !== undefined) {
            clearTimeout(job._timeoutTimer);
        }
        job._timeoutTimer = setTimeout(() => {
            this.markTimedOut(jobId);
        }, timeoutMs);
    }
    setHandler(jobId, handler) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        job._handler = handler;
    }
    cancelTimeout(jobId) {
        const job = this.jobs.get(jobId);
        if (!job || job._timeoutTimer === undefined)
            return;
        clearTimeout(job._timeoutTimer);
        job._timeoutTimer = undefined;
    }
    notifyWorkers() {
        this.worker.notify();
    }
    on(event, handler) {
        let handlers = this.eventHandlers.get(event);
        if (!handlers) {
            handlers = new Set();
            this.eventHandlers.set(event, handlers);
        }
        handlers.add(handler);
    }
    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (!handlers)
            return;
        handlers.delete(handler);
    }
    emit(event, job) {
        const handlers = this.eventHandlers.get(event);
        if (!handlers)
            return;
        for (const handler of handlers) {
            handler(job);
        }
    }
    scheduleJob(job, delayMs) {
        job._scheduledTimer = setTimeout(() => {
            const currentJob = this.jobs.get(job.id);
            if (!currentJob || currentJob.status !== job_1.JobStatus.Scheduled)
                return;
            const updated = (0, job_2.cloneJob)(currentJob, {
                status: job_1.JobStatus.Pending,
                metadata: { scheduledAt: undefined },
            });
            updated._handler = currentJob._handler;
            updated._scheduledTimer = undefined;
            this.jobs.set(job.id, updated);
            this.notifyWorkers();
        }, delayMs);
    }
}
exports.InMemoryJobQueue = InMemoryJobQueue;
//# sourceMappingURL=in-memory-queue.js.map