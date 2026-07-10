import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryJobQueue,
  InMemoryJobWorker,
  JobStatus,
  createJobQueue,
  createJobQueueWithEventBus,
  defaultJobQueue,
  ExponentialBackoffRetryPolicy,
  LinearBackoffRetryPolicy,
  FixedBackoffRetryPolicy,
  JobEventType,
  publishJobQueued,
} from '../src/job-queue';
import { DefaultPlatformEventBus } from '../src/event-bus/impl/default-bus';
import { MemoryEventBusTransport } from '../src/event-bus/transports/memory-event-bus';
import type { PlatformEventBus } from '../src/event-bus/interfaces/bus';
import type { JobQueue } from '../src/job-queue/interfaces/queue';
import type { JobDefinition } from '../src/job-queue/interfaces/job';

function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

describe('JobQueue', () => {
  describe('JobStatus', () => {
    it('should have all statuses', () => {
      expect(JobStatus.Pending).toBe('pending');
      expect(JobStatus.Scheduled).toBe('scheduled');
      expect(JobStatus.Running).toBe('running');
      expect(JobStatus.Completed).toBe('completed');
      expect(JobStatus.Failed).toBe('failed');
      expect(JobStatus.Cancelled).toBe('cancelled');
      expect(JobStatus.TimedOut).toBe('timed_out');
    });
  });

  describe('InMemoryJobQueue — basic operations', () => {
    it('should enqueue a job', async () => {
      const queue = createJobQueue('memory');
      const job = await queue.enqueue('test.task', { value: 42 });
      expect(job.id).toBeDefined();
      expect(job.type).toBe('test.task');
      expect(job.payload).toEqual({ value: 42 });
      expect(job.status).toBe(JobStatus.Pending);
      expect(job.priority).toBe(0);
      expect(job.metadata.createdAt).toBeGreaterThan(0);
      expect(job.metadata.maxRetries).toBe(3);
      expect(job.metadata.timeout).toBe(30_000);
    });

    it('should enqueue with custom options', async () => {
      const queue = createJobQueue('memory');
      const job = await queue.enqueue('task', { x: 1 }, {
        priority: 5,
        timeout: 5000,
        maxRetries: 2,
        metadata: { key: 'val' },
      });
      expect(job.priority).toBe(5);
      expect(job.metadata.timeout).toBe(5000);
      expect(job.metadata.maxRetries).toBe(2);
      expect(job.metadata.meta).toEqual({ key: 'val' });
    });

    it('should get a job by ID', async () => {
      const queue = createJobQueue('memory');
      const j = await queue.enqueue('t', {});
      const found = queue.getJob(j.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(j.id);
    });

    it('should return undefined for unknown job', () => {
      const queue = createJobQueue('memory');
      expect(queue.getJob('nonexistent')).toBeUndefined();
    });

    it('should return all jobs', async () => {
      const queue = createJobQueue('memory');
      await queue.enqueue('a', {});
      await queue.enqueue('b', {});
      const all = queue.getJobs();
      expect(all.length).toBe(2);
    });

    it('should filter jobs by status', async () => {
      const queue = createJobQueue('memory');
      queue.pause();
      await queue.enqueue('a', {});
      await queue.enqueue('b', {});
      const pending = queue.getJobs([JobStatus.Pending]);
      expect(pending.length).toBe(2);
      const running = queue.getJobs([JobStatus.Running]);
      expect(running.length).toBe(0);
    });
  });

  describe('InMemoryJobQueue — FIFO ordering', () => {
    it('should process jobs in FIFO order for same priority', async () => {
      const executed: { name: string }[] = [];
      const queue = createJobQueue('memory', { concurrency: 1 });
      const inner = queue as InMemoryJobQueue;

      inner.on('completed', (_job) => {
        executed.push((_job as JobDefinition<{ name: string }>).payload);
      });

      const w = inner.worker as InMemoryJobWorker;

      const j1 = await queue.enqueue('t', { name: 'first' });
      inner.setHandler(j1.id, async () => {});
      const j2 = await queue.enqueue('t', { name: 'second' });
      inner.setHandler(j2.id, async () => {});
      const j3 = await queue.enqueue('t', { name: 'third' });
      inner.setHandler(j3.id, async () => {});

      await w.start();
      await delay(50);
      await w.stop();

      expect(executed[0]!.name).toBe('first');
      expect(executed[1]!.name).toBe('second');
      expect(executed[2]!.name).toBe('third');
    });

    it('should process higher priority jobs first', async () => {
      const executed: { name: string }[] = [];
      const queue = createJobQueue('memory', { concurrency: 1 });
      const inner = queue as InMemoryJobQueue;

      inner.on('completed', (_job) => {
        executed.push((_job as JobDefinition<{ name: string }>).payload);
      });

      const j1 = await queue.enqueue('t', { name: 'normal' }, { priority: 0 });
      inner.setHandler(j1.id, async () => {});
      const j2 = await queue.enqueue('t', { name: 'high' }, { priority: 10 });
      inner.setHandler(j2.id, async () => {});
      const j3 = await queue.enqueue('t', { name: 'highest' }, { priority: 100 });
      inner.setHandler(j3.id, async () => {});

      const w = inner.worker as InMemoryJobWorker;
      await w.start();
      await delay(50);
      await w.stop();

      expect(executed[0]!.name).toBe('highest');
      expect(executed[1]!.name).toBe('high');
      expect(executed[2]!.name).toBe('normal');
    });
  });

  describe('InMemoryJobQueue — delayed/scheduled jobs', () => {
    it('should execute delayed jobs after delay', async () => {
      const executed: { name: string }[] = [];
      const queue = createJobQueue('memory', { concurrency: 1 });
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;

      inner.on('completed', (_job) => {
        executed.push((_job as JobDefinition<{ name: string }>).payload);
      });

      const j = await queue.enqueue('t', { name: 'delayed' }, { delay: 100 });
      inner.setHandler(j.id, async () => {});

      await w.start();
      await delay(30);
      expect(executed.length).toBe(0);

      await delay(150);
      expect(executed[0]!.name).toBe('delayed');

      await w.stop();
    });

    it('should set Scheduled status for delayed jobs', async () => {
      const queue = createJobQueue('memory');
      const j = await queue.enqueue('t', {}, { delay: 5000 });
      expect(j.status).toBe(JobStatus.Scheduled);
      expect(j.metadata.scheduledAt).toBeDefined();
    });
  });

  describe('InMemoryJobQueue — retries and backoff', () => {
    it('should retry failed jobs up to maxRetries', async () => {
      let attempts = 0;
      const queue = createJobQueue('memory', {
        concurrency: 1,
        defaultMaxRetries: 2,
        defaultRetryDelay: 20,
      });
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;

      const j = await queue.enqueue('t', {}, { maxRetries: 2 });
      inner.setHandler(j.id, async () => {
        attempts++;
        throw new Error('fail');
      });

      await w.start();
      await delay(600);
      await w.stop();

      expect(attempts).toBe(3);
    });

    it('should mark job as Failed after maxRetries exhausted', async () => {
      const queue = createJobQueue('memory', {
        concurrency: 1,
        defaultMaxRetries: 1,
        defaultRetryDelay: 20,
      });
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;

      const j = await queue.enqueue('t', {}, { maxRetries: 1 });
      inner.setHandler(j.id, async () => {
        throw new Error('fail');
      });

      await w.start();
      await delay(600);
      await w.stop();

      const final = queue.getJob(j.id);
      expect(final!.status).toBe(JobStatus.Failed);
      expect(final!.metadata.retryCount).toBeGreaterThanOrEqual(1);
    });

    it('should complete on retry success', async () => {
      let callCount = 0;
      const queue = createJobQueue('memory', {
        concurrency: 1,
        defaultMaxRetries: 3,
        defaultRetryDelay: 20,
      });
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;

      const j = await queue.enqueue('t', {}, { maxRetries: 3 });
      inner.setHandler(j.id, async () => {
        callCount++;
        if (callCount < 3) throw new Error('fail');
      });

      await w.start();
      await delay(600);
      await w.stop();

      const final = queue.getJob(j.id);
      expect(final!.status).toBe(JobStatus.Completed);
    });
  });

  describe('ExponentialBackoffRetryPolicy', () => {
    it('should return exponential delays', () => {
      const policy = new ExponentialBackoffRetryPolicy({ maxRetries: 5, baseDelay: 100 });
      expect(policy.backoff).toBe('exponential');
      expect(policy.shouldRetry({
        metadata: { retryCount: 0, maxRetries: 5, timeout: 10000, createdAt: 0 },
      } as JobDefinition, new Error('x'))).toBe(true);
      const delay0 = policy.getDelay({
        metadata: { retryCount: 0, maxRetries: 5, timeout: 10000, createdAt: 0 },
      } as JobDefinition);
      const delay2 = policy.getDelay({
        metadata: { retryCount: 2, maxRetries: 5, timeout: 10000, createdAt: 0 },
      } as JobDefinition);
      expect(delay2).toBeGreaterThan(delay0);
    });

    it('should not retry after maxRetries', () => {
      const policy = new ExponentialBackoffRetryPolicy({ maxRetries: 2 });
      expect(policy.shouldRetry({
        metadata: { retryCount: 2, maxRetries: 2, timeout: 10000, createdAt: 0 },
      } as JobDefinition, new Error('x'))).toBe(false);
    });

    it('should cap delay at maxDelay', () => {
      const policy = new ExponentialBackoffRetryPolicy({ maxDelay: 1000, baseDelay: 200 });
      const delay = policy.getDelay({
        metadata: { retryCount: 10, maxRetries: 20, timeout: 10000, createdAt: 0 },
      } as JobDefinition);
      expect(delay).toBeLessThanOrEqual(1000);
    });
  });

  describe('LinearBackoffRetryPolicy', () => {
    it('should return linear delays', () => {
      const policy = new LinearBackoffRetryPolicy({ baseDelay: 100 });
      expect(policy.backoff).toBe('linear');
      const delay0 = policy.getDelay({
        metadata: { retryCount: 0, maxRetries: 5, timeout: 10000, createdAt: 0 },
      } as JobDefinition);
      const delay2 = policy.getDelay({
        metadata: { retryCount: 2, maxRetries: 5, timeout: 10000, createdAt: 0 },
      } as JobDefinition);
      expect(delay2).toBeGreaterThan(delay0);
    });
  });

  describe('FixedBackoffRetryPolicy', () => {
    it('should return constant delays', () => {
      const policy = new FixedBackoffRetryPolicy({ baseDelay: 500 });
      expect(policy.backoff).toBe('fixed');
      const delay0 = policy.getDelay({
        metadata: { retryCount: 0, maxRetries: 5, timeout: 10000, createdAt: 0 },
      } as JobDefinition);
      const delay5 = policy.getDelay({
        metadata: { retryCount: 5, maxRetries: 5, timeout: 10000, createdAt: 0 },
      } as JobDefinition);
      expect(delay5).toBeGreaterThanOrEqual(delay0 * 0.5);
    });
  });

  describe('InMemoryJobQueue — cancellation', () => {
    it('should cancel a pending job', async () => {
      const queue = createJobQueue('memory');
      queue.pause();
      const j = await queue.enqueue('t', {});
      const result = await queue.cancel(j.id);
      expect(result).toBe(true);
      const job = queue.getJob(j.id);
      expect(job!.status).toBe(JobStatus.Cancelled);
    });

    it('should cancel a scheduled job', async () => {
      const queue = createJobQueue('memory');
      const j = await queue.enqueue('t', {}, { delay: 10000 });
      expect(j.status).toBe(JobStatus.Scheduled);
      const result = await queue.cancel(j.id);
      expect(result).toBe(true);
      const job = queue.getJob(j.id);
      expect(job!.status).toBe(JobStatus.Cancelled);
    });

    it('should not cancel completed job', async () => {
      const queue = createJobQueue('memory', { concurrency: 1 });
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;
      queue.pause();
      const j = await queue.enqueue('t', {});
      inner.setHandler(j.id, async () => {});
      queue.resume();
      await w.start();
      await delay(50);
      const result = await queue.cancel(j.id);
      expect(result).toBe(false);
      await w.stop();
    });

    it('should return false for nonexistent job', async () => {
      const queue = createJobQueue('memory');
      const result = await queue.cancel('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('InMemoryJobQueue — retry failed job', () => {
    it('should re-enqueue a failed job for retry', async () => {
      const queue = createJobQueue('memory', { concurrency: 1, defaultMaxRetries: 0 });
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;

      const j = await queue.enqueue('t', {}, { maxRetries: 0 });
      inner.setHandler(j.id, async () => { throw new Error('fail'); });

      await w.start();
      await delay(100);
      await w.stop();

      expect(queue.getJob(j.id)!.status).toBe(JobStatus.Failed);

      const retried = await queue.retry(j.id);
      expect(retried).toBeDefined();
      expect(retried!.status).toBe(JobStatus.Pending);
    });

    it('should not retry a non-failed job', async () => {
      const queue = createJobQueue('memory');
      queue.pause();
      const j = await queue.enqueue('t', {});
      const result = await queue.retry(j.id);
      expect(result).toBeUndefined();
    });
  });

  describe('InMemoryJobQueue — timeout', () => {
    it('should mark job as TimedOut if handler runs longer than timeout', async () => {
      const queue = createJobQueue('memory', { concurrency: 1 });
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;

      const j = await queue.enqueue('t', {}, { timeout: 20 });
      inner.setHandler(j.id, async () => {
        await delay(500);
      });

      await w.start();
      await delay(100);
      await w.stop();

      const job = queue.getJob(j.id);
      expect(job!.status).toBe(JobStatus.TimedOut);
    });
  });

  describe('InMemoryJobQueue — concurrency', () => {
    it('should respect concurrency limit', async () => {
      const queue = createJobQueue('memory', { concurrency: 2 });
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;

      const j1 = await queue.enqueue('t', {});
      inner.setHandler(j1.id, async () => { await delay(40); });
      const j2 = await queue.enqueue('t', {});
      inner.setHandler(j2.id, async () => { await delay(40); });
      const j3 = await queue.enqueue('t', {});
      inner.setHandler(j3.id, async () => { await delay(20); });

      await w.start();
      await delay(120);
      await w.stop();

      expect(queue.getJob(j1.id)!.status).toBe(JobStatus.Completed);
      expect(queue.getJob(j2.id)!.status).toBe(JobStatus.Completed);
      expect(queue.getJob(j3.id)!.status).toBe(JobStatus.Completed);
    });
  });

  describe('InMemoryJobQueue — graceful shutdown', () => {
    it('should wait for active jobs before stopping', async () => {
      const queue = createJobQueue('memory', { concurrency: 1 });
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;

      const j = await queue.enqueue('t', {});
      let handlerCalled = false;
      inner.setHandler(j.id, async () => {
        await delay(50);
        handlerCalled = true;
      });

      await w.start();
      await delay(15);
      await w.stop();

      expect(handlerCalled).toBe(true);
      const job = queue.getJob(j.id);
      expect(job!.status).toBe(JobStatus.Completed);
    });
  });

  describe('InMemoryJobQueue — pause/resume', () => {
    it('should not process jobs while paused', async () => {
      const queue = createJobQueue('memory', { concurrency: 1 });
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;

      await w.start();

      queue.pause();
      const j = await queue.enqueue('t', {});
      let executed = false;
      inner.setHandler(j.id, async () => { executed = true; });

      await delay(100);
      expect(executed).toBe(false);
      expect(queue.getJob(j.id)!.status).toBe(JobStatus.Pending);

      queue.resume();
      await delay(50);
      expect(executed).toBe(true);
      expect(queue.getJob(j.id)!.status).toBe(JobStatus.Completed);

      await w.stop();
    });
  });

  describe('InMemoryJobQueue — worker lifecycle', () => {
    it('should start and stop worker', async () => {
      const queue = createJobQueue('memory');
      const w = queue.worker as InMemoryJobWorker;
      expect(w.isRunning).toBe(false);
      await w.start();
      expect(w.isRunning).toBe(true);
      await w.stop();
      expect(w.isRunning).toBe(false);
    });

    it('should handle double start gracefully', async () => {
      const queue = createJobQueue('memory');
      const w = queue.worker as InMemoryJobWorker;
      await w.start();
      await w.start();
      expect(w.isRunning).toBe(true);
      await w.stop();
    });
  });

  describe('InMemoryJobQueue — worker failures', () => {
    it('should not stop queue when handler throws', async () => {
      const queue = createJobQueue('memory', { concurrency: 1, defaultMaxRetries: 0 });
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;

      const j1 = await queue.enqueue('t', {}, { maxRetries: 0 });
      inner.setHandler(j1.id, async () => { throw new Error('boom'); });

      const j2 = await queue.enqueue('t', {});
      inner.setHandler(j2.id, async () => {});

      await w.start();
      await delay(100);
      await w.stop();

      expect(queue.getJob(j1.id)!.status).toBe(JobStatus.Failed);
      expect(queue.getJob(j2.id)!.status).toBe(JobStatus.Completed);
    });

    it('should handle multiple consecutive failures', async () => {
      const queue = createJobQueue('memory', { concurrency: 1, defaultMaxRetries: 0 });
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;

      for (let i = 0; i < 5; i++) {
        const j = await queue.enqueue('failer', {}, { maxRetries: 0 });
        inner.setHandler(j.id, async () => { throw new Error(`fail ${i}`); });
      }

      await w.start();
      await delay(500);
      await w.stop();

      const failedCount = queue.getJobs([JobStatus.Failed]).length;
      expect(failedCount).toBe(5);
    });
  });

  describe('InMemoryJobQueue — event publishing via EventBus', () => {
    let eventBus: PlatformEventBus;
    let queue: JobQueue;

    beforeEach(() => {
      eventBus = new DefaultPlatformEventBus({ transport: new MemoryEventBusTransport(), defaultSource: 'test' });
      queue = createJobQueueWithEventBus(eventBus, { concurrency: 1 });
    });

    it('should emit JobQueued event', async () => {
      const events: string[] = [];
      eventBus.subscribe(JobEventType.JobQueued, () => { events.push('queued'); });

      await queue.enqueue('t', {});
      expect(events).toContain('queued');
    });

    it('should emit job lifecycle events', async () => {
      const captured: string[] = [];
      eventBus.subscribe(JobEventType.JobQueued, () => captured.push('queued'));
      eventBus.subscribe(JobEventType.JobStarted, () => captured.push('started'));
      eventBus.subscribe(JobEventType.JobCompleted, () => captured.push('completed'));

      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;

      const j = await queue.enqueue('t', {});
      inner.setHandler(j.id, async () => {});

      await w.start();
      await delay(50);
      await w.stop();

      expect(captured).toContain('queued');
      expect(captured).toContain('started');
      expect(captured).toContain('completed');
    });

    it('should emit JobFailed event', async () => {
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;

      let failed = false;
      eventBus.subscribe(JobEventType.JobFailed, () => { failed = true; });

      const j = await queue.enqueue('t', {}, { maxRetries: 0 });
      inner.setHandler(j.id, async () => { throw new Error('fail'); });

      await w.start();
      await delay(100);
      await w.stop();

      expect(failed).toBe(true);
    });

    it('should emit JobCancelled event', async () => {
      let cancelled = false;
      eventBus.subscribe(JobEventType.JobCancelled, () => { cancelled = true; });

      const j = await queue.enqueue('t', {});
      await queue.cancel(j.id);

      expect(cancelled).toBe(true);
    });

    it('should emit JobTimedOut event', async () => {
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;

      let timedOut = false;
      eventBus.subscribe(JobEventType.JobTimedOut, () => { timedOut = true; });

      const j = await queue.enqueue('t', {}, { timeout: 20 });
      inner.setHandler(j.id, async () => { await delay(200); });

      await w.start();
      await delay(80);
      await w.stop();

      expect(timedOut).toBe(true);
    });
  });

  describe('InMemoryJobQueue — stats', () => {
    it('should return accurate stats', async () => {
      const queue = createJobQueue('memory', { concurrency: 1 });
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;

      queue.pause();
      await queue.enqueue('t', {});
      await queue.enqueue('t', {}, { delay: 10000 });

      let stats = queue.stats();
      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.scheduled).toBe(1);

      const j = await queue.enqueue('t', {});
      inner.setHandler(j.id, async () => {});

      queue.resume();
      await w.start();
      await delay(100);
      await w.stop();

      stats = queue.stats();
      expect(stats.completed).toBeGreaterThanOrEqual(1);
    });
  });

  describe('InMemoryJobQueue — clear', () => {
    it('should clear all jobs', async () => {
      const queue = createJobQueue('memory');
      queue.pause();
      await queue.enqueue('a', {});
      await queue.enqueue('b', {});
      expect(queue.getJobs().length).toBe(2);
      await queue.clear();
      expect(queue.getJobs().length).toBe(0);
    });
  });

  describe('InMemoryJobQueue — metadata', () => {
    it('should preserve metadata through lifecycle', async () => {
      const queue = createJobQueue('memory', { concurrency: 1 });
      const inner = queue as InMemoryJobQueue;
      const w = inner.worker as InMemoryJobWorker;
      queue.pause();

      const j = await queue.enqueue('t', { name: 'test' }, {
        metadata: { source: 'api', userId: '123' },
        priority: 3,
      });
      inner.setHandler(j.id, async () => {});

      expect(j.metadata.meta).toEqual({ source: 'api', userId: '123' });
      expect(j.priority).toBe(3);

      queue.resume();
      await w.start();
      await delay(50);
      await w.stop();

      const final = queue.getJob(j.id);
      expect(final!.metadata.meta).toEqual({ source: 'api', userId: '123' });
    });
  });

  describe('factory', () => {
    it('should create default job queue', () => {
      const q = defaultJobQueue();
      expect(q).toBeDefined();
      expect(q.worker).toBeDefined();
    });

    it('should create job queue with event bus', () => {
      const eb = new DefaultPlatformEventBus({ transport: new MemoryEventBusTransport() });
      const q = createJobQueueWithEventBus(eb);
      expect(q).toBeDefined();
    });

    it('should create memory job queue', () => {
      const q = createJobQueue('memory');
      expect(q).toBeDefined();
    });
  });

  describe('event publisher utilities', () => {
    it('should publish events through event bus', () => {
      const eb = new DefaultPlatformEventBus({ transport: new MemoryEventBusTransport() });
      const recorded: string[] = [];
      eb.subscribe(JobEventType.JobQueued, () => { recorded.push('queued'); });

      const job: JobDefinition = {
        id: '1', type: 't', priority: 0, status: JobStatus.Pending, payload: {},
        metadata: { createdAt: 0, retryCount: 0, maxRetries: 3, timeout: 1000 },
      } as JobDefinition;

      publishJobQueued(eb, job);
      expect(recorded).toContain('queued');
    });
  });
});