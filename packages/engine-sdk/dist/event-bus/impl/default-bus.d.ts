import { type EventHandler, type EventPublishOptions, type EventSubscribeOptions, type HandlerErrorReporter, type PlatformEvent, type PlatformEventBus, type PlatformEventType, type EventBusTransport, type Subscription, type EventBusOptions } from '../interfaces/bus';
export declare class DefaultPlatformEventBus implements PlatformEventBus {
    private readonly transport;
    private readonly defaultSource;
    private readonly idFactory;
    private readonly correlationIdFactory;
    private reporter;
    constructor(options?: EventBusOptions & {
        transport?: EventBusTransport;
    });
    publishEvent<TPayload = unknown>(event: PlatformEvent<TPayload>): PlatformEvent<TPayload>;
    publish<TPayload = unknown>(type: PlatformEventType, payload: TPayload, options?: EventPublishOptions): PlatformEvent<TPayload>;
    subscribe<TPayload = unknown>(type: PlatformEventType, handler: EventHandler<TPayload>, _options?: EventSubscribeOptions): Subscription;
    once<TPayload = unknown>(type: PlatformEventType, handler: EventHandler<TPayload>, _options?: EventSubscribeOptions): Subscription;
    unsubscribe(subscription: Subscription): boolean;
    unsubscribeAll(type?: PlatformEventType): number;
    clear(): void;
    listenerCount(type: PlatformEventType): number;
    hasListeners(type: PlatformEventType): boolean;
    eventTypes(): readonly PlatformEventType[];
    setErrorReporter(reporter: HandlerErrorReporter): void;
    private buildEvent;
    private enqueue;
}
//# sourceMappingURL=default-bus.d.ts.map