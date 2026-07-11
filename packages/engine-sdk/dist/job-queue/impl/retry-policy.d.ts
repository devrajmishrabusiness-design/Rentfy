import type { JobDefinition } from '../interfaces/job';
import type { BackoffStrategy, RetryPolicy } from '../interfaces/retry';
export declare class ExponentialBackoffRetryPolicy implements RetryPolicy {
    readonly maxRetries: number;
    readonly backoff: BackoffStrategy;
    readonly baseDelay: number;
    readonly maxDelay: number;
    readonly jitter: boolean;
    constructor(options?: {
        maxRetries?: number;
        baseDelay?: number;
        maxDelay?: number;
        jitter?: boolean;
    });
    shouldRetry(job: JobDefinition<unknown>, _error: unknown): boolean;
    getDelay(job: JobDefinition<unknown>): number;
}
export declare class LinearBackoffRetryPolicy implements RetryPolicy {
    readonly maxRetries: number;
    readonly backoff: BackoffStrategy;
    readonly baseDelay: number;
    readonly maxDelay: number;
    readonly jitter: boolean;
    constructor(options?: {
        maxRetries?: number;
        baseDelay?: number;
        maxDelay?: number;
        jitter?: boolean;
    });
    shouldRetry(job: JobDefinition<unknown>, _error: unknown): boolean;
    getDelay(job: JobDefinition<unknown>): number;
}
export declare class FixedBackoffRetryPolicy implements RetryPolicy {
    readonly maxRetries: number;
    readonly backoff: BackoffStrategy;
    readonly baseDelay: number;
    readonly maxDelay: number;
    readonly jitter: boolean;
    constructor(options?: {
        maxRetries?: number;
        baseDelay?: number;
        maxDelay?: number;
        jitter?: boolean;
    });
    shouldRetry(job: JobDefinition<unknown>, _error: unknown): boolean;
    getDelay(_job: JobDefinition<unknown>): number;
}
//# sourceMappingURL=retry-policy.d.ts.map