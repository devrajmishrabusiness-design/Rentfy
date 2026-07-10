import type { MetricsSnapshot } from './metrics';
import type { TraceSnapshot, SpanSnapshot } from './tracing';
import type { HealthSnapshot } from './health';
import type { PerformanceSnapshot } from './performance';

export interface MemoryInfo {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  cpus: number;
  uptime: number;
  memory: MemoryInfo;
  pid: number;
}

export interface DiagnosticsSnapshot {
  timestamp: number;
  system: SystemInfo;
  metrics: MetricsSnapshot;
  traces: { traces: TraceSnapshot[]; activeSpans: SpanSnapshot[] };
  health: HealthSnapshot;
  performance: PerformanceSnapshot;
  uptimeMs: number;
}

export interface Diagnostics {
  snapshot(): DiagnosticsSnapshot;
}