import type { PluginMetrics } from '../types';
import { DefaultMetricsCollector, type MetricsCollector } from '../observability';

export class DefaultPluginMetrics implements PluginMetrics {
  executions = 0;
  successes = 0;
  failures = 0;
  averageTime = 0;
  lastExecutionTime?: number;

  private collector: MetricsCollector = new DefaultMetricsCollector();
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();
  private timings = new Map<string, number[]>();

  increment(name: string, value: number = 1, _tags?: Record<string, string>): void {
    void _tags;
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
    this.collector.counter(name, value);
  }

  decrement(name: string, value: number = 1, _tags?: Record<string, string>): void {
    void _tags;
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current - value);
    this.collector.counter(name, -value);
  }

  gauge(name: string, value: number, _tags?: Record<string, string>): void {
    void _tags;
    this.gauges.set(name, value);
    this.collector.gauge(name, value);
  }

  histogram(name: string, value: number, _tags?: Record<string, string>): void {
    void _tags;
    const values = this.histograms.get(name) || [];
    values.push(value);
    if (values.length > 1000) {
      values.shift();
    }
    this.histograms.set(name, values);
    this.collector.histogram(name, value);
  }

  timing(name: string, value: number, _tags?: Record<string, string>): void {
    void _tags;
    const values = this.timings.get(name) || [];
    values.push(value);
    if (values.length > 1000) {
      values.shift();
    }
    this.timings.set(name, values);
    this.collector.timer(name, value);
  }

  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  getGauge(name: string): number | undefined {
    return this.gauges.get(name);
  }

  getHistogramStats(name: string): { count: number; sum: number; min: number; max: number; avg: number } | null {
    const values = this.histograms.get(name);
    if (!values || values.length === 0) {
      return null;
    }
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      count: values.length,
      sum,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / values.length,
    };
  }

  getTimingStats(name: string): { count: number; sum: number; min: number; max: number; avg: number } | null {
    const values = this.timings.get(name);
    if (!values || values.length === 0) {
      return null;
    }
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      count: values.length,
      sum,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / values.length,
    };
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.timings.clear();
    this.collector.reset();
  }
}
