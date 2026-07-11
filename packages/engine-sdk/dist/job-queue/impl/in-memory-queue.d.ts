import { JobStatus } from '../interfaces/job';
import type { JobDefinition, JobHandler, JobType } from '../interfaces/job';
import type { EnqueueOptions, JobQueue, JobQueueOptions, JobQueueStats } from '../interfaces/queue';
import type { JobWorker } from '../interfaces/worker';
import type { PlatformEventBus } from '../../event-bus/interfaces/bus';
export interface InMemoryJobQueueOptions extends JobQueueOptions {
    idFactory?: () => string;
    eventBus?: PlatformEventBus;
}
export declare class InMemoryJobQueue implements JobQueue {
    private readonly jobs;
    private readonly idFactory;
    private readonly defaultTimeout;
    private readonly defaultMaxRetries;
    private readonly defaultRetryDelay;
    private readonly retryPolicy;
    private readonly eventBus?;
    readonly worker: JobWorker;
    private readonly eventHandlers;
    constructor(options?: InMemoryJobQueueOptions);
    enqueue<TPayload = unknown>(type: JobType, payload: TPayload, options?: EnqueueOptions): Promise<JobDefinition<TPayload>>;
    dequeue(): Promise<JobDefinition<unknown> | undefined>;
    markRunning(jobId: string): JobDefinition<unknown> | undefined;
    markCompleted(jobId: string): JobDefinition<unknown> | undefined;
    markFailed(jobId: string, error: unknown): JobDefinition<unknown> | undefined;
    markTimedOut(jobId: string): JobDefinition<unknown> | undefined;
    cancel(jobId: string): Promise<boolean>;
    retry(jobId: string): Promise<JobDefinition<unknown> | undefined>;
    getJob(jobId: string): JobDefinition<unknown> | undefined;
    getJobs(statuses?: JobStatus[]): JobDefinition<unknown>[];
    clear(): Promise<void>;
    getEventBus(): PlatformEventBus | undefined;
    pause(): void;
    resume(): void;
    stats(): JobQueueStats;
    getHandler(jobId: string): JobHandler<unknown> | undefined;
    setupTimeout(jobId: string, timeoutMs: number): void;
    setHandler(jobId: string, handler: JobHandler<unknown>): void;
    cancelTimeout(jobId: string): void;
    protected notifyWorkers(): void;
    on<TEvent = unknown>(event: string, handler: JobHandler<TEvent>): void;
    off<TEvent = unknown>(event: string, handler: JobHandler<TEvent>): void;
    protected emit(event: string, job: JobDefinition<unknown>): void;
    private scheduleJob;
}
//# sourceMappingURL=in-memory-queue.d.ts.map