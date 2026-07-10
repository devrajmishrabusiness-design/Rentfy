import { JobStatus, type JobDefinition, type JobMetadata } from '../interfaces/job';

export function createJobMetadata(options: {
  createdAt?: number;
  timeout: number;
  maxRetries: number;
  meta?: Readonly<Record<string, unknown>>;
}): JobMetadata {
  return {
    createdAt: options.createdAt ?? Date.now(),
    retryCount: 0,
    maxRetries: options.maxRetries,
    timeout: options.timeout,
    meta: options.meta,
  };
}

export function createJob<TPayload = unknown>(
  id: string,
  type: string,
  payload: TPayload,
  priority: number,
  metadata: JobMetadata,
  status: JobStatus = JobStatus.Pending,
  scheduledAt?: number,
): JobDefinition<TPayload> {
  return {
    id,
    type,
    priority,
    status,
    payload,
    metadata: {
      ...metadata,
      scheduledAt,
    },
  };
}

export function cloneJob<TPayload = unknown>(
  job: JobDefinition<TPayload>,
  overrides: Partial<Pick<JobDefinition<TPayload>, 'status'>> & {
    metadata?: Partial<JobMetadata>;
  } = {},
): JobDefinition<TPayload> {
  return {
    ...job,
    status: overrides.status ?? job.status,
    metadata: {
      ...job.metadata,
      ...overrides.metadata,
    },
  };
}