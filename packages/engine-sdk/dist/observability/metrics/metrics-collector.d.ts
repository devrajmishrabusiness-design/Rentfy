import type { MetricsCollector, MetricLabels, MetricsSnapshot } from '../interfaces/metrics';
export declare class DefaultMetricsCollector implements MetricsCollector {
    private counters;
    private gauges;
    private histograms;
    private histogramLabels;
    private timers;
    private timerLabels;
    counter(name: string, value?: number, labels?: MetricLabels): void;
    gauge(name: string, value: number, labels?: MetricLabels): void;
    histogram(name: string, value: number, labels?: MetricLabels): void;
    timer(name: string, durationMs: number, labels?: MetricLabels): void;
    snapshot(): MetricsSnapshot;
    reset(): void;
    private getOrCreate;
}
//# sourceMappingURL=metrics-collector.d.ts.map