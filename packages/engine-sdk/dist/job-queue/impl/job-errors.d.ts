import { BaseEngineError } from '../../errors';
import type { JobDefinition } from '../interfaces/job';
export declare function toJobError(job: JobDefinition<unknown>, error: unknown): BaseEngineError;
export declare function createTimeoutError(job: JobDefinition<unknown>, timeoutMs: number): BaseEngineError;
export declare function createCancellationError(job: JobDefinition<unknown>): BaseEngineError;
//# sourceMappingURL=job-errors.d.ts.map