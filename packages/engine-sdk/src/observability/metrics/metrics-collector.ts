import type { MetricsCollector, MetricLabels, MetricsSnapshot, CounterMetric, GaugeMetric, HistogramMetric, HistogramBucket, TimerMetric } from '../interfaces/metrics';

function labelsKey(labels: MetricLabels): string {
  const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k}=${v}`).join(',');
}

function computeHistogramBuckets(values: number[]): HistogramBucket[] {
  const boundaries = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  const buckets: HistogramBucket[] = [];
  for (const le of boundaries) {
    buckets.push({ le, count: values.filter((v) => v <= le).length });
  }
  return buckets;
}

function computePercentiles(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower] as number;
  return (sorted[lower] as number) * (upper - idx) + (sorted[upper] as number) * (idx - lower);
}

export class DefaultMetricsCollector implements MetricsCollector {
  private counters = new Map<string, Map<string, { value: number; labels: MetricLabels }>>();
  private gauges = new Map<string, Map<string, { value: number; labels: MetricLabels }>>();
  private histograms = new Map<string, Map<string, number[]>>();
  private histogramLabels = new Map<string, Map<string, MetricLabels>>();
  private timers = new Map<string, Map<string, number[]>>();
  private timerLabels = new Map<string, Map<string, MetricLabels>>();

  counter(name: string, value: number = 1, labels: MetricLabels = {}): void {
    const metricMap = this.getOrCreate(this.counters, name);
    const key = labelsKey(labels);
    const existing = metricMap.get(key);
    if (existing) {
      existing.value += value;
    } else {
      metricMap.set(key, { value, labels });
    }
  }

  gauge(name: string, value: number, labels: MetricLabels = {}): void {
    const metricMap = this.getOrCreate(this.gauges, name);
    const key = labelsKey(labels);
    metricMap.set(key, { value, labels });
  }

  histogram(name: string, value: number, labels: MetricLabels = {}): void {
    const metricMap = this.getOrCreate(this.histograms, name);
    const labelMap = this.getOrCreate(this.histogramLabels, name);
    const key = labelsKey(labels);
    const values = metricMap.get(key) ?? [];
    values.push(value);
    if (values.length > 1000) {
      values.shift();
    }
    metricMap.set(key, values);
    labelMap.set(key, labels);
  }

  timer(name: string, durationMs: number, labels: MetricLabels = {}): void {
    const metricMap = this.getOrCreate(this.timers, name);
    const labelMap = this.getOrCreate(this.timerLabels, name);
    const key = labelsKey(labels);
    const values = metricMap.get(key) ?? [];
    values.push(durationMs);
    if (values.length > 1000) {
      values.shift();
    }
    metricMap.set(key, values);
    labelMap.set(key, labels);
  }

  snapshot(): MetricsSnapshot {
    const now = Date.now();
    const counters: CounterMetric[] = [];
    const gauges: GaugeMetric[] = [];
    const histograms: HistogramMetric[] = [];
    const timers: TimerMetric[] = [];

    for (const [name, innerMap] of this.counters) {
      for (const [, entry] of innerMap) {
        counters.push({ name, value: entry.value, labels: entry.labels, timestamp: now });
      }
    }

    for (const [name, innerMap] of this.gauges) {
      for (const [, entry] of innerMap) {
        gauges.push({ name, value: entry.value, labels: entry.labels, timestamp: now });
      }
    }

    for (const [name, innerMap] of this.histograms) {
      const labelMap = this.histogramLabels.get(name) ?? new Map();
      for (const [key, values] of innerMap) {
        const sum = values.reduce((a, b) => a + b, 0);
        histograms.push({
          name,
          count: values.length,
          sum,
          min: values.length ? Math.min(...values) : 0,
          max: values.length ? Math.max(...values) : 0,
          avg: values.length ? sum / values.length : 0,
          buckets: computeHistogramBuckets(values),
          labels: labelMap.get(key) ?? {},
          timestamp: now,
        });
      }
    }

    for (const [name, innerMap] of this.timers) {
      const labelMap = this.timerLabels.get(name) ?? new Map();
      for (const [key, values] of innerMap) {
        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        timers.push({
          name,
          count: values.length,
          sum,
          min: values.length ? (sorted[0] as number) : 0,
          max: values.length ? (sorted[sorted.length - 1] as number) : 0,
          avg: values.length ? sum / values.length : 0,
          p50: computePercentiles(sorted, 50),
          p90: computePercentiles(sorted, 90),
          p95: computePercentiles(sorted, 95),
          p99: computePercentiles(sorted, 99),
          labels: labelMap.get(key) ?? {},
          timestamp: now,
        });
      }
    }

    return { counters, gauges, histograms, timers, timestamp: now };
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.histogramLabels.clear();
    this.timers.clear();
    this.timerLabels.clear();
  }

  private getOrCreate<K, V>(map: Map<string, Map<K, V>>, name: string): Map<K, V> {
    let inner = map.get(name);
    if (!inner) {
      inner = new Map();
      map.set(name, inner);
    }
    return inner;
  }
}