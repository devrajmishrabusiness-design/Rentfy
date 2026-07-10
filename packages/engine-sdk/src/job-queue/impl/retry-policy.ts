import type { JobDefinition } from '../interfaces/job';
import type { BackoffStrategy, RetryPolicy } from '../interfaces/retry';

export class ExponentialBackoffRetryPolicy implements RetryPolicy {
  public readonly maxRetries: number;
  public readonly backoff: BackoffStrategy = 'exponential';
  public readonly baseDelay: number;
  public readonly maxDelay: number;
  public readonly jitter: boolean;

  constructor(options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    jitter?: boolean;
  } = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelay = options.baseDelay ?? 100;
    this.maxDelay = options.maxDelay ?? 30_000;
    this.jitter = options.jitter ?? true;
  }

  shouldRetry(job: JobDefinition<unknown>, _error: unknown): boolean {
    return job.metadata.retryCount < this.maxRetries;
  }

  getDelay(job: JobDefinition<unknown>): number {
    const exp = job.metadata.retryCount;
    let delay = this.baseDelay * Math.pow(2, exp);
    delay = Math.min(delay, this.maxDelay);
    if (this.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    return Math.round(delay);
  }
}

export class LinearBackoffRetryPolicy implements RetryPolicy {
  public readonly maxRetries: number;
  public readonly backoff: BackoffStrategy = 'linear';
  public readonly baseDelay: number;
  public readonly maxDelay: number;
  public readonly jitter: boolean;

  constructor(options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    jitter?: boolean;
  } = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelay = options.baseDelay ?? 500;
    this.maxDelay = options.maxDelay ?? 30_000;
    this.jitter = options.jitter ?? false;
  }

  shouldRetry(job: JobDefinition<unknown>, _error: unknown): boolean {
    return job.metadata.retryCount < this.maxRetries;
  }

  getDelay(job: JobDefinition<unknown>): number {
    let delay = this.baseDelay * (job.metadata.retryCount + 1);
    delay = Math.min(delay, this.maxDelay);
    if (this.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    return Math.round(delay);
  }
}

export class FixedBackoffRetryPolicy implements RetryPolicy {
  public readonly maxRetries: number;
  public readonly backoff: BackoffStrategy = 'fixed';
  public readonly baseDelay: number;
  public readonly maxDelay: number;
  public readonly jitter: boolean;

  constructor(options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    jitter?: boolean;
  } = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelay = options.baseDelay ?? 500;
    this.maxDelay = this.baseDelay;
    this.jitter = options.jitter ?? false;
  }

  shouldRetry(job: JobDefinition<unknown>, _error: unknown): boolean {
    return job.metadata.retryCount < this.maxRetries;
  }

  getDelay(_job: JobDefinition<unknown>): number {
    let delay = this.baseDelay;
    if (this.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    return Math.round(delay);
  }
}