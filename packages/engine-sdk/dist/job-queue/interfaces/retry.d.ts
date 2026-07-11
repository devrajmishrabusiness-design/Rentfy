import type { JobDefinition } from './job';
export type BackoffStrategy = 'exponential' | 'linear' | 'fixed';
export interface RetryPolicy {
    readonly maxRetries: number;
    readonly backoff: BackoffStrategy;
    readonly baseDelay: number;
    readonly maxDelay: number;
    readonly jitter?: boolean;
    shouldRetry(job: JobDefinition<unknown>, error: unknown): boolean;
    getDelay(job: JobDefinition<unknown>): number;
}
//# sourceMappingURL=retry.d.ts.map