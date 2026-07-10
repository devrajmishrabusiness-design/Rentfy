import type { EngineError } from '../../errors';
export { type PlatformEvent, type EventHandler, type PlatformEventType } from './event';
import type { PlatformEvent, EventHandler, PlatformEventType } from './event';
export { type Subscription, type Unsubscribe } from './subscription';
import type { Subscription } from './subscription';
export interface HandlerErrorContext {
    readonly event: PlatformEvent;
    readonly handler: EventHandler;
    readonly subscriptionId?: string;
}
export type HandlerErrorReporter = (error: EngineError, context: HandlerErrorContext) => void;
export interface EventPublishOptions {
    readonly correlationId?: string;
    readonly source?: string;
    readonly metadata?: Readonly<Record<string, unknown>>;
    readonly version?: number;
    readonly timestamp?: number;
    readonly id?: string;
}
export interface EventSubscribeOptions {
    readonly signal?: AbortSignal;
}
export interface PlatformEventBus {
    publish<TPayload = unknown>(type: PlatformEventType, payload: TPayload, options?: EventPublishOptions): PlatformEvent<TPayload>;
    publishEvent<TPayload = unknown>(event: PlatformEvent<TPayload>): PlatformEvent<TPayload>;
    subscribe<TPayload = unknown>(type: PlatformEventType, handler: EventHandler<TPayload>, options?: EventSubscribeOptions): Subscription;
    once<TPayload = unknown>(type: PlatformEventType, handler: EventHandler<TPayload>, options?: EventSubscribeOptions): Subscription;
    unsubscribe(subscription: Subscription): boolean;
    unsubscribeAll(type?: PlatformEventType): number;
    clear(): void;
    listenerCount(type: PlatformEventType): number;
    hasListeners(type: PlatformEventType): boolean;
    eventTypes(): readonly PlatformEventType[];
    setErrorReporter(reporter: HandlerErrorReporter): void;
}
export interface EventBusTransport<TEvent extends PlatformEvent = PlatformEvent, TMetadata = unknown> {
    readonly kind: string;
    publish(event: TEvent): void | Promise<void>;
    on(type: PlatformEventType, handler: EventHandler): Subscription;
    off(subscription: Subscription): void;
    clear(): void;
    listenerCount(type: PlatformEventType): number;
    trackedTypes?(): readonly PlatformEventType[];
    configure?(options: TMetadata): void;
    dispose?(): void | Promise<void>;
}
export interface EventBusOptions {
    readonly defaultSource?: string;
    readonly errorReporter?: HandlerErrorReporter;
    readonly idFactory?: () => string;
    readonly correlationIdFactory?: () => string;
}
export type { Subscription, Unsubscribe };
//# sourceMappingURL=bus.d.ts.map