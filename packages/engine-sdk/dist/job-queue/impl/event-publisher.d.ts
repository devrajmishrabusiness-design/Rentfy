import type { PlatformEventBus } from '../../event-bus/interfaces/bus';
import type { JobDefinition } from '../interfaces/job';
export declare function publishJobQueued(eventBus: PlatformEventBus | undefined, job: JobDefinition<unknown>): void;
export declare function publishJobScheduled(eventBus: PlatformEventBus | undefined, job: JobDefinition<unknown>): void;
export declare function publishJobStarted(eventBus: PlatformEventBus | undefined, job: JobDefinition<unknown>): void;
export declare function publishJobCompleted(eventBus: PlatformEventBus | undefined, job: JobDefinition<unknown>): void;
export declare function publishJobFailed(eventBus: PlatformEventBus | undefined, job: JobDefinition<unknown>, error: unknown): void;
export declare function publishJobCancelled(eventBus: PlatformEventBus | undefined, job: JobDefinition<unknown>): void;
export declare function publishJobTimedOut(eventBus: PlatformEventBus | undefined, job: JobDefinition<unknown>): void;
export declare function publishJobRetrying(eventBus: PlatformEventBus | undefined, job: JobDefinition<unknown>): void;
//# sourceMappingURL=event-publisher.d.ts.map