import type { JobDefinition, JobHandler, JobStatus, JobType } from './job';
import type { RetryPolicy } from './retry';
import type { JobWorker } from './worker';
export interface EnqueueOptions {
    readonly priority?: number;
    readonly delay?: number;
    readonly scheduledAt?: number;
    readonly timeout?: number;
    readonly maxRetries?: number;
    readonly retryDelay?: number;
    readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface JobQueueOptions {
    readonly concurrency?: number;
    readonly defaultTimeout?: number;
    readonly defaultMaxRetries?: number;
    readonly defaultRetryDelay?: number;
    readonly retryPolicy?: RetryPolicy;
}
export interface JobQueueStats {
    readonly total: number;
    readonly pending: number;
    readonly scheduled: number;
    readonly running: number;
    readonly completed: number;
    readonly failed: number;
    readonly cancelled: number;
    readonly timedOut: number;
}
export interface JobQueue {
    enqueue<TPayload = unknown>(type: JobType, payload: TPayload, options?: EnqueueOptions): Promise<JobDefinition<TPayload>>;
    dequeue(): Promise<JobDefinition<unknown> | undefined>;
    cancel(jobId: string): Promise<boolean>;
    retry(jobId: string): Promise<JobDefinition<unknown> | undefined>;
    getJob(jobId: string): JobDefinition<unknown> | undefined;
    getJobs(statuses?: JobStatus[]): JobDefinition<unknown>[];
    clear(): Promise<void>;
    pause(): void;
    resume(): void;
    stats(): JobQueueStats;
    worker: JobWorker;
    on<TEvent = unknown>(event: string, handler: JobHandler<TEvent>): void;
    off<TEvent = unknown>(event: string, handler: JobHandler<TEvent>): void;
}
//# sourceMappingURL=queue.d.ts.map