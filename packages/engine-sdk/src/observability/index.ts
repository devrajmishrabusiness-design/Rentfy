export {
  type LogLevel,
  type LogEntry,
  type LogFormatter,
  type LogTransport,
  type StructuredLogger,
} from './interfaces/logger';

export {
  type MetricLabels,
  type CounterMetric,
  type GaugeMetric,
  type HistogramBucket,
  type HistogramMetric,
  type TimerMetric,
  type MetricsSnapshot,
  type MetricsCollector,
} from './interfaces/metrics';

export {
  type SpanKind,
  type TraceContext,
  type SpanAttributes,
  type SpanEvent,
  type SpanLink,
  type Span,
  type Trace,
  type TraceSnapshot,
  type SpanSnapshot,
  type Tracer,
} from './interfaces/tracing';

export {
  type HealthStatus,
  type HealthCheckResult,
  type HealthSnapshot,
  type HealthCheckFn,
  type HealthCheckRegistry,
} from './interfaces/health';

export {
  type MemoryInfo,
  type SystemInfo,
  type DiagnosticsSnapshot,
  type Diagnostics,
} from './interfaces/diagnostics';

export {
  type PerformanceMark,
  type PerformanceMeasure,
  type PerformanceSnapshot,
  type PerformanceMonitor,
} from './interfaces/performance';

export {
  type OpenTelemetryExporter,
  type PrometheusExporter,
  type GrafanaExporter,
  type DatadogExporter,
  type CloudWatchExporter,
  type AzureMonitorExporter,
} from './interfaces/extensions';

export { DefaultStructuredLogger, ConsoleLogTransport } from './logger/structured-logger';
export { DefaultMetricsCollector } from './metrics/metrics-collector';
export { DefaultTracer } from './tracing/tracer';
export { DefaultHealthCheckRegistry } from './health/health-registry';
export { DefaultDiagnostics } from './diagnostics/diagnostics';
export { DefaultPerformanceMonitor } from './performance/performance-monitor';

export { generateId } from './utils/id-generator';