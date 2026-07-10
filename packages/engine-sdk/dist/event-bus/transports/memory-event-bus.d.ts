import type { EventHandler, PlatformEvent, PlatformEventType } from '../interfaces/event';
import type { Subscription } from '../interfaces/subscription';
import type { EventBusTransport } from '../interfaces/bus';
export declare class MemoryEventBusTransport implements EventBusTransport {
    readonly kind = "memory";
    private readonly entries;
    private readonly entryBySub;
    private subscriptionCounter;
    private iterationToken;
    publish(event: PlatformEvent): void;
    on(type: PlatformEventType, handler: EventHandler): Subscription;
    off(subscription: Subscription): void;
    clear(): void;
    listenerCount(type: PlatformEventType): number;
    trackedTypes(): readonly PlatformEventType[];
    private register;
    private invokeSafely;
    private compact;
}
//# sourceMappingURL=memory-event-bus.d.ts.map