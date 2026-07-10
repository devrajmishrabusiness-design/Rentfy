import type { JobWorker, JobWorkerStats } from '../interfaces/worker';
import type { JobDefinition } from '../interfaces/job';
import { JobStatus } from '../interfaces/job';
import type { InMemoryJobQueue } from './in-memory-queue';
import { publishJobStarted } from './event-publisher';

export interface InMemoryJobWorkerOptions {
  concurrency: number;
}

export class InMemoryJobWorker implements JobWorker {
  public readonly concurrency: number;
  public isRunning: boolean = false;
  public isPaused: boolean = false;

  private readonly queue: InMemoryJobQueue;
  private activeCount: number = 0;
  private shutdownPromise?: Promise<void>;
  private shutdownResolve?: () => void;
  private processingLoopPromise?: Promise<void>;
  private activeJobs: Set<string> = new Set();

  constructor(queue: InMemoryJobQueue, options: InMemoryJobWorkerOptions) {
    this.queue = queue;
    this.concurrency = options.concurrency;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.processingLoopPromise = this.runProcessingLoop();
  }

  async stop(): Promise<void> {
    return this.gracefulShutdown();
  }

  private async gracefulShutdown(): Promise<void> {
    if (!this.isRunning || this.shutdownPromise) {
      return this.shutdownPromise;
    }

    this.isRunning = false;

    this.shutdownPromise = new Promise<void>((resolve) => {
      this.shutdownResolve = resolve;
    });

    if (this.activeCount === 0) {
      this.shutdownResolve?.();
    }

    return this.shutdownPromise;
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.notify();
  }

  notify(): void {
    if (!this.isRunning || this.isPaused) return;
    void this.processBatch();
  }

  stats(): JobWorkerStats {
    return {
      active: this.activeCount,
      idle: this.activeCount === 0 && this.isRunning && !this.isPaused,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
    };
  }

  private async runProcessingLoop(): Promise<void> {
    if (!this.isRunning) return;
    while (this.isRunning) {
      if (this.isPaused) {
        await this.sleep(50);
        continue;
      }

      await this.processBatch();
      await this.sleep(10);
    }
  }

  private async processBatch(): Promise<void> {
    const capacity = this.concurrency - this.activeCount;
    if (capacity <= 0) return;

    for (let i = 0; i < capacity; i++) {
      const job = await this.queue.dequeue();
      if (!job) break;

      void this.executeJob(job);
    }
  }

  private async executeJob(job: JobDefinition<unknown>): Promise<void> {
    if (!this.isRunning) return;

    this.activeCount++;
    this.activeJobs.add(job.id);

    const updated = this.queue.markRunning(job.id);
    if (!updated) {
      this.activeCount--;
      this.activeJobs.delete(job.id);
      return;
    }

    publishJobStarted(this.queue.getEventBus(), updated);

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

      await handler(updated as JobDefinition<unknown>);

      const currentJob = this.queue.getJob(job.id);
      if (currentJob && currentJob.status === JobStatus.Running) {
        this.queue.cancelTimeout(job.id);
        this.queue.markCompleted(job.id);
      }
    } catch (error: unknown) {
      this.queue.markFailed(job.id, error);
    }

    this.activeCount--;
    this.activeJobs.delete(job.id);
    this.checkShutdown();
    this.notify();
  }

  private checkShutdown(): void {
    if (!this.isRunning && this.activeCount === 0 && this.shutdownResolve) {
      this.shutdownResolve();
      this.shutdownPromise = undefined;
      this.shutdownResolve = undefined;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}