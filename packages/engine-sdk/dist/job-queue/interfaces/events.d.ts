export declare const JobEventType: {
    readonly JobQueued: "job.queued";
    readonly JobScheduled: "job.scheduled";
    readonly JobStarted: "job.started";
    readonly JobCompleted: "job.completed";
    readonly JobFailed: "job.failed";
    readonly JobCancelled: "job.cancelled";
    readonly JobTimedOut: "job.timed_out";
    readonly JobRetrying: "job.retrying";
};
export type JobEventType = (typeof JobEventType)[keyof typeof JobEventType];
//# sourceMappingURL=events.d.ts.map