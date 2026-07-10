import type { Diagnostics, DiagnosticsSnapshot, SystemInfo } from '../interfaces/diagnostics';
import type { MetricsCollector } from '../interfaces/metrics';
import type { Tracer } from '../interfaces/tracing';
import type { HealthCheckRegistry } from '../interfaces/health';
import type { PerformanceMonitor } from '../interfaces/performance';
import { cpus } from 'os';

function captureSystemInfo(): SystemInfo {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    cpus: cpus().length,
    uptime: process.uptime(),
    memory: {
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
      rss: process.memoryUsage().rss,
    },
    pid: process.pid,
  };
}

export class DefaultDiagnostics implements Diagnostics {
  private startTime: number;
  private metrics: MetricsCollector;
  private tracer: Tracer;
  private health: HealthCheckRegistry;
  private performance: PerformanceMonitor;

  constructor(deps: {
    metrics: MetricsCollector;
    tracer: Tracer;
    health: HealthCheckRegistry;
    performance: PerformanceMonitor;
  }) {
    this.startTime = Date.now();
    this.metrics = deps.metrics;
    this.tracer = deps.tracer;
    this.health = deps.health;
    this.performance = deps.performance;
  }

  snapshot(): DiagnosticsSnapshot {
    return {
      timestamp: Date.now(),
      system: captureSystemInfo(),
      metrics: this.metrics.snapshot(),
      traces: this.tracer.snapshot(),
      health: {
        overall: 'healthy',
        checks: [],
        timestamp: Date.now(),
        uptimeMs: Date.now() - this.startTime,
      },
      performance: this.performance.snapshot(),
      uptimeMs: Date.now() - this.startTime,
    };
  }

  async snapshotAsync(): Promise<DiagnosticsSnapshot> {
    const healthSnapshot = await this.health.snapshot();
    return {
      timestamp: Date.now(),
      system: captureSystemInfo(),
      metrics: this.metrics.snapshot(),
      traces: this.tracer.snapshot(),
      health: healthSnapshot,
      performance: this.performance.snapshot(),
      uptimeMs: Date.now() - this.startTime,
    };
  }
}