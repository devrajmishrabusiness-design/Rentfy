import { InMemoryJobQueue, type InMemoryJobQueueOptions } from './impl/in-memory-queue';
import type { JobQueue } from './interfaces/queue';
import type { PlatformEventBus } from '../event-bus/interfaces/bus';

export type JobQueuePreset = 'memory';

export function createJobQueue(
  preset: JobQueuePreset = 'memory',
  options: InMemoryJobQueueOptions = {},
): JobQueue {
  if (preset === 'memory') {
    return new InMemoryJobQueue(options);
  }
  return new InMemoryJobQueue(options);
}

export function createJobQueueWithEventBus(
  eventBus: PlatformEventBus,
  options: Omit<InMemoryJobQueueOptions, 'eventBus'> = {},
): JobQueue {
  return new InMemoryJobQueue({ ...options, eventBus });
}

export function defaultJobQueue(options?: InMemoryJobQueueOptions): JobQueue {
  return createJobQueue('memory', options);
}