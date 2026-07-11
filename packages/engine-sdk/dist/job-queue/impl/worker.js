"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryJobWorker = void 0;
const job_1 = require("../interfaces/job");
const event_publisher_1 = require("./event-publisher");
class InMemoryJobWorker {
    concurrency;
    isRunning = false;
    isPaused = false;
    queue;
    activeCount = 0;
    shutdownPromise;
    shutdownResolve;
    processingLoopPromise;
    activeJobs = new Set();
    constructor(queue, options) {
        this.queue = queue;
        this.concurrency = options.concurrency;
    }
    async start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.isPaused = false;
        this.processingLoopPromise = this.runProcessingLoop();
    }
    async stop() {
        return this.gracefulShutdown();
    }
    async gracefulShutdown() {
        if (!this.isRunning || this.shutdownPromise) {
            return this.shutdownPromise;
        }
        this.isRunning = false;
        this.shutdownPromise = new Promise((resolve) => {
            this.shutdownResolve = resolve;
        });
        if (this.activeCount === 0) {
            this.shutdownResolve?.();
        }
        return this.shutdownPromise;
    }
    pause() {
        this.isPaused = true;
    }
    resume() {
        if (!this.isPaused)
            return;
        this.isPaused = false;
        this.notify();
    }
    notify() {
        if (!this.isRunning || this.isPaused)
            return;
        void this.processBatch();
    }
    stats() {
        return {
            active: this.activeCount,
            idle: this.activeCount === 0 && this.isRunning && !this.isPaused,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
        };
    }
    async runProcessingLoop() {
        if (!this.isRunning)
            return;
        while (this.isRunning) {
            if (this.isPaused) {
                await this.sleep(50);
                continue;
            }
            await this.processBatch();
            await this.sleep(10);
        }
    }
    async processBatch() {
        const capacity = this.concurrency - this.activeCount;
        if (capacity <= 0)
            return;
        for (let i = 0; i < capacity; i++) {
            const job = await this.queue.dequeue();
            if (!job)
                break;
            void this.executeJob(job);
        }
    }
    async executeJob(job) {
        if (!this.isRunning)
            return;
        this.activeCount++;
        this.activeJobs.add(job.id);
        const updated = this.queue.markRunning(job.id);
        if (!updated) {
            this.activeCount--;
            this.activeJobs.delete(job.id);
            return;
        }
        (0, event_publisher_1.publishJobStarted)(this.queue.getEventBus(), updated);
        const timeoutMs = updated.metadata.timeout;
        this.queue.setupTimeout(job.id, timeoutMs);
        try {
            const handler = this.queue.getHandler(job.id);
            if (!handler) {
                this.queue.markCompleted(job.id);
                this.activeCount--;
                this.activeJobs.delete(job.id);
                this.checkShutdown();
                return;
            }
            await handler(updated);
            const currentJob = this.queue.getJob(job.id);
            if (currentJob && currentJob.status === job_1.JobStatus.Running) {
                this.queue.cancelTimeout(job.id);
                this.queue.markCompleted(job.id);
            }
        }
        catch (error) {
            this.queue.markFailed(job.id, error);
        }
        this.activeCount--;
        this.activeJobs.delete(job.id);
        this.checkShutdown();
        this.notify();
    }
    checkShutdown() {
        if (!this.isRunning && this.activeCount === 0 && this.shutdownResolve) {
            this.shutdownResolve();
            this.shutdownPromise = undefined;
            this.shutdownResolve = undefined;
        }
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.InMemoryJobWorker = InMemoryJobWorker;
//# sourceMappingURL=worker.js.map