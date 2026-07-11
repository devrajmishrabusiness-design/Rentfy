import type { PlatformEventBus, EventBusOptions, EventBusTransport } from './interfaces/bus';
export type EventBusPreset = 'memory';
export declare function createEventBus(preset?: EventBusPreset, options?: EventBusOptions): PlatformEventBus;
export declare function createEventBusFromTransport(transport: EventBusTransport, options?: EventBusOptions): PlatformEventBus;
export declare function defaultEventBus(options?: EventBusOptions): PlatformEventBus;
//# sourceMappingURL=factory.d.ts.map