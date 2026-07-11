import { type InMemoryJobQueueOptions } from './impl/in-memory-queue';
import type { JobQueue } from './interfaces/queue';
import type { PlatformEventBus } from '../event-bus/interfaces/bus';
export type JobQueuePreset = 'memory';
export declare function createJobQueue(preset?: JobQueuePreset, options?: InMemoryJobQueueOptions): JobQueue;
export declare function createJobQueueWithEventBus(eventBus: PlatformEventBus, options?: Omit<InMemoryJobQueueOptions, 'eventBus'>): JobQueue;
export declare function defaultJobQueue(options?: InMemoryJobQueueOptions): JobQueue;
//# sourceMappingURL=factory.d.ts.map