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
    counters = new Map();
    gauges = new Map();
    histograms = new Map();
    timings = new Map();
    increment(name, value = 1, _tags) {
        void _tags;
        const current = this.counters.get(name) || 0;
        this.counters.set(name, current + value);
        this.collector.counter(name, value);
    }
    decrement(name, value = 1, _tags) {
        void _tags;
        const current = this.counters.get(name) || 0;
        this.counters.set(name, current - value);
        this.collector.counter(name, -value);
    }
    gauge(name, value, _tags) {
        void _tags;
        this.gauges.set(name, value);
        this.collector.gauge(name, value);
    }
    histogram(name, value, _tags) {
        void _tags;
        const values = this.histograms.get(name) || [];
        values.push(value);
        if (values.length > 1000) {
            values.shift();
        }
        this.histograms.set(name, values);
        this.collector.histogram(name, value);
    }
    timing(name, value, _tags) {
        void _tags;
        const values = this.timings.get(name) || [];
        values.push(value);
        if (values.length > 1000) {
            values.shift();
        }
        this.timings.set(name, values);
        this.collector.timer(name, value);
    }
    getCounter(name) {
        return this.counters.get(name) || 0;
    }
    getGauge(name) {
        return this.gauges.get(name);
    }
    getHistogramStats(name) {
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
    getTimingStats(name) {
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
    reset() {
        this.counters.clear();
        this.gauges.clear();
        this.histograms.clear();
        this.timings.clear();
        this.collector.reset();
    }
}
exports.DefaultPluginMetrics = DefaultPluginMetrics;
//# sourceMappingURL=metrics.js.map