import type { JobWorker, JobWorkerStats } from '../interfaces/worker';
import type { InMemoryJobQueue } from './in-memory-queue';
export interface InMemoryJobWorkerOptions {
    concurrency: number;
}
export declare class InMemoryJobWorker implements JobWorker {
    readonly concurrency: number;
    isRunning: boolean;
    isPaused: boolean;
    private readonly queue;
    private activeCount;
    private shutdownPromise?;
    private shutdownResolve?;
    private processingLoopPromise?;
    private activeJobs;
    constructor(queue: InMemoryJobQueue, options: InMemoryJobWorkerOptions);
    start(): Promise<void>;
    stop(): Promise<void>;
    private gracefulShutdown;
    pause(): void;
    resume(): void;
    notify(): void;
    stats(): JobWorkerStats;
    private runProcessingLoop;
    private processBatch;
    private executeJob;
    private checkShutdown;
    private sleep;
}
//# sourceMappingURL=worker.d.ts.map