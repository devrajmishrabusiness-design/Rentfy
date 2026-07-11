"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishJobQueued = publishJobQueued;
exports.publishJobScheduled = publishJobScheduled;
exports.publishJobStarted = publishJobStarted;
exports.publishJobCompleted = publishJobCompleted;
exports.publishJobFailed = publishJobFailed;
exports.publishJobCancelled = publishJobCancelled;
exports.publishJobTimedOut = publishJobTimedOut;
exports.publishJobRetrying = publishJobRetrying;
const events_1 = require("../interfaces/events");
function publishJobEvent(eventBus, eventType, job, source = 'job-queue', extra) {
    if (!eventBus)
        return;
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
function publishJobQueued(eventBus, job) {
    publishJobEvent(eventBus, events_1.JobEventType.JobQueued, job);
}
function publishJobScheduled(eventBus, job) {
    publishJobEvent(eventBus, events_1.JobEventType.JobScheduled, job);
}
function publishJobStarted(eventBus, job) {
    publishJobEvent(eventBus, events_1.JobEventType.JobStarted, job);
}
function publishJobCompleted(eventBus, job) {
    publishJobEvent(eventBus, events_1.JobEventType.JobCompleted, job);
}
function publishJobFailed(eventBus, job, error) {
    publishJobEvent(eventBus, events_1.JobEventType.JobFailed, job, 'job-queue', {
        error: error instanceof Error ? error.message : String(error),
    });
}
function publishJobCancelled(eventBus, job) {
    publishJobEvent(eventBus, events_1.JobEventType.JobCancelled, job);
}
function publishJobTimedOut(eventBus, job) {
    publishJobEvent(eventBus, events_1.JobEventType.JobTimedOut, job);
}
function publishJobRetrying(eventBus, job) {
    publishJobEvent(eventBus, events_1.JobEventType.JobRetrying, job);
}
//# sourceMappingURL=event-publisher.js.map