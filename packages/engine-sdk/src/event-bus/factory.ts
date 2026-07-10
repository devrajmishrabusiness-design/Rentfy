import { DefaultPlatformEventBus } from './impl/default-bus';
import type { PlatformEventBus, EventBusOptions, EventBusTransport } from './interfaces/bus';
import { MemoryEventBusTransport } from './transports/memory-event-bus';

export type EventBusPreset = 'memory';

export function createEventBus(preset: EventBusPreset = 'memory', options?: EventBusOptions): PlatformEventBus {
  if (preset === 'memory') {
    return new DefaultPlatformEventBus({ ...options, transport: new MemoryEventBusTransport() });
  }
  return new DefaultPlatformEventBus({ ...options, transport: new MemoryEventBusTransport() });
}

export function createEventBusFromTransport(transport: EventBusTransport, options?: EventBusOptions): PlatformEventBus {
  return new DefaultPlatformEventBus({ ...options, transport });
}

export function defaultEventBus(options?: EventBusOptions): PlatformEventBus {
  return createEventBus('memory', options);
}