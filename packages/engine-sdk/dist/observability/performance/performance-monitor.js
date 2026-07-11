"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultPerformanceMonitor = void 0;
class DefaultPerformanceMonitor {
    marks = new Map();
    measures = new Map();
    markOrder = [];
    mark(name, category) {
        const mark = { name, timestamp: Date.now(), category };
        this.marks.set(name, mark);
        if (!this.markOrder.includes(name)) {
            this.markOrder.push(name);
        }
        return mark;
    }
    measure(name, startMark, endMark, category, metadata) {
        const start = this.marks.get(startMark);
        const end = this.marks.get(endMark);
        if (!start) {
            throw new Error(`Start mark "${startMark}" not found`);
        }
        if (!end) {
            throw new Error(`End mark "${endMark}" not found`);
        }
        const measure = {
            name,
            startMark: start.name,
            endMark: end.name,
            durationMs: end.timestamp - start.timestamp,
            category,
            metadata,
        };
        this.measures.set(name, measure);
        return measure;
    }
    getMark(name) {
        return this.marks.get(name);
    }
    getMeasure(name) {
        return this.measures.get(name);
    }
    clearMarks() {
        this.marks.clear();
        this.markOrder = [];
    }
    clearMeasures() {
        this.measures.clear();
    }
    snapshot() {
        const mem = process.memoryUsage();
        return {
            marks: this.markOrder.map((name) => this.marks.get(name)).filter(Boolean),
            measures: Array.from(this.measures.values()),
            memory: {
                heapUsed: mem.heapUsed,
                heapTotal: mem.heapTotal,
                external: mem.external,
                rss: mem.rss,
                timestamp: Date.now(),
            },
            timestamp: Date.now(),
        };
    }
}
exports.DefaultPerformanceMonitor = DefaultPerformanceMonitor;
//# sourceMappingURL=performance-monitor.js.map