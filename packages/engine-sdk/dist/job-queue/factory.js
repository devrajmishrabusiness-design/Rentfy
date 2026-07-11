"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJobQueue = createJobQueue;
exports.createJobQueueWithEventBus = createJobQueueWithEventBus;
exports.defaultJobQueue = defaultJobQueue;
const in_memory_queue_1 = require("./impl/in-memory-queue");
function createJobQueue(preset = 'memory', options = {}) {
    if (preset === 'memory') {
        return new in_memory_queue_1.InMemoryJobQueue(options);
    }
    return new in_memory_queue_1.InMemoryJobQueue(options);
}
function createJobQueueWithEventBus(eventBus, options = {}) {
    return new in_memory_queue_1.InMemoryJobQueue({ ...options, eventBus });
}
function defaultJobQueue(options) {
    return createJobQueue('memory', options);
}
//# sourceMappingURL=factory.js.map