import type { PlatformEventBus } from '../../event-bus/interfaces/bus';
import type { JobDefinition } from '../interfaces/job';
import { JobEventType } from '../interfaces/events';

function publishJobEvent(
  eventBus: PlatformEventBus | undefined,
  eventType: string,
  job: JobDefinition<unknown>,
  source: string = 'job-queue',
  extra?: Record<string, unknown>,
): void {
  if (!eventBus) return;
  eventBus.publish(eventType, {
    jobId: job.id,
    jobType: job.type,
    jobStatus: job.status,
    jobPriority: job.priority,
    ...extra,
  }, {
    source,
    metadata: {
      jobId: job.id,
      jobType: job.type,
      eventType,
    },
  });
}

export function publishJobQueued(eventBus: PlatformEventBus | undefined, job: JobDefinition<unknown>): void {
  publishJobEvent(eventBus, JobEventType.JobQueued, job);
}

export function publishJobScheduled(eventBus: PlatformEventBus | undefined, job: JobDefinition<unknown>): void {
  publishJobEvent(eventBus, JobEventType.JobScheduled, job);
}

export function publishJobStarted(eventBus: PlatformEventBus | undefined, job: JobDefinition<unknown>): void {
  publishJobEvent(eventBus, JobEventType.JobStarted, job);
}

export function publishJobCompleted(eventBus: PlatformEventBus | undefined, job: JobDefinition<unknown>): void {
  publishJobEvent(eventBus, JobEventType.JobCompleted, job);
}

export function publishJobFailed(
  eventBus: PlatformEventBus | undefined,
  job: JobDefinition<unknown>,
  error: unknown,
): void {
  publishJobEvent(eventBus, JobEventType.JobFailed, job, 'job-queue', {
    error: error instanceof Error ? error.message : String(error),
  });
}

export function publishJobCancelled(eventBus: PlatformEventBus | undefined, job: JobDefinition<unknown>): void {
  publishJobEvent(eventBus, JobEventType.JobCancelled, job);
}

export function publishJobTimedOut(eventBus: PlatformEventBus | undefined, job: JobDefinition<unknown>): void {
  publishJobEvent(eventBus, JobEventType.JobTimedOut, job);
}

export function publishJobRetrying(eventBus: PlatformEventBus | undefined, job: JobDefinition<unknown>): void {
  publishJobEvent(eventBus, JobEventType.JobRetrying, job);
}