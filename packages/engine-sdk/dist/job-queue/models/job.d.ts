import { JobStatus, type JobDefinition, type JobMetadata } from '../interfaces/job';
export declare function createJobMetadata(options: {
    createdAt?: number;
    timeout: number;
    maxRetries: number;
    meta?: Readonly<Record<string, unknown>>;
}): JobMetadata;
export declare function createJob<TPayload = unknown>(id: string, type: string, payload: TPayload, priority: number, metadata: JobMetadata, status?: JobStatus, scheduledAt?: number): JobDefinition<TPayload>;
export declare function cloneJob<TPayload = unknown>(job: JobDefinition<TPayload>, overrides?: Partial<Pick<JobDefinition<TPayload>, 'status'>> & {
    metadata?: Partial<JobMetadata>;
}): JobDefinition<TPayload>;
//# sourceMappingURL=job.d.ts.map