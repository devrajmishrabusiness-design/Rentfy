import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DefaultPlatformEventBus } from '../src/event-bus/impl/default-bus';
import { DefaultHandlerErrorReporter } from '../src/event-bus/impl/error-reporter';
import { MemoryEventBusTransport } from '../src/event-bus/transports/memory-event-bus';
import { createEventBus, createEventBusFromTransport, defaultEventBus } from '../src/event-bus/factory';
import type {
  PlatformEvent,
  PlatformEventBus,
  Subscription,
  HandlerErrorReporter,
} from '../src/event-bus/interfaces/bus';
import type { EngineError as EngineErrorType } from '../src/errors';

function trackingReporter(): { errors: unknown[]; report: HandlerErrorReporter } {
  const errors: unknown[] = [];
  const report: HandlerErrorReporter = (err, _ctx) => {
    errors.push(err);
  };
  return { errors, report };
}

function makeBus(options?: { defaultSource?: string; transport?: ReturnType<typeof MemoryEventBusTransport['prototype'] extends infer T ? T : never> }): PlatformEventBus {
  return new DefaultPlatformEventBus({
    defaultSource: options?.defaultSource ?? 'test-engine',
    transport: options?.transport ?? new MemoryEventBusTransport(),
  });
}

function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

describe('PlatformEventBus', () => {
  describe('MemoryEventBusTransport', () => {
    let transport: ReturnType<typeof MemoryEventBusTransport['prototype'] extends infer T ? T : never>;

    beforeEach(() => {
      transport = new MemoryEventBusTransport();
    });

    it('should have kind "memory"', () => {
      expect(transport.kind).toBe('memory');
    });

    it('should deliver events to registered handlers', () => {
      const handler = vi.fn();
      transport.on('order.created', handler);
      transport.publish({ id: '1', type: 'order.created', timestamp: 123, source: 'test', correlationId: 'c1', version: 1, payload: { id: 1 } });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should not throw for unmapped event types', () => {
      expect(() => {
        transport.publish({ id: '1', type: 'unknown', timestamp: 123, source: 'test', correlationId: 'c1', version: 1, payload: null });
      }).not.toThrow();
    });

    it('should return 0 listeners for empty type', () => {
      expect(transport.listenerCount('nonexistent')).toBe(0);
    });

    it('should count active listeners', () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      transport.on('evt', h1);
      transport.on('evt', h2);
      expect(transport.listenerCount('evt')).toBe(2);
    });

    it('should off a subscription', () => {
      const handler = vi.fn();
      const sub = transport.on('evt', handler);
      transport.off(sub);
      transport.publish({ id: '1', type: 'evt', timestamp: 123, source: 'test', correlationId: 'c1', version: 1, payload: null });
      expect(handler).not.toHaveBeenCalled();
    });

    it('should clear all handlers', () => {
      const h = vi.fn();
      transport.on('evt', h);
      transport.clear();
      transport.publish({ id: '1', type: 'evt', timestamp: 123, source: 'test', correlationId: 'c1', version: 1, payload: null });
      expect(h).not.toHaveBeenCalled();
    });

    it('should track types', () => {
      transport.on('a', vi.fn());
      transport.on('b', vi.fn());
      const types = transport.trackedTypes();
      expect(types).toContain('a');
      expect(types).toContain('b');
    });
  });

  describe('publish / subscribe', () => {
    let bus: PlatformEventBus;

    beforeEach(() => {
      bus = makeBus();
    });

    it('should deliver a published event to a subscriber', () => {
      const handler = vi.fn();
      bus.subscribe('item.viewed', handler);
      bus.publish('item.viewed', { id: 5 });
      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0]![0] as PlatformEvent;
      expect(event.type).toBe('item.viewed');
      expect(event.payload).toEqual({ id: 5 });
    });

    it('should return the event from publish', () => {
      const event = bus.publish('checkout', { total: 99.99 });
      expect(event.type).toBe('checkout');
      expect(event.id).toBeTruthy();
      expect(event.timestamp).toBeGreaterThan(0);
      expect(event.source).toContain('test-engine');
    });

    it('should include auto-populated metadata', () => {
      const event = bus.publish('signup', { email: 'a@b.com' });
      expect(event.id).toBeDefined();
      expect(event.correlationId).toBeDefined();
      expect(event.version).toBe(1);
      expect(event.timestamp).toBeGreaterThan(0);
      expect(event.source).toBe('test-engine');
    });

    it('should accept custom metadata overrides', () => {
      const event = bus.publish('signup', { email: 'a@b.com' }, {
        correlationId: 'custom-corr',
        source: 'gateway',
        version: 2,
        id: 'override-id',
      });
      expect(event.correlationId).toBe('custom-corr');
      expect(event.source).toBe('gateway');
      expect(event.version).toBe(2);
      expect(event.id).toBe('override-id');
    });

    it('should invoke multiple subscribers for an event type', () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      bus.subscribe('ping', h1);
      bus.subscribe('ping', h2);
      bus.publish('ping', 'hello');
      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
    });

    it('should preserve publish order across subscribers', () => {
      const calls: string[] = [];
      bus.subscribe('order', () => { calls.push('A'); });
      bus.subscribe('order', () => { calls.push('B'); });
      bus.subscribe('order', () => { calls.push('C'); });
      bus.publish('order', null);
      expect(calls).toEqual(['A', 'B', 'C']);
    });
  });

  describe('unsubscribe', () => {
    let bus: PlatformEventBus;

    beforeEach(() => {
      bus = makeBus();
    });

    it('should stop delivery after unsubscribe', () => {
      const handler = vi.fn();
      const sub = bus.subscribe('msg', handler);
      bus.unsubscribe(sub);
      bus.publish('msg', {});
      expect(handler).not.toHaveBeenCalled();
    });

    it('should not affect other subscribers', () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      const sub1 = bus.subscribe('evt', h1);
      bus.subscribe('evt', h2);
      bus.unsubscribe(sub1);
      bus.publish('evt', 'data');
      expect(h1).not.toHaveBeenCalled();
      expect(h2).toHaveBeenCalledTimes(1);
    });

    it('unsubscribeAll removes all listeners for a type', () => {
      bus.subscribe('evt', vi.fn());
      bus.subscribe('evt', vi.fn());
      bus.unsubscribeAll('evt');
      expect(bus.listenerCount('evt')).toBe(0);
    });
  });

  describe('once', () => {
    let bus: PlatformEventBus;

    beforeEach(() => {
      bus = makeBus();
    });

    it('should fire handler only once', () => {
      const handler = vi.fn();
      bus.once('login', handler);
      bus.publish('login', { user: 'x' });
      bus.publish('login', { user: 'y' });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should receive event', () => {
      let captured: unknown = null;
      bus.once('evt', (event) => { captured = event.payload; });
      bus.publish('evt', 42);
      expect(captured).toBe(42);
    });
  });

  describe('async handlers', () => {
    let bus: PlatformEventBus;

    beforeEach(() => {
      bus = makeBus();
    });

    it('should support async handler', async () => {
      const received: number[] = [];
      bus.subscribe('async', async (event) => {
        await delay(10);
        received.push(event.payload as number);
      });
      bus.publish('async', 1);
      bus.publish('async', 2);
      await delay(50);
      expect(received).toContain(1);
      expect(received).toContain(2);
    });

    it('should tolerate async handler rejection', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('fail'));
      bus.subscribe('fail', handler);
      // Should not throw
      bus.publish('fail', null);
      await delay(10);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('handler failures — isolation', () => {
    let bus: PlatformEventBus;
    let reported: unknown[];

    beforeEach(() => {
      const tracker = trackingReporter();
      reported = tracker.errors;
      bus = new DefaultPlatformEventBus({
        defaultSource: 'test',
        errorReporter: tracker.report,
      });
    });

    it('should continue dispatching after a handler throws', () => {
      const bad = vi.fn().mockImplementation(() => { throw new Error('boom'); });
      const good = vi.fn();
      bus.subscribe('evt', bad);
      bus.subscribe('evt', good);
      bus.publish('evt', {});
      expect(good).toHaveBeenCalledTimes(1);
    });

    it('should report error via error reporter', () => {
      const bad = vi.fn().mockImplementation(() => { throw new Error('handler crash'); });
      bus.subscribe('crash', bad);
      bus.publish('crash', {});
      expect(reported.length).toBe(1);
      const err = reported[0] as EngineErrorType;
      expect(err.message).toContain('handler crash');
      expect(err.code).toBeDefined();
    });
  });

  describe('clear / reset', () => {
    let bus: PlatformEventBus;

    beforeEach(() => {
      bus = makeBus();
    });

    it('should clear all subscriptions', () => {
      bus.subscribe('a', vi.fn());
      bus.subscribe('b', vi.fn());
      bus.clear();
      expect(bus.listenerCount('a')).toBe(0);
      expect(bus.listenerCount('b')).toBe(0);
    });
  });

  describe('listenerCount / hasListeners / eventTypes', () => {
    let bus: PlatformEventBus;

    beforeEach(() => {
      bus = makeBus();
    });

    it('should report listener counts', () => {
      bus.subscribe('x', vi.fn());
      bus.subscribe('x', vi.fn());
      bus.subscribe('y', vi.fn());
      expect(bus.listenerCount('x')).toBe(2);
      expect(bus.listenerCount('y')).toBe(1);
      expect(bus.listenerCount('z')).toBe(0);
    });

    it('should report hasListeners', () => {
      bus.subscribe('only', vi.fn());
      expect(bus.hasListeners('only')).toBe(true);
      expect(bus.hasListeners('none')).toBe(false);
    });

    it('should report event types', () => {
      bus.subscribe('a', vi.fn());
      bus.subscribe('b', vi.fn());
      const types = bus.eventTypes();
      expect(types).toContain('a');
      expect(types).toContain('b');
    });
  });

  describe('concurrent publishing', () => {
    let bus: PlatformEventBus;

    beforeEach(() => {
      bus = makeBus();
    });

    it('should handle concurrent publishes without loss', async () => {
      const count = new Array<number>(100).fill(0).map((_, i) => i);
      const handled: number[] = [];
      let i = 0;
      bus.subscribe('concurrency', () => {
        handled.push(i++);
      });
      const publishes = count.map((n) => bus.publish('concurrency', n));
      await delay(20);
      expect(handled.length).toBe(100);
      expect(publishes.length).toBe(100);
    });
  });

  describe('correlation IDs', () => {
    let bus: PlatformEventBus;

    beforeEach(() => {
      bus = makeBus();
    });

    it('should generate unique correlation IDs', () => {
      const e1 = bus.publish('evt', 1);
      const e2 = bus.publish('evt', 2);
      expect(e1.correlationId).toBeDefined();
      expect(e2.correlationId).toBeDefined();
      expect(e1.correlationId).not.toEqual(e2.correlationId);
    });

    it('should pass correlation ID through publisher options', () => {
      const event = bus.publish('checkout', {}, { correlationId: 'shared-corr' });
      expect(event.correlationId).toBe('shared-corr');
    });
  });

  describe('publishEvent (pre-built event)', () => {
    let bus: PlatformEventBus;

    beforeEach(() => {
      bus = makeBus();
    });

    it('should deliver a manually constructed event', () => {
      const handler = vi.fn();
      bus.subscribe('custom', handler);
      const event: PlatformEvent = {
        id: 'abc',
        type: 'custom',
        timestamp: 1000,
        source: 'manual',
        correlationId: 'corr-manual',
        version: 3,
        payload: { key: 'val' },
      };
      bus.publishEvent(event);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Factory', () => {
    it('createEventBus("memory") returns a bus', () => {
      const bus = createEventBus('memory');
      expect(bus).toBeDefined();
      const event = bus.publish('factory-test', {});
      expect(event.type).toBe('factory-test');
    });

    it('defaultEventBus() returns a bus', () => {
      const bus = defaultEventBus();
      expect(bus).toBeDefined();
    });

    it('createEventBusFromTransport works', () => {
      const transport = new MemoryEventBusTransport();
      const bus = createEventBusFromTransport(transport, { defaultSource: 'custom' });
      const event = bus.publish('transport-built', null);
      expect(event.source).toBe('custom');
    });
  });

  describe('ErrorReporter isolation', () => {
    it('DefaultHandlerErrorReporter captures errors when capture enabled', () => {
      const reporter = new DefaultHandlerErrorReporter({ capture: true });
      const ctx = {
        event: { id: '1', type: 'x', timestamp: 0, source: 's', correlationId: 'c', version: 1, payload: null },
        handler: vi.fn(),
      };
      const err = DefaultHandlerErrorReporter.fromUnknown('x', new Error('test'), ctx);
      reporter.report(err, ctx);
      const captured = reporter.getCaptured();
      expect(captured.length).toBe(1);
    });
  });
});