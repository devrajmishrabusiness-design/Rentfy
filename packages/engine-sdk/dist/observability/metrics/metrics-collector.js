"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultMetricsCollector = void 0;
function labelsKey(labels) {
    const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([k, v]) => `${k}=${v}`).join(',');
}
function computeHistogramBuckets(values) {
    const boundaries = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    const buckets = [];
    for (const le of boundaries) {
        buckets.push({ le, count: values.filter((v) => v <= le).length });
    }
    return buckets;
}
function computePercentiles(sorted, p) {
    if (sorted.length === 0)
        return 0;
    const idx = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper)
        return sorted[lower];
    return sorted[lower] * (upper - idx) + sorted[upper] * (idx - lower);
}
class DefaultMetricsCollector {
    counters = new Map();
    gauges = new Map();
    histograms = new Map();
    histogramLabels = new Map();
    timers = new Map();
    timerLabels = new Map();
    counter(name, value = 1, labels = {}) {
        const metricMap = this.getOrCreate(this.counters, name);
        const key = labelsKey(labels);
        const existing = metricMap.get(key);
        if (existing) {
            existing.value += value;
        }
        else {
            metricMap.set(key, { value, labels });
        }
    }
    gauge(name, value, labels = {}) {
        const metricMap = this.getOrCreate(this.gauges, name);
        const key = labelsKey(labels);
        metricMap.set(key, { value, labels });
    }
    histogram(name, value, labels = {}) {
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
    timer(name, durationMs, labels = {}) {
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
    snapshot() {
        const now = Date.now();
        const counters = [];
        const gauges = [];
        const histograms = [];
        const timers = [];
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
                    min: values.length ? sorted[0] : 0,
                    max: values.length ? sorted[sorted.length - 1] : 0,
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
    reset() {
        this.counters.clear();
        this.gauges.clear();
        this.histograms.clear();
        this.histogramLabels.clear();
        this.timers.clear();
        this.timerLabels.clear();
    }
    getOrCreate(map, name) {
        let inner = map.get(name);
        if (!inner) {
            inner = new Map();
            map.set(name, inner);
        }
        return inner;
    }
}
exports.DefaultMetricsCollector = DefaultMetricsCollector;
//# sourceMappingURL=metrics-collector.js.map