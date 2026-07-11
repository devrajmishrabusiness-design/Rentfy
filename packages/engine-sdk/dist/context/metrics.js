"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultPluginMetrics = void 0;
const observability_1 = require("../observability");
class DefaultPluginMetrics {
    executions = 0;
    successes = 0;
    failures = 0;
    averageTime = 0;
    lastExecutionTime;
    collector = new observability_1.DefaultMetricsCollector();
    increment(name, value = 1, _tags) {
        void _tags;
        this.collector.counter(name, value);
    }
    decrement(name, value = 1, _tags) {
        void _tags;
        this.collector.counter(name, -value);
    }
    gauge(name, value, _tags) {
        void _tags;
        this.collector.gauge(name, value);
    }
    histogram(name, value, _tags) {
        void _tags;
        this.collector.histogram(name, value);
    }
    timing(name, value, _tags) {
        void _tags;
        this.collector.timer(name, value);
    }
    getCounter(name) {
        const snapshot = this.collector.snapshot();
        const metric = snapshot.counters.find((c) => c.name === name);
        return metric?.value ?? 0;
    }
    getGauge(name) {
        const snapshot = this.collector.snapshot();
        const metric = snapshot.gauges.find((g) => g.name === name);
        return metric?.value;
    }
    getHistogramStats(name) {
        const snapshot = this.collector.snapshot();
        const metric = snapshot.histograms.find((h) => h.name === name);
        if (!metric)
            return null;
        return { count: metric.count, sum: metric.sum, min: metric.min, max: metric.max, avg: metric.avg };
    }
    getTimingStats(name) {
        const snapshot = this.collector.snapshot();
        const metric = snapshot.timers.find((t) => t.name === name);
        if (!metric)
            return null;
        return { count: metric.count, sum: metric.sum, min: metric.min, max: metric.max, avg: metric.avg };
    }
    reset() {
        this.collector.reset();
    }
}
exports.DefaultPluginMetrics = DefaultPluginMetrics;
//# sourceMappingURL=metrics.js.map