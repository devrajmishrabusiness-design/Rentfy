import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DefaultEngineLogger } from '../src/context/logger';
import { DefaultPluginStorage } from '../src/context/storage';
import { DefaultPluginMetrics } from '../src/context/metrics';
import { DefaultEventBus } from '../src/context/event-bus';

describe('DefaultEngineLogger', () => {
  let logger: DefaultEngineLogger;

  beforeEach(() => {
    logger = new DefaultEngineLogger('test-engine');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  it('should log debug messages', () => {
    logger.debug('debug message', { key: 'value' });
    expect(console.debug).toHaveBeenCalled();
  });

  it('should log info messages', () => {
    logger.info('info message');
    expect(console.log).toHaveBeenCalled();
  });

  it('should log warn messages', () => {
    logger.warn('warn message');
    expect(console.warn).toHaveBeenCalled();
  });

  it('should log error messages', () => {
    logger.error('error message');
    expect(console.error).toHaveBeenCalled();
  });

  it('should create child logger with additional context', () => {
    const child = logger.child({ requestId: '123' });
    child.info('child message');
    expect(console.log).toHaveBeenCalled();
  });

  it('should include prefix in log output', () => {
    logger.info('test');
    const logCall = (console.log as vi.Mock).mock.calls[0][0];
    expect(logCall).toContain('test-engine');
  });
});

describe('DefaultPluginStorage', () => {
  let storage: DefaultPluginStorage;

  beforeEach(() => {
    storage = new DefaultPluginStorage();
  });

  it('should store and retrieve values', async () => {
    await storage.set('key', 'value');
    const result = await storage.get('key');
    expect(result).toBe('value');
  });

  it('should return null for non-existent key', async () => {
    const result = await storage.get('non-existent');
    expect(result).toBeNull();
  });

  it('should delete values', async () => {
    await storage.set('key', 'value');
    await storage.delete('key');
    const result = await storage.get('key');
    expect(result).toBeNull();
  });

  it('should clear all values', async () => {
    await storage.set('key1', 'value1');
    await storage.set('key2', 'value2');
    await storage.clear();
    expect(await storage.get('key1')).toBeNull();
    expect(await storage.get('key2')).toBeNull();
  });

  it('should return all keys', async () => {
    await storage.set('key1', 'value1');
    await storage.set('key2', 'value2');
    const keys = await storage.keys();
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
  });

  it('should check if key exists', async () => {
    await storage.set('key', 'value');
    expect(await storage.has('key')).toBe(true);
    expect(await storage.has('non-existent')).toBe(false);
  });
});

describe('DefaultPluginMetrics', () => {
  let metrics: DefaultPluginMetrics;

  beforeEach(() => {
    metrics = new DefaultPluginMetrics();
  });

  it('should increment counters', () => {
    metrics.increment('counter');
    metrics.increment('counter', 5);
    expect(metrics.getCounter('counter')).toBe(6);
  });

  it('should decrement counters', () => {
    metrics.increment('counter', 10);
    metrics.decrement('counter', 3);
    expect(metrics.getCounter('counter')).toBe(7);
  });

  it('should set gauge values', () => {
    metrics.gauge('gauge', 42);
    expect(metrics.getGauge('gauge')).toBe(42);
  });

  it('should record histogram values', () => {
    metrics.histogram('hist', 10);
    metrics.histogram('hist', 20);
    metrics.histogram('hist', 30);

    const stats = metrics.getHistogramStats('hist');
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(3);
    expect(stats!.sum).toBe(60);
    expect(stats!.min).toBe(10);
    expect(stats!.max).toBe(30);
    expect(stats!.avg).toBe(20);
  });

  it('should record timing values', () => {
    metrics.timing('timing', 100);
    metrics.timing('timing', 200);

    const stats = metrics.getTimingStats('timing');
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(2);
    expect(stats!.avg).toBe(150);
  });

  it('should return null for non-existent metrics', () => {
    expect(metrics.getCounter('non-existent')).toBe(0);
    expect(metrics.getGauge('non-existent')).toBeUndefined();
    expect(metrics.getHistogramStats('non-existent')).toBeNull();
  });

  it('should reset all metrics', () => {
    metrics.increment('counter');
    metrics.gauge('gauge', 10);
    metrics.histogram('hist', 5);
    metrics.timing('timing', 100);

    metrics.reset();

    expect(metrics.getCounter('counter')).toBe(0);
    expect(metrics.getGauge('gauge')).toBeUndefined();
    expect(metrics.getHistogramStats('hist')).toBeNull();
    expect(metrics.getTimingStats('timing')).toBeNull();
  });

  it('should limit histogram size', () => {
    for (let i = 0; i < 1500; i++) {
      metrics.histogram('hist', i);
    }

    const stats = metrics.getHistogramStats('hist');
    expect(stats!.count).toBeLessThanOrEqual(1000);
  });
});

describe('DefaultEventBus', () => {
  let eventBus: DefaultEventBus;

  beforeEach(() => {
    eventBus = new DefaultEventBus();
  });

  it('should emit events to registered handlers', () => {
    const handler = vi.fn();
    eventBus.on('test-event', handler);

    eventBus.emit({ type: 'test-event', payload: 'data', timestamp: Date.now(), source: 'test' });

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'test-event', payload: 'data' }));
  });

  it('should remove handlers with off', () => {
    const handler = vi.fn();
    eventBus.on('test-event', handler);
    eventBus.off('test-event', handler);

    eventBus.emit({ type: 'test-event', payload: 'data', timestamp: Date.now(), source: 'test' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should call once handlers only once', () => {
    const handler = vi.fn();
    eventBus.once('test-event', handler);

    eventBus.emit({ type: 'test-event', payload: 'data', timestamp: Date.now(), source: 'test' });
    eventBus.emit({ type: 'test-event', payload: 'data', timestamp: Date.now(), source: 'test' });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple handlers for same event', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    eventBus.on('test-event', handler1);
    eventBus.on('test-event', handler2);

    eventBus.emit({ type: 'test-event', payload: 'data', timestamp: Date.now(), source: 'test' });

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('should not fail if handler throws', () => {
    const badHandler = vi.fn().mockImplementation(() => { throw new Error('Handler error'); });
    const goodHandler = vi.fn();

    eventBus.on('test-event', badHandler);
    eventBus.on('test-event', goodHandler);

    eventBus.emit({ type: 'test-event', payload: 'data', timestamp: Date.now(), source: 'test' });

    expect(goodHandler).toHaveBeenCalled();
  });

  it('should clear all handlers', () => {
    const handler = vi.fn();
    eventBus.on('test-event', handler);
    eventBus.clear();

    eventBus.emit({ type: 'test-event', payload: 'data', timestamp: Date.now(), source: 'test' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should return handler count', () => {
    eventBus.on('event1', vi.fn());
    eventBus.on('event1', vi.fn());
    eventBus.on('event2', vi.fn());

    expect(eventBus.getHandlerCount('event1')).toBe(2);
    expect(eventBus.getHandlerCount('event2')).toBe(1);
    expect(eventBus.getHandlerCount('event3')).toBe(0);
  });

  it('should check if handlers exist', () => {
    eventBus.on('event1', vi.fn());

    expect(eventBus.hasHandlers('event1')).toBe(true);
    expect(eventBus.hasHandlers('event2')).toBe(false);
  });
});