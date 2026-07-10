export interface PerformanceMark {
  name: string;
  timestamp: number;
  category?: string;
}

export interface PerformanceMeasure {
  name: string;
  startMark: string;
  endMark: string;
  durationMs: number;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface PerformanceSnapshot {
  marks: PerformanceMark[];
  measures: PerformanceMeasure[];
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    timestamp: number;
  };
  timestamp: number;
}

export interface PerformanceMonitor {
  mark(name: string, category?: string): PerformanceMark;
  measure(name: string, startMark: string, endMark: string, category?: string, metadata?: Record<string, unknown>): PerformanceMeasure;
  getMark(name: string): PerformanceMark | undefined;
  getMeasure(name: string): PerformanceMeasure | undefined;
  clearMarks(): void;
  clearMeasures(): void;
  snapshot(): PerformanceSnapshot;
}