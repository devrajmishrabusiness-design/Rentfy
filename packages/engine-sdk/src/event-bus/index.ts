export {
  type PlatformEvent,
  type EventHandler,
  type EventMetadata,
  type PlatformEventType,
  type EventEnvelope,
  DEFAULT_EVENT_VERSION,
} from './interfaces/event';

export {
  type Subscription,
  type Unsubscribe,
} from './interfaces/subscription';

export {
  type HandlerErrorReporter,
  type HandlerErrorContext,
  type PlatformEventBus,
  type EventBusTransport,
  type EventPublishOptions,
  type EventSubscribeOptions,
  type EventBusOptions,
} from './interfaces/bus';

export { MemoryEventBusTransport } from './transports/memory-event-bus';

export { DefaultPlatformEventBus } from './impl/default-bus';
export { DefaultHandlerErrorReporter } from './impl/error-reporter';
export { defaultIdFactory, defaultCorrelationFactory } from './impl/id-factories';

export { createEventBus, createEventBusFromTransport, defaultEventBus } from './factory';
export type { EventBusPreset } from './factory';