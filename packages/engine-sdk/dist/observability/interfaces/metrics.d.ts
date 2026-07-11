export interface MetricLabels {
    [key: string]: string;
}
export interface CounterMetric {
    name: string;
    value: number;
    labels: MetricLabels;
    timestamp: number;
}
export interface GaugeMetric {
    name: string;
    value: number;
    labels: MetricLabels;
    timestamp: number;
}
export interface HistogramBucket {
    le: number;
    count: number;
}
export interface HistogramMetric {
    name: string;
    count: number;
    sum: number;
    min: number;
    max: number;
    avg: number;
    buckets: HistogramBucket[];
    labels: MetricLabels;
    timestamp: number;
}
export interface TimerMetric {
    name: string;
    count: number;
    sum: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    labels: MetricLabels;
    timestamp: number;
}
export interface MetricsSnapshot {
    counters: CounterMetric[];
    gauges: GaugeMetric[];
    histograms: HistogramMetric[];
    timers: TimerMetric[];
    timestamp: number;
}
export interface MetricsCollector {
    counter(name: string, value?: number, labels?: MetricLabels): void;
    gauge(name: string, value: number, labels?: MetricLabels): void;
    histogram(name: string, value: number, labels?: MetricLabels): void;
    timer(name: string, durationMs: number, labels?: MetricLabels): void;
    snapshot(): MetricsSnapshot;
    reset(): void;
}
//# sourceMappingURL=metrics.d.ts.map