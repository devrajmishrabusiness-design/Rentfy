"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultPlatformEventBus = void 0;
const event_1 = require("../interfaces/event");
const error_reporter_1 = require("./error-reporter");
const id_factories_1 = require("./id-factories");
const memory_event_bus_1 = require("../transports/memory-event-bus");
class DefaultPlatformEventBus {
    transport;
    defaultSource;
    idFactory;
    correlationIdFactory;
    reporter;
    constructor(options = {}) {
        this.transport = options.transport ?? new memory_event_bus_1.MemoryEventBusTransport();
        this.defaultSource = options.defaultSource ?? 'engine-sdk';
        this.idFactory = options.idFactory ?? id_factories_1.defaultIdFactory;
        this.correlationIdFactory = options.correlationIdFactory ?? id_factories_1.defaultCorrelationFactory;
        this.reporter = options.errorReporter ?? new error_reporter_1.DefaultHandlerErrorReporter().report;
    }
    publishEvent(event) {
        return this.enqueue(event);
    }
    publish(type, payload, options = {}) {
        const event = this.buildEvent(type, payload, options);
        return this.enqueue(event);
    }
    subscribe(type, handler, _options = {}) {
        return this.transport.on(type, wrappedHandlerFactory(type, handler, () => this.reporter));
    }
    once(type, handler, _options = {}) {
        let dispatched = false;
        const enforcer = (event) => {
            if (dispatched)
                return;
            dispatched = true;
            return handler(event);
        };
        return this.transport.on(type, wrappedHandlerFactory(type, enforcer, () => this.reporter));
    }
    unsubscribe(subscription) {
        try {
            this.transport.off(subscription);
            return true;
        }
        catch {
            return false;
        }
    }
    unsubscribeAll(type) {
        let count = 0;
        if (type) {
            const before = this.listenerCount(type);
            const iter = () => {
                for (let i = 0; i < before; i++) {
                    const placeholder = this.transport.on(type, () => { });
                    this.transport.off(placeholder);
                }
            };
            iter();
            count = before;
        }
        else {
            const types = this.eventTypes();
            for (const t of types) {
                const before = this.listenerCount(t);
                for (let i = 0; i < before; i++) {
                    const placeholder = this.transport.on(t, () => { });
                    this.transport.off(placeholder);
                }
                count += before;
            }
        }
        return count;
    }
    clear() {
        this.transport.clear();
    }
    listenerCount(type) {
        return this.transport.listenerCount(type);
    }
    hasListeners(type) {
        return this.listenerCount(type) > 0;
    }
    eventTypes() {
        return this.transport.trackedTypes ? this.transport.trackedTypes() : [];
    }
    setErrorReporter(reporter) {
        this.reporter = reporter;
    }
    buildEvent(type, payload, options) {
        return {
            id: options.id ?? this.idFactory(),
            type,
            timestamp: options.timestamp ?? Date.now(),
            source: options.source ?? this.defaultSource,
            correlationId: options.correlationId ?? this.correlationIdFactory(),
            version: options.version ?? event_1.DEFAULT_EVENT_VERSION,
            payload,
            metadata: options.metadata,
        };
    }
    enqueue(event) {
        const pubResult = this.transport.publish(event);
        if (pubResult && typeof pubResult.then === 'function') {
            pubResult.catch((unknown) => {
                const err = error_reporter_1.DefaultHandlerErrorReporter.fromUnknown(event.type, unknown, {
                    event: event,
                    handler: () => undefined,
                });
                this.reporter(err, {
                    event: event,
                    handler: () => undefined,
                });
            });
        }
        return event;
    }
}
exports.DefaultPlatformEventBus = DefaultPlatformEventBus;
function wrappedHandlerFactory(type, handler, getReporter) {
    return ((event) => {
        try {
            const result = handler(event);
            if (result && typeof result.then === 'function') {
                return result.catch((unknown) => {
                    const ctx = { event, handler };
                    const err = error_reporter_1.DefaultHandlerErrorReporter.fromUnknown(type, unknown, ctx);
                    getReporter()(err, ctx);
                });
            }
        }
        catch (unknown) {
            const ctx = { event, handler };
            const err = error_reporter_1.DefaultHandlerErrorReporter.fromUnknown(type, unknown, ctx);
            getReporter()(err, ctx);
        }
    });
}
//# sourceMappingURL=default-bus.js.map