"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryEventBusTransport = void 0;
class TransportSubscription {
    id;
    type;
    cancel;
    constructor(id, type, cancel) {
        this.id = id;
        this.type = type;
        this.cancel = cancel;
    }
    unsubscribe() {
        this.cancel();
    }
}
class MemoryEventBusTransport {
    kind = 'memory';
    entries = new Map();
    entryBySub = new Map();
    subscriptionCounter = 0;
    iterationToken = 0;
    publish(event) {
        const type = event.type;
        const snapshot = this.entries.get(type);
        if (!snapshot || snapshot.length === 0) {
            return;
        }
        const token = ++this.iterationToken;
        for (const entry of snapshot) {
            if (entry.cancelled)
                continue;
            if (entry.once) {
                entry.cancelled = true;
            }
            this.invokeSafely(entry, event);
        }
        if (this.iterationToken === token) {
            this.compact(type);
        }
    }
    on(type, handler) {
        return this.register(type, handler, false);
    }
    off(subscription) {
        const entry = this.entryBySub.get(subscription.id);
        if (!entry)
            return;
        entry.cancelled = true;
        for (const [t, list] of this.entries) {
            if (list.includes(entry)) {
                this.compact(t);
                return;
            }
        }
    }
    clear() {
        this.entries.clear();
        this.entryBySub.clear();
    }
    listenerCount(type) {
        const list = this.entries.get(type);
        if (!list)
            return 0;
        let n = 0;
        for (const e of list) {
            if (!e.cancelled)
                n++;
        }
        return n;
    }
    trackedTypes() {
        return Array.from(this.entries.keys());
    }
    register(type, handler, once) {
        const subId = `sub_${++this.subscriptionCounter}`;
        const entry = {
            id: subId,
            handler,
            once,
            cancelled: false,
        };
        const list = this.entries.get(type);
        if (list) {
            list.push(entry);
        }
        else {
            this.entries.set(type, [entry]);
        }
        this.entryBySub.set(subId, entry);
        return new TransportSubscription(subId, type, () => {
            entry.cancelled = true;
        });
    }
    invokeSafely(entry, event) {
        const wrappedHandler = wrapHandlerForIsolation(entry.handler);
        wrappedHandler(event);
    }
    compact(type) {
        const list = this.entries.get(type);
        if (!list)
            return;
        const survivors = list.filter((e) => !e.cancelled);
        for (const e of list) {
            if (e.cancelled) {
                this.entryBySub.delete(e.id);
            }
        }
        if (survivors.length === 0) {
            this.entries.delete(type);
        }
        else if (survivors.length !== list.length) {
            this.entries.set(type, survivors);
        }
    }
}
exports.MemoryEventBusTransport = MemoryEventBusTransport;
function wrapHandlerForIsolation(handler) {
    return ((event) => {
        try {
            const result = handler(event);
            if (result && typeof result.then === 'function') {
                result.catch(() => {
                    /* swallowed — reporter at bus level handles this */
                });
            }
        }
        catch {
            /* swallowed — reporter at bus level handles this */
        }
    });
}
//# sourceMappingURL=memory-event-bus.js.map