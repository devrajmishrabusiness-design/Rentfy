"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultEventBus = void 0;
class DefaultEventBus {
    handlers = new Map();
    onceHandlers = new Map();
    on(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event).add(handler);
    }
    off(event, handler) {
        this.handlers.get(event)?.delete(handler);
        this.onceHandlers.get(event)?.delete(handler);
    }
    emit(event) {
        const handlers = this.handlers.get(event.type);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(event);
                }
                catch (error) {
                    console.error(`Error in event handler for ${event.type}:`, error);
                }
            }
        }
        const onceHandlers = this.onceHandlers.get(event.type);
        if (onceHandlers) {
            for (const handler of onceHandlers) {
                try {
                    handler(event);
                }
                catch (error) {
                    console.error(`Error in once event handler for ${event.type}:`, error);
                }
            }
            this.onceHandlers.delete(event.type);
        }
    }
    once(event, handler) {
        if (!this.onceHandlers.has(event)) {
            this.onceHandlers.set(event, new Set());
        }
        this.onceHandlers.get(event).add(handler);
    }
    clear() {
        this.handlers.clear();
        this.onceHandlers.clear();
    }
    getHandlerCount(event) {
        return this.handlers.get(event)?.size ?? 0;
    }
    hasHandlers(event) {
        return (this.handlers.get(event)?.size ?? 0) > 0;
    }
}
exports.DefaultEventBus = DefaultEventBus;
//# sourceMappingURL=event-bus.js.map