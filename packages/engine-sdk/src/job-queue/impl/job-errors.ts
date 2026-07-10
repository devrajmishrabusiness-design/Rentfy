import { BaseEngineError, EngineErrorCode, EngineError } from '../../errors';
import type { JobDefinition } from '../interfaces/job';

export function toJobError(job: JobDefinition<unknown>, error: unknown): BaseEngineError {
  if (BaseEngineError.isEngineError(error)) {
    return error;
  }
  const message = error instanceof Error ? error.message : String(error);
  return new EngineError(EngineErrorCode.PLUGIN_EXECUTION_FAILED, message, {
    metadata: { jobId: job.id, jobType: job.type },
    cause: error instanceof Error ? error : undefined,
  });
}

export function createTimeoutError(job: JobDefinition<unknown>, timeoutMs: number): BaseEngineError {
  return new EngineError(EngineErrorCode.TIMEOUT, `Job ${job.id} timed out after ${timeoutMs}ms`, {
    metadata: { jobId: job.id, jobType: job.type, timeout: timeoutMs },
  });
}

export function createCancellationError(job: JobDefinition<unknown>): BaseEngineError {
  return new EngineError(EngineErrorCode.ABORTED, `Job ${job.id} was cancelled`, {
    metadata: { jobId: job.id, jobType: job.type },
  });
}