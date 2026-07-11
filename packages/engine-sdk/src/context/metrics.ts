import type { PluginMetrics } from '../types';
import { DefaultMetricsCollector, type MetricsCollector } from '../observability';

export class DefaultPluginMetrics implements PluginMetrics {
  executions = 0;
  successes = 0;
  failures = 0;
  averageTime = 0;
  lastExecutionTime?: number;

  private collector: MetricsCollector = new DefaultMetricsCollector();

  increment(name: string, value: number = 1, _tags?: Record<string, string>): void {
    void _tags;
    this.collector.counter(name, value);
  }

  decrement(name: string, value: number = 1, _tags?: Record<string, string>): void {
    void _tags;
    this.collector.counter(name, -value);
  }

  gauge(name: string, value: number, _tags?: Record<string, string>): void {
    void _tags;
    this.collector.gauge(name, value);
  }

  histogram(name: string, value: number, _tags?: Record<string, string>): void {
    void _tags;
    this.collector.histogram(name, value);
  }

  timing(name: string, value: number, _tags?: Record<string, string>): void {
    void _tags;
    this.collector.timer(name, value);
  }

  getCounter(name: string): number {
    const snapshot = this.collector.snapshot();
    const metric = snapshot.counters.find((c) => c.name === name);
    return metric?.value ?? 0;
  }

  getGauge(name: string): number | undefined {
    const snapshot = this.collector.snapshot();
    const metric = snapshot.gauges.find((g) => g.name === name);
    return metric?.value;
  }

  getHistogramStats(name: string): { count: number; sum: number; min: number; max: number; avg: number } | null {
    const snapshot = this.collector.snapshot();
    const metric = snapshot.histograms.find((h) => h.name === name);
    if (!metric) return null;
    return { count: metric.count, sum: metric.sum, min: metric.min, max: metric.max, avg: metric.avg };
  }

  getTimingStats(name: string): { count: number; sum: number; min: number; max: number; avg: number } | null {
    const snapshot = this.collector.snapshot();
    const metric = snapshot.timers.find((t) => t.name === name);
    if (!metric) return null;
    return { count: metric.count, sum: metric.sum, min: metric.min, max: metric.max, avg: metric.avg };
  }

  reset(): void {
    this.collector.reset();
  }
}