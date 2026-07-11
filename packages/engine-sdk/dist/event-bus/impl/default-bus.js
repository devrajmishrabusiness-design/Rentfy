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
    subscriptions = new Map();
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
        const sub = this.transport.on(type, wrappedHandlerFactory(type, handler, () => this.reporter));
        const list = this.subscriptions.get(type);
        if (list) {
            list.push(sub);
        }
        else {
            this.subscriptions.set(type, [sub]);
        }
        return sub;
    }
    once(type, handler, _options = {}) {
        let dispatched = false;
        let dispatchedSubscriptionIdx = -1;
        const enforcer = (event) => {
            if (dispatched)
                return;
            dispatched = true;
            if (dispatchedSubscriptionIdx !== -1) {
                const arr = this.subscriptions.get(type);
                if (arr)
                    arr.splice(dispatchedSubscriptionIdx, 1);
            }
            return handler(event);
        };
        const sub = this.transport.on(type, wrappedHandlerFactory(type, enforcer, () => this.reporter));
        const list = this.subscriptions.get(type);
        if (list) {
            dispatchedSubscriptionIdx = list.length;
            list.push(sub);
        }
        else {
            this.subscriptions.set(type, [sub]);
            dispatchedSubscriptionIdx = 0;
        }
        return sub;
    }
    unsubscribe(subscription) {
        const type = subscription.type;
        const list = this.subscriptions.get(type);
        if (list) {
            const idx = list.findIndex((s) => s.id === subscription.id);
            if (idx !== -1) {
                list.splice(idx, 1);
                if (list.length === 0) {
                    this.subscriptions.delete(type);
                }
            }
        }
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
            const list = this.subscriptions.get(type);
            if (list) {
                const copy = [...list];
                for (const sub of copy) {
                    this.unsubscribe(sub);
                    count++;
                }
            }
        }
        else {
            const typeEntries = Array.from(this.subscriptions.entries());
            for (const [, list] of typeEntries) {
                const copy = [...list];
                for (const sub of copy) {
                    this.unsubscribe(sub);
                    count++;
                }
            }
        }
        return count;
    }
    clear() {
        this.subscriptions.clear();
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
                const ctx = {
                    event: event,
                    handler: () => undefined,
                };
                const err = error_reporter_1.DefaultHandlerErrorReporter.fromUnknown(event.type, unknown, ctx);
                this.reporter(err, ctx);
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