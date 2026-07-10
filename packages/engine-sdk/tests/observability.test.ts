import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultStructuredLogger, ConsoleLogTransport } from '../src/observability/logger/structured-logger';
import { DefaultMetricsCollector } from '../src/observability/metrics/metrics-collector';
import { DefaultTracer } from '../src/observability/tracing/tracer';
import { DefaultHealthCheckRegistry } from '../src/observability/health/health-registry';
import { DefaultDiagnostics } from '../src/observability/diagnostics/diagnostics';
import { DefaultPerformanceMonitor } from '../src/observability/performance/performance-monitor';
import type { LogTransport, LogEntry, HealthCheckResult } from '../src/observability';

describe('Observability Platform', () => {
  describe('StructuredLogger', () => {
    let logger: DefaultStructuredLogger;

    beforeEach(() => {
      logger = new DefaultStructuredLogger({ source: 'test' });
    });

    it('should log at all levels', () => {
      const entries: LogEntry[] = [];
      const transport: LogTransport = { write: (e) => entries.push(e), flush: () => {} };
      logger.addTransport(transport);

      logger.trace('trace msg');
      logger.debug('debug msg');
      logger.info('info msg');
      logger.warn('warn msg');
      logger.error('error msg');
      logger.fatal('fatal msg');

      expect(entries).toHaveLength(6);
      expect(entries.map((e) => e.level)).toEqual(['trace', 'debug', 'info', 'warn', 'error', 'fatal']);
    });

    it('should include metadata in log entries', () => {
      const entries: LogEntry[] = [];
      const transport: LogTransport = { write: (e) => entries.push(e), flush: () => {} };
      logger.addTransport(transport);

      logger.info('with meta', { userId: '123' });
      expect(entries[0].context).toMatchObject({ userId: '123' });
    });

    it('should include error details', () => {
      const entries: LogEntry[] = [];
      const transport: LogTransport = { write: (e) => entries.push(e), flush: () => {} };
      logger.addTransport(transport);

      const err = new Error('test error');
      logger.error('err msg', undefined, err);

      expect(entries[0].error).toBeDefined();
      expect(entries[0].error!.name).toBe('Error');
      expect(entries[0].error!.message).toBe('test error');
      expect(entries[0].error!.stack).toBeDefined();
    });

    it('should respect minimum log level', () => {
      const entries: LogEntry[] = [];
      const transport: LogTransport = { write: (e) => entries.push(e), flush: () => {} };
      logger.addTransport(transport);
      logger.setLevel('warn');

      logger.debug('debug filtered');
      logger.info('info filtered');
      logger.warn('warn shown');
      logger.error('error shown');

      expect(entries).toHaveLength(2);
      expect(entries.map((e) => e.level)).toEqual(['warn', 'error']);
    });

    it('should create child logger with bindings', () => {
      const entries: LogEntry[] = [];
      const transport: LogTransport = { write: (e) => entries.push(e), flush: () => {} };
      logger.addTransport(transport);

      const child = logger.child({ service: 'auth' });
      child.info('hello');

      expect(entries[0].context).toMatchObject({ service: 'auth' });
    });

    it('should get current level', () => {
      expect(logger.getLevel()).toBe('trace');
      logger.setLevel('error');
      expect(logger.getLevel()).toBe('error');
    });

    it('should remove transport', () => {
      const entries: LogEntry[] = [];
      const transport: LogTransport = { write: (e) => entries.push(e), flush: () => {} };
      logger.addTransport(transport);
      logger.info('before');
      expect(entries).toHaveLength(1);

      logger.removeTransport(transport);
      logger.info('after');
      expect(entries).toHaveLength(1);
    });

    it('should include source in entries', () => {
      const entries: LogEntry[] = [];
      const transport: LogTransport = { write: (e) => entries.push(e), flush: () => {} };
      logger.addTransport(transport);

      logger.info('sourced');
      expect(entries[0].source).toBe('test');
    });

    it('should flush transports', async () => {
      let flushed = false;
      const transport: LogTransport = { write: () => {}, flush: () => { flushed = true; } };
      logger.addTransport(transport);
      await logger.flush();
      expect(flushed).toBe(true);
    });
  });

  describe('ConsoleLogTransport', () => {
    it('should create transport', () => {
      const transport = new ConsoleLogTransport();
      transport.write({ timestamp: 1, level: 'info', message: 'test', source: 's' });
      transport.flush();
    });
  });

  describe('DefaultMetricsCollector', () => {
    let metrics: DefaultMetricsCollector;

    beforeEach(() => {
      metrics = new DefaultMetricsCollector();
    });

    it('should increment counters', () => {
      metrics.counter('requests', 1, { method: 'GET' });
      metrics.counter('requests', 2, { method: 'GET' });
      metrics.counter('requests', 5);

      const snap = metrics.snapshot();
      const counters = snap.counters.filter((c) => c.name === 'requests');
      expect(counters).toHaveLength(2);

      const labeled = counters.find((c) => c.labels.method === 'GET');
      expect(labeled?.value).toBe(3);

      const unlabeled = counters.find((c) => c.labels.method === undefined);
      expect(unlabeled?.value).toBe(5);
    });

    it('should set gauges', () => {
      metrics.gauge('memory', 512);
      const snap = metrics.snapshot();
      const g = snap.gauges.find((g) => g.name === 'memory');
      expect(g?.value).toBe(512);
    });

    it('should track histogram values', () => {
      for (let i = 1; i <= 100; i++) {
        metrics.histogram('latency', i);
      }
      const snap = metrics.snapshot();
      const h = snap.histograms.find((h) => h.name === 'latency');
      expect(h).toBeDefined();
      expect(h!.count).toBe(100);
      expect(h!.min).toBe(1);
      expect(h!.max).toBe(100);
      expect(h!.avg).toBeCloseTo(50.5, 0);
      expect(h!.buckets.length).toBeGreaterThan(0);
    });

    it('should track timer with percentiles', () => {
      for (let i = 1; i <= 100; i++) {
        metrics.timer('response', i);
      }
      const snap = metrics.snapshot();
      const t = snap.timers.find((t) => t.name === 'response');
      expect(t).toBeDefined();
      expect(t!.count).toBe(100);
      expect(t!.p50).toBeCloseTo(50, -1);
      expect(t!.p99).toBeCloseTo(99, -1);
      expect(t!.min).toBe(1);
      expect(t!.max).toBe(100);
    });

    it('should reset all metrics', () => {
      metrics.counter('req', 10);
      metrics.gauge('mem', 256);
      metrics.histogram('lat', 50);
      metrics.timer('dur', 100);

      metrics.reset();
      const snap = metrics.snapshot();
      expect(snap.counters).toHaveLength(0);
      expect(snap.gauges).toHaveLength(0);
      expect(snap.histograms).toHaveLength(0);
      expect(snap.timers).toHaveLength(0);
    });

    it('should return empty snapshot for unused metrics', () => {
      const snap = metrics.snapshot();
      expect(snap.counters).toEqual([]);
      expect(snap.gauges).toEqual([]);
    });

    it('should override gauge values', () => {
      metrics.gauge('temp', 10);
      metrics.gauge('temp', 20);
      const snap = metrics.snapshot();
      const g = snap.gauges.find((g) => g.name === 'temp');
      expect(g?.value).toBe(20);
    });
  });

  describe('DefaultTracer', () => {
    let tracer: DefaultTracer;

    beforeEach(() => {
      tracer = new DefaultTracer();
    });

    it('should start a trace', () => {
      const trace = tracer.startTrace('api-call');
      expect(trace.name).toBe('api-call');
      expect(trace.id).toBeTruthy();
      expect(trace.spans).toHaveLength(1);
    });

    it('should start a span', () => {
      const span = tracer.startSpan('db-query', undefined, 'client');
      expect(span.name).toBe('db-query');
      expect(span.kind).toBe('client');
      expect(span.id).toBeTruthy();
    });

    it('should propagate trace context', () => {
      const trace = tracer.startTrace('root');
      const ctx = tracer.getContext();
      expect(ctx).not.toBeNull();
      expect(ctx!.traceId).toBe(trace.id);
    });

    it('should span inherit parent context', () => {
      const trace = tracer.startTrace('parent');
      const parentCtx = tracer.getContext()!;
      const span = tracer.startSpan('child', { traceId: parentCtx.traceId, sampled: true });
      expect(span.traceId).toBe(parentCtx.traceId);
    });

    it('should set span attributes', () => {
      const span = tracer.startSpan('http');
      span.setAttribute('http.method', 'GET');
      span.setAttribute('http.status', 200);
      expect(span.attributes['http.method']).toBe('GET');
      expect(span.attributes['http.status']).toBe(200);
    });

    it('should add span events', () => {
      const span = tracer.startSpan('processing');
      span.addEvent('start', { phase: 'init' });
      span.addEvent('done');
      expect(span.events).toHaveLength(2);
    });

    it('should set span status', () => {
      const span = tracer.startSpan('op');
      span.setStatus('error', 'timeout');
      expect(span.status).toBe('error');
      expect(span.statusMessage).toBe('timeout');
    });

    it('should end span and compute duration', () => {
      const span = tracer.startSpan('timed');
      span.end();
      expect(span.endTime).toBeDefined();
    });

    it('should end trace', () => {
      const trace = tracer.startTrace('workflow');
      trace.setStatus('ok');
      trace.end();
      expect(trace.endTime).toBeDefined();
      expect(trace.status).toBe('ok');
    });

    it('should provide snapshot', () => {
      const trace = tracer.startTrace('snapshot-test');
      trace.end();
      const snap = tracer.snapshot();
      expect(snap.traces).toHaveLength(1);
      expect(snap.traces[0].name).toBe('snapshot-test');
    });

    it('should list active traces', () => {
      tracer.startTrace('active');
      expect(tracer.activeTraces()).toHaveLength(1);
    });

    it('should list active spans', () => {
      tracer.startTrace('t');
      tracer.startSpan('s');
      expect(tracer.activeSpans()).toHaveLength(2);
    });

    it('should clear context', () => {
      tracer.startTrace('t');
      tracer.clearContext();
      expect(tracer.getContext()).toBeNull();
    });

    it('should set external context', () => {
      tracer.setContext({
        traceId: 'ext-trace',
        spanId: 'ext-span',
        sampled: true,
        baggage: { key: 'val' },
      });
      expect(tracer.getContext()!.traceId).toBe('ext-trace');
    });
  });

  describe('DefaultHealthCheckRegistry', () => {
    let registry: DefaultHealthCheckRegistry;

    beforeEach(() => {
      registry = new DefaultHealthCheckRegistry();
    });

    it('should return healthy result', async () => {
      registry.register('db', async () => ({
        name: 'db',
        status: 'healthy',
        message: 'connected',
        durationMs: 5,
        timestamp: Date.now(),
      }));

      const result = await registry.check('db') as HealthCheckResult;
      expect(result.status).toBe('healthy');
    });

    it('should check all registered checks', async () => {
      registry.register('db', async () => ({
        name: 'db',
        status: 'healthy',
        message: 'ok',
        durationMs: 1,
        timestamp: Date.now(),
      }));
      registry.register('cache', async () => ({
        name: 'cache',
        status: 'healthy',
        message: 'hit',
        durationMs: 1,
        timestamp: Date.now(),
      }));

      const results = await registry.checkAll();
      expect(results).toHaveLength(2);
    });

    it('should handle unhealthy check', async () => {
      registry.register('down', async () => ({
        name: 'down',
        status: 'unhealthy',
        message: 'offline',
        durationMs: 1,
        timestamp: Date.now(),
      }));

      const result = await registry.check('down') as HealthCheckResult;
      expect(result.status).toBe('unhealthy');
    });

    it('should handle thrown errors in checks', async () => {
      registry.register('thrower', async () => {
        throw new Error('boom');
      });
      const result = await registry.check('thrower') as HealthCheckResult;
      expect(result.status).toBe('unhealthy');
      expect(result.error?.message).toBe('boom');
    });

    it('should return unhealthy for unregistered check', async () => {
      const result = await registry.check('ghost') as HealthCheckResult;
      expect(result.status).toBe('unhealthy');
    });

    it('should unregister a check', () => {
      registry.register('tmp', async () => ({ name: 'tmp', status: 'healthy', durationMs: 0, timestamp: 0 }));
      expect(registry.unregister('tmp')).toBe(true);
      expect(registry.unregister('tmp')).toBe(false);
    });

    it('should produce snapshot', async () => {
      registry.register('pulse', async () => ({
        name: 'pulse',
        status: 'healthy',
        message: 'alive',
        durationMs: 1,
        timestamp: Date.now(),
      }));
      const snap = await registry.snapshot();
      expect(snap.overall).toBe('healthy');
      expect(snap.checks).toHaveLength(1);
      expect(snap.uptimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('DefaultPerformanceMonitor', () => {
    let monitor: DefaultPerformanceMonitor;

    beforeEach(() => {
      monitor = new DefaultPerformanceMonitor();
    });

    it('should mark and measure duration', () => {
      monitor.mark('start');
      monitor.mark('end');
      const measure = monitor.measure('elapsed', 'start', 'end');
      expect(measure.name).toBe('elapsed');
      expect(measure.durationMs).toBe(0);
    });

    it('should retrieve marks', () => {
      const mark = monitor.mark('checkpoint', 'phase1');
      const retrieved = monitor.getMark('checkpoint');
      expect(retrieved).toBe(mark);
      expect(retrieved?.category).toBe('phase1');
    });

    it('should retrieve measures', () => {
      monitor.mark('a');
      monitor.mark('b');
      const m = monitor.measure('gap', 'a', 'b');
      expect(monitor.getMeasure('gap')).toBe(m);
    });

    it('should return undefined for missing mark', () => {
      expect(monitor.getMark('nope')).toBeUndefined();
    });

    it('should return undefined for missing measure', () => {
      expect(monitor.getMeasure('nope')).toBeUndefined();
    });

    it('should throw on measure with missing marks', () => {
      monitor.mark('x');
      expect(() => monitor.measure('bad', 'z', 'y')).toThrow(/not found/);
    });

    it('should clear marks', () => {
      monitor.mark('x');
      monitor.clearMarks();
      expect(monitor.getMark('x')).toBeUndefined();
    });

    it('should clear measures', () => {
      monitor.mark('a');
      monitor.mark('b');
      monitor.measure('m', 'a', 'b');
      monitor.clearMeasures();
      expect(monitor.getMeasure('m')).toBeUndefined();
    });

    it('should produce snapshot', () => {
      monitor.mark('s');
      monitor.mark('e');
      monitor.measure('dur', 's', 'e');
      const snap = monitor.snapshot();
      expect(snap.marks).toHaveLength(2);
      expect(snap.measures).toHaveLength(1);
      expect(snap.memory.heapUsed).toBeGreaterThan(0);
    });
  });

  describe('DefaultDiagnostics', () => {
    it('should produce system snapshot', () => {
      const diag = new DefaultDiagnostics({
        metrics: new DefaultMetricsCollector(),
        tracer: new DefaultTracer(),
        health: new DefaultHealthCheckRegistry(),
        performance: new DefaultPerformanceMonitor(),
      });
      const snap = diag.snapshot();
      expect(snap.system.platform).toBeDefined();
      expect(snap.system.nodeVersion).toBeDefined();
      expect(snap.system.cpus).toBeGreaterThan(0);
      expect(snap.system.pid).toBeGreaterThan(0);
      expect(snap.system.memory.heapUsed).toBeGreaterThan(0);
      expect(snap.uptimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should produce async snapshot with health', async () => {
      const registry = new DefaultHealthCheckRegistry();
      registry.register('ok', async () => ({
        name: 'ok',
        status: 'healthy',
        message: 'alive',
        durationMs: 1,
        timestamp: Date.now(),
      }));

      const diag = new DefaultDiagnostics({
        metrics: new DefaultMetricsCollector(),
        tracer: new DefaultTracer(),
        health: registry,
        performance: new DefaultPerformanceMonitor(),
      });
      const snap = await diag.snapshotAsync();
      expect(snap.health.checks).toHaveLength(1);
    });
  });
});