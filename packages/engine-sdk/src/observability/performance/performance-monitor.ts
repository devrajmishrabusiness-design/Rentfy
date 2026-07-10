import type { PerformanceMonitor, PerformanceMark, PerformanceMeasure, PerformanceSnapshot } from '../interfaces/performance';

export class DefaultPerformanceMonitor implements PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private measures: Map<string, PerformanceMeasure> = new Map();
  private markOrder: string[] = [];

  mark(name: string, category?: string): PerformanceMark {
    const mark: PerformanceMark = { name, timestamp: Date.now(), category };
    this.marks.set(name, mark);
    if (!this.markOrder.includes(name)) {
      this.markOrder.push(name);
    }
    return mark;
  }

  measure(name: string, startMark: string, endMark: string, category?: string, metadata?: Record<string, unknown>): PerformanceMeasure {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);
    if (!start) {
      throw new Error(`Start mark "${startMark}" not found`);
    }
    if (!end) {
      throw new Error(`End mark "${endMark}" not found`);
    }
    const measure: PerformanceMeasure = {
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

  getMark(name: string): PerformanceMark | undefined {
    return this.marks.get(name);
  }

  getMeasure(name: string): PerformanceMeasure | undefined {
    return this.measures.get(name);
  }

  clearMarks(): void {
    this.marks.clear();
    this.markOrder = [];
  }

  clearMeasures(): void {
    this.measures.clear();
  }

  snapshot(): PerformanceSnapshot {
    const mem = process.memoryUsage();
    return {
      marks: this.markOrder.map((name) => this.marks.get(name)!).filter(Boolean),
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