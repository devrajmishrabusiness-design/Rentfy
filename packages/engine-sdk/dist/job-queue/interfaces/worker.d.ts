import type { JobDefinition } from './job';
export type JobListener = (job: JobDefinition<unknown>) => void | Promise<void>;
export interface JobWorker {
    readonly isRunning: boolean;
    readonly isPaused: boolean;
    readonly concurrency: number;
    start(): Promise<void>;
    stop(): Promise<void>;
    pause(): void;
    resume(): void;
    stats(): JobWorkerStats;
}
export interface JobWorkerStats {
    readonly active: number;
    readonly idle: boolean;
    readonly isRunning: boolean;
    readonly isPaused: boolean;
}
export type JobWorkerFn = (job: JobDefinition<unknown>) => Promise<void>;
//# sourceMappingURL=worker.d.ts.map