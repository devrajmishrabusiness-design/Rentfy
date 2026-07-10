import { JobStatus } from '../interfaces/job';
import type { JobDefinition, JobHandler, JobType } from '../interfaces/job';
import type { EnqueueOptions, JobQueue, JobQueueOptions, JobQueueStats } from '../interfaces/queue';
import type { RetryPolicy } from '../interfaces/retry';
import { createJob, cloneJob, createJobMetadata } from '../models/job';
import { InMemoryJobWorker, type InMemoryJobWorkerOptions } from './worker';
import type { JobWorker } from '../interfaces/worker';
import { ExponentialBackoffRetryPolicy } from './retry-policy';
import { defaultIdFactory } from '../../event-bus/impl/id-factories';
import type { PlatformEventBus } from '../../event-bus/interfaces/bus';
import { publishJobQueued, publishJobCompleted, publishJobFailed, publishJobCancelled, publishJobTimedOut, publishJobScheduled } from './event-publisher';
import { toJobError } from './job-errors';

interface InternalJob<TPayload = unknown> extends JobDefinition<TPayload> {
  _scheduledTimer?: ReturnType<typeof setTimeout>;
  _timeoutTimer?: ReturnType<typeof setTimeout>;
  _handler?: JobHandler<TPayload>;
}

export interface InMemoryJobQueueOptions extends JobQueueOptions {
  idFactory?: () => string;
  eventBus?: PlatformEventBus;
}

export class InMemoryJobQueue implements JobQueue {
  private readonly jobs: Map<string, InternalJob<unknown>> = new Map();
  private readonly idFactory: () => string;
  private readonly defaultTimeout: number;
  private readonly defaultMaxRetries: number;
  private readonly defaultRetryDelay: number;
  private readonly retryPolicy: RetryPolicy;
  private readonly eventBus?: PlatformEventBus;
  public readonly worker: JobWorker;
  private readonly eventHandlers: Map<string, Set<JobHandler<unknown>>> = new Map();

  constructor(options: InMemoryJobQueueOptions = {}) {
    this.idFactory = options.idFactory ?? defaultIdFactory;
    this.defaultTimeout = options.defaultTimeout ?? 30_000;
    this.defaultMaxRetries = options.defaultMaxRetries ?? 3;
    this.defaultRetryDelay = options.defaultRetryDelay ?? 100;
    this.retryPolicy = options.retryPolicy ?? new ExponentialBackoffRetryPolicy({
      maxRetries: this.defaultMaxRetries,
      baseDelay: this.defaultRetryDelay,
    });
    this.eventBus = options.eventBus;

    const workerOpts: InMemoryJobWorkerOptions = {
      concurrency: options.concurrency ?? 1,
    };
    this.worker = new InMemoryJobWorker(this, workerOpts);
  }

  async enqueue<TPayload = unknown>(
    type: JobType,
    payload: TPayload,
    options: EnqueueOptions = {},
  ): Promise<JobDefinition<TPayload>> {
    const id = this.idFactory();
    const timeout = options.timeout ?? this.defaultTimeout;
    const maxRetries = options.maxRetries ?? this.defaultMaxRetries;

    const meta = createJobMetadata({ timeout, maxRetries, meta: options.metadata });

    const delay = options.delay ?? 0;
    const scheduledAt = options.scheduledAt ?? (delay > 0 ? Date.now() + delay : undefined);

    const status = scheduledAt !== undefined ? JobStatus.Scheduled : JobStatus.Pending;

    const typed = createJob<TPayload>(id, type, payload, options.priority ?? 0, meta, status, scheduledAt) as InternalJob<TPayload>;
    const job = typed as unknown as InternalJob<unknown>;
    this.jobs.set(id, job);

    if (status === JobStatus.Scheduled && scheduledAt !== undefined) {
      const remaining = Math.max(0, scheduledAt - Date.now());
      this.scheduleJob(job, remaining);
      publishJobScheduled(this.eventBus, job);
    } else {
      publishJobQueued(this.eventBus, job);
    }

    this.notifyWorkers();

    return typed;
  }

  async dequeue(): Promise<JobDefinition<unknown> | undefined> {
    const readyJobs = Array.from(this.jobs.values())
      .filter((j) => j.status === JobStatus.Pending)
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.metadata.createdAt - b.metadata.createdAt;
      });

    if (readyJobs.length === 0) return undefined;

    const job = readyJobs[0];
    if (!job) return undefined;
    return job;
  }

  markRunning(jobId: string): JobDefinition<unknown> | undefined {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== JobStatus.Pending) return undefined;

    const updated = cloneJob(job, {
      status: JobStatus.Running,
      metadata: { startedAt: Date.now() },
    }) as InternalJob<unknown>;

    updated._handler = job._handler;
    updated._scheduledTimer = job._scheduledTimer;
    this.jobs.set(jobId, updated);

    return updated;
  }

  markCompleted(jobId: string): JobDefinition<unknown> | undefined {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== JobStatus.Running) return undefined;

    const updated = cloneJob(job, {
      status: JobStatus.Completed,
      metadata: { completedAt: Date.now() },
    }) as InternalJob<unknown>;

    updated._handler = undefined;
    if (updated._timeoutTimer !== undefined) {
      clearTimeout(updated._timeoutTimer);
      updated._timeoutTimer = undefined;
    }
    this.jobs.set(jobId, updated);

    publishJobCompleted(this.eventBus, updated);
    this.emit('completed', updated);

    this.notifyWorkers();
    return updated;
  }

  markFailed(jobId: string, error: unknown): JobDefinition<unknown> | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    const hadTimeout = job._timeoutTimer;
    if (hadTimeout !== undefined) {
      clearTimeout(hadTimeout);
    }

    if (this.retryPolicy.shouldRetry(job, error)) {
      const delay = this.retryPolicy.getDelay(job);
      const retryCount = job.metadata.retryCount + 1;

      const updated = cloneJob(job, {
        status: JobStatus.Pending,
        metadata: {
          retryCount,
          startedAt: undefined,
          completedAt: undefined,
        },
      }) as InternalJob<unknown>;

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

    const updated = cloneJob(job, {
      status: JobStatus.Failed,
      metadata: { completedAt: Date.now() },
    }) as InternalJob<unknown>;

    updated._handler = undefined;
    updated._timeoutTimer = undefined;
    this.jobs.set(jobId, updated);

    const jobErr = toJobError(updated, error);
    publishJobFailed(this.eventBus, updated, jobErr);
    this.emit('failed', updated);

    this.notifyWorkers();
    return updated;
  }

  markTimedOut(jobId: string): JobDefinition<unknown> | undefined {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== JobStatus.Running) return undefined;

    const updated = cloneJob(job, {
      status: JobStatus.TimedOut,
      metadata: { completedAt: Date.now() },
    }) as InternalJob<unknown>;

    updated._handler = undefined;
    updated._timeoutTimer = undefined;
    this.jobs.set(jobId, updated);

    publishJobTimedOut(this.eventBus, updated);
    this.emit('timeout', updated);

    this.notifyWorkers();
    return updated;
  }

  async cancel(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === JobStatus.Completed || job.status === JobStatus.Failed ||
        job.status === JobStatus.Cancelled || job.status === JobStatus.TimedOut) {
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

    const updated = cloneJob(job, {
      status: JobStatus.Cancelled,
      metadata: { completedAt: Date.now() },
    }) as InternalJob<unknown>;

    updated._handler = undefined;
    this.jobs.set(jobId, updated);

    publishJobCancelled(this.eventBus, updated);
    this.emit('cancelled', updated);

    this.notifyWorkers();
    return true;
  }

  async retry(jobId: string): Promise<JobDefinition<unknown> | undefined> {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    if (job.status !== JobStatus.Failed && job.status !== JobStatus.TimedOut) {
      return undefined;
    }

    const updated = cloneJob(job, {
      status: JobStatus.Pending,
      metadata: {
        retryCount: 0,
        startedAt: undefined,
        completedAt: undefined,
      },
    }) as InternalJob<unknown>;

    updated._handler = undefined;
    updated._scheduledTimer = undefined;
    updated._timeoutTimer = undefined;
    this.jobs.set(jobId, updated);

    this.notifyWorkers();
    return updated;
  }

  getJob(jobId: string): JobDefinition<unknown> | undefined {
    return this.jobs.get(jobId);
  }

  getJobs(statuses?: JobStatus[]): JobDefinition<unknown>[] {
    const all = Array.from(this.jobs.values());
    if (!statuses || statuses.length === 0) return all;
    return all.filter((j) => statuses.includes(j.status));
  }

  async clear(): Promise<void> {
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

  getEventBus(): PlatformEventBus | undefined {
    return this.eventBus;
  }

  pause(): void {
    this.worker.pause();
  }

  resume(): void {
    this.worker.resume();
  }

  stats(): JobQueueStats {
    const all = Array.from(this.jobs.values());
    return {
      total: all.length,
      pending: all.filter((j) => j.status === JobStatus.Pending).length,
      scheduled: all.filter((j) => j.status === JobStatus.Scheduled).length,
      running: all.filter((j) => j.status === JobStatus.Running).length,
      completed: all.filter((j) => j.status === JobStatus.Completed).length,
      failed: all.filter((j) => j.status === JobStatus.Failed).length,
      cancelled: all.filter((j) => j.status === JobStatus.Cancelled).length,
      timedOut: all.filter((j) => j.status === JobStatus.TimedOut).length,
    };
  }

  getHandler(jobId: string): JobHandler<unknown> | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    return job._handler;
  }

  setupTimeout(jobId: string, timeoutMs: number): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    if (job._timeoutTimer !== undefined) {
      clearTimeout(job._timeoutTimer);
    }

    job._timeoutTimer = setTimeout(() => {
      this.markTimedOut(jobId);
    }, timeoutMs);
  }

  setHandler(jobId: string, handler: JobHandler<unknown>): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job._handler = handler;
  }

  cancelTimeout(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job || job._timeoutTimer === undefined) return;
    clearTimeout(job._timeoutTimer);
    job._timeoutTimer = undefined;
  }

  protected notifyWorkers(): void {
    (this.worker as InMemoryJobWorker).notify();
  }

  on<TEvent = unknown>(event: string, handler: JobHandler<TEvent>): void {
    let handlers = this.eventHandlers.get(event);
    if (!handlers) {
      handlers = new Set();
      this.eventHandlers.set(event, handlers);
    }
    handlers.add(handler as unknown as JobHandler<unknown>);
  }

  off<TEvent = unknown>(event: string, handler: JobHandler<TEvent>): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;
    handlers.delete(handler as unknown as JobHandler<unknown>);
  }

  protected emit(event: string, job: JobDefinition<unknown>): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(job as unknown as JobDefinition<unknown>);
    }
  }

  private scheduleJob(job: InternalJob<unknown>, delayMs: number): void {
    job._scheduledTimer = setTimeout(() => {
      const currentJob = this.jobs.get(job.id);
      if (!currentJob || currentJob.status !== JobStatus.Scheduled) return;

      const updated = cloneJob(currentJob, {
        status: JobStatus.Pending,
        metadata: { scheduledAt: undefined },
      }) as InternalJob<unknown>;

      updated._handler = currentJob._handler;
      updated._scheduledTimer = undefined;
      this.jobs.set(job.id, updated);

      this.notifyWorkers();
    }, delayMs);
  }
}