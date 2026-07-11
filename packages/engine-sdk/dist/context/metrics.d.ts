import type { PluginMetrics } from '../types';
export declare class DefaultPluginMetrics implements PluginMetrics {
    executions: number;
    successes: number;
    failures: number;
    averageTime: number;
    lastExecutionTime?: number;
    private collector;
    increment(name: string, value?: number, _tags?: Record<string, string>): void;
    decrement(name: string, value?: number, _tags?: Record<string, string>): void;
    gauge(name: string, value: number, _tags?: Record<string, string>): void;
    histogram(name: string, value: number, _tags?: Record<string, string>): void;
    timing(name: string, value: number, _tags?: Record<string, string>): void;
    getCounter(name: string): number;
    getGauge(name: string): number | undefined;
    getHistogramStats(name: string): {
        count: number;
        sum: number;
        min: number;
        max: number;
        avg: number;
    } | null;
    getTimingStats(name: string): {
        count: number;
        sum: number;
        min: number;
        max: number;
        avg: number;
    } | null;
    reset(): void;
}
//# sourceMappingURL=metrics.d.ts.map