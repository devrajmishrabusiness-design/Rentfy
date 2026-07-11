"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultEventBus = void 0;
const event_bus_1 = require("../event-bus");
class DefaultEventBus {
    bus = new event_bus_1.DefaultPlatformEventBus({
        transport: new event_bus_1.MemoryEventBusTransport(),
    });
    handlerSubs = new Map();
    on(event, handler) {
        const wrapped = (platformEvent) => {
            const engineEvent = platformEvent.payload;
            handler(engineEvent);
        };
        const sub = this.bus.subscribe(event, wrapped);
        this.trackSub(handler, sub);
    }
    off(event, handler) {
        const subs = this.handlerSubs.get(handler);
        if (subs) {
            const remaining = [];
            for (const sub of subs) {
                if (sub.type === event) {
                    sub.unsubscribe();
                }
                else {
                    remaining.push(sub);
                }
            }
            if (remaining.length === 0) {
                this.handlerSubs.delete(handler);
            }
            else {
                this.handlerSubs.set(handler, remaining);
            }
        }
    }
    emit(event) {
        this.bus.publish(event.type, event, { source: event.source });
    }
    once(event, handler) {
        const wrapped = (platformEvent) => {
            const engineEvent = platformEvent.payload;
            handler(engineEvent);
        };
        const sub = this.bus.once(event, wrapped);
        this.trackSub(handler, sub);
    }
    clear() {
        this.handlerSubs.clear();
        this.bus.clear();
    }
    getHandlerCount(event) {
        return this.bus.listenerCount(event);
    }
    hasHandlers(event) {
        return this.bus.hasListeners(event);
    }
    trackSub(handler, sub) {
        const subs = this.handlerSubs.get(handler);
        if (subs) {
            subs.push(sub);
        }
        else {
            this.handlerSubs.set(handler, [sub]);
        }
    }
}
exports.DefaultEventBus = DefaultEventBus;
//# sourceMappingURL=event-bus.js.map