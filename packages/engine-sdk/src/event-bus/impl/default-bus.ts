import type { EngineError as EngineErrorType } from '../../errors';
import {
  type EventHandler,
  type EventPublishOptions,
  type EventSubscribeOptions,
  type HandlerErrorContext,
  type HandlerErrorReporter,
  type PlatformEvent,
  type PlatformEventBus,
  type PlatformEventType,
  type EventBusTransport,
  type Subscription,
  type EventBusOptions,
} from '../interfaces/bus';
import { DEFAULT_EVENT_VERSION } from '../interfaces/event';
import { DefaultHandlerErrorReporter } from './error-reporter';
import { defaultIdFactory, defaultCorrelationFactory } from './id-factories';
import { MemoryEventBusTransport } from '../transports/memory-event-bus';

export class DefaultPlatformEventBus implements PlatformEventBus {
  private readonly transport: EventBusTransport;
  private readonly defaultSource: string;
  private readonly idFactory: () => string;
  private readonly correlationIdFactory: () => string;
  private reporter: HandlerErrorReporter;
  private readonly subscriptions = new Map<PlatformEventType, Subscription[]>();

  constructor(options: EventBusOptions & { transport?: EventBusTransport } = {}) {
    this.transport = options.transport ?? new MemoryEventBusTransport();
    this.defaultSource = options.defaultSource ?? 'engine-sdk';
    this.idFactory = options.idFactory ?? defaultIdFactory;
    this.correlationIdFactory = options.correlationIdFactory ?? defaultCorrelationFactory;
    this.reporter = options.errorReporter ?? new DefaultHandlerErrorReporter().report;
  }

  publishEvent<TPayload = unknown>(event: PlatformEvent<TPayload>): PlatformEvent<TPayload> {
    return this.enqueue(event);
  }

  publish<TPayload = unknown>(
    type: PlatformEventType,
    payload: TPayload,
    options: EventPublishOptions = {},
  ): PlatformEvent<TPayload> {
    const event = this.buildEvent<TPayload>(type, payload, options);
    return this.enqueue(event);
  }

  subscribe<TPayload = unknown>(
    type: PlatformEventType,
    handler: EventHandler<TPayload>,
    _options: EventSubscribeOptions = {},
  ): Subscription {
    const sub = this.transport.on(type, wrappedHandlerFactory(type, handler as unknown as EventHandler, () => this.reporter));
    const list = this.subscriptions.get(type);
    if (list) {
      list.push(sub);
    } else {
      this.subscriptions.set(type, [sub]);
    }
    return sub;
  }

  once<TPayload = unknown>(
    type: PlatformEventType,
    handler: EventHandler<TPayload>,
    _options: EventSubscribeOptions = {},
  ): Subscription {
    let dispatched = false;
    let dispatchedSubscriptionIdx = -1;
    const enforcer: EventHandler = (event) => {
      if (dispatched) return;
      dispatched = true;
      if (dispatchedSubscriptionIdx !== -1) {
        const arr = this.subscriptions.get(type);
        if (arr) arr.splice(dispatchedSubscriptionIdx, 1);
      }
      return handler(event as PlatformEvent<TPayload>);
    };
    const sub = this.transport.on(type, wrappedHandlerFactory(type, enforcer, () => this.reporter));
    const list = this.subscriptions.get(type);
    if (list) {
      dispatchedSubscriptionIdx = list.length;
      list.push(sub);
    } else {
      this.subscriptions.set(type, [sub]);
      dispatchedSubscriptionIdx = 0;
    }
    return sub;
  }

  unsubscribe(subscription: Subscription): boolean {
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
    } catch {
      return false;
    }
  }

  unsubscribeAll(type?: PlatformEventType): number {
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
    } else {
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

  clear(): void {
    this.subscriptions.clear();
    this.transport.clear();
  }

  listenerCount(type: PlatformEventType): number {
    return this.transport.listenerCount(type);
  }

  hasListeners(type: PlatformEventType): boolean {
    return this.listenerCount(type) > 0;
  }

  eventTypes(): readonly PlatformEventType[] {
    return this.transport.trackedTypes ? this.transport.trackedTypes() : [];
  }

  setErrorReporter(reporter: HandlerErrorReporter): void {
    this.reporter = reporter;
  }

  private buildEvent<TPayload>(
    type: PlatformEventType,
    payload: TPayload,
    options: EventPublishOptions,
  ): PlatformEvent<TPayload> {
    return {
      id: options.id ?? this.idFactory(),
      type,
      timestamp: options.timestamp ?? Date.now(),
      source: options.source ?? this.defaultSource,
      correlationId: options.correlationId ?? this.correlationIdFactory(),
      version: options.version ?? DEFAULT_EVENT_VERSION,
      payload,
      metadata: options.metadata,
    };
  }

  private enqueue<TPayload>(event: PlatformEvent<TPayload>): PlatformEvent<TPayload> {
    const pubResult = this.transport.publish(event as PlatformEvent);
    if (pubResult && typeof (pubResult as Promise<void>).then === 'function') {
      (pubResult as Promise<void>).catch((unknown: unknown) => {
        const ctx: HandlerErrorContext = {
          event: event as PlatformEvent,
          handler: () => undefined,
        };
        const err: EngineErrorType = DefaultHandlerErrorReporter.fromUnknown(event.type, unknown, ctx);
        this.reporter(err, ctx);
      });
    }
    return event;
  }
}

function wrappedHandlerFactory(
  type: PlatformEventType,
  handler: EventHandler,
  getReporter: () => HandlerErrorReporter,
): EventHandler {
  return ((event: PlatformEvent): void | Promise<void> => {
    try {
      const result = handler(event);
      if (result && typeof (result as Promise<void>).then === 'function') {
        return (result as Promise<void>).catch((unknown: unknown) => {
          const ctx: HandlerErrorContext = { event, handler };
          const err = DefaultHandlerErrorReporter.fromUnknown(type, unknown, ctx);
          getReporter()(err, ctx);
        });
      }
    } catch (unknown: unknown) {
      const ctx: HandlerErrorContext = { event, handler };
      const err = DefaultHandlerErrorReporter.fromUnknown(type, unknown, ctx);
      getReporter()(err, ctx);
    }
  }) as EventHandler;
}