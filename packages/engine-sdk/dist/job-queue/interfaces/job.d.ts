export declare enum JobStatus {
    Pending = "pending",
    Scheduled = "scheduled",
    Running = "running",
    Completed = "completed",
    Failed = "failed",
    Cancelled = "cancelled",
    TimedOut = "timed_out"
}
export interface JobMetadata {
    readonly createdAt: number;
    readonly scheduledAt?: number;
    readonly startedAt?: number;
    readonly completedAt?: number;
    readonly retryCount: number;
    readonly maxRetries: number;
    readonly timeout: number;
    readonly meta?: Readonly<Record<string, unknown>>;
}
export interface JobDefinition<TPayload = unknown> {
    readonly id: string;
    readonly type: string;
    readonly priority: number;
    readonly status: JobStatus;
    readonly payload: TPayload;
    readonly metadata: JobMetadata;
}
export type JobHandler<TPayload = unknown> = (job: JobDefinition<TPayload>) => void | Promise<void>;
export type JobType = string;
//# sourceMappingURL=job.d.ts.map