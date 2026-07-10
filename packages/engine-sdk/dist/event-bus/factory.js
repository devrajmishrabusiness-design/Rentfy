"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventBus = createEventBus;
exports.createEventBusFromTransport = createEventBusFromTransport;
exports.defaultEventBus = defaultEventBus;
const default_bus_1 = require("../impl/default-bus");
const memory_event_bus_1 = require("../transports/memory-event-bus");
function createEventBus(preset = 'memory', options) {
    if (preset === 'memory') {
        return new default_bus_1.DefaultPlatformEventBus({ ...options, transport: new memory_event_bus_1.MemoryEventBusTransport() });
    }
    return new default_bus_1.DefaultPlatformEventBus({ ...options, transport: new memory_event_bus_1.MemoryEventBusTransport() });
}
function createEventBusFromTransport(transport, options) {
    return new default_bus_1.DefaultPlatformEventBus({ ...options, transport });
}
function defaultEventBus(options) {
    return createEventBus('memory', options);
}
//# sourceMappingURL=factory.js.map