export const JobEventType = {
  JobQueued: 'job.queued',
  JobScheduled: 'job.scheduled',
  JobStarted: 'job.started',
  JobCompleted: 'job.completed',
  JobFailed: 'job.failed',
  JobCancelled: 'job.cancelled',
  JobTimedOut: 'job.timed_out',
  JobRetrying: 'job.retrying',
} as const;

export type JobEventType = (typeof JobEventType)[keyof typeof JobEventType];