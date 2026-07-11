"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobStatus = void 0;
var JobStatus;
(function (JobStatus) {
    JobStatus["Pending"] = "pending";
    JobStatus["Scheduled"] = "scheduled";
    JobStatus["Running"] = "running";
    JobStatus["Completed"] = "completed";
    JobStatus["Failed"] = "failed";
    JobStatus["Cancelled"] = "cancelled";
    JobStatus["TimedOut"] = "timed_out";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
//# sourceMappingURL=job.js.map