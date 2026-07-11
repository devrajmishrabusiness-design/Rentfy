import type { PerformanceMonitor, PerformanceMark, PerformanceMeasure, PerformanceSnapshot } from '../interfaces/performance';
export declare class DefaultPerformanceMonitor implements PerformanceMonitor {
    private marks;
    private measures;
    private markOrder;
    mark(name: string, category?: string): PerformanceMark;
    measure(name: string, startMark: string, endMark: string, category?: string, metadata?: Record<string, unknown>): PerformanceMeasure;
    getMark(name: string): PerformanceMark | undefined;
    getMeasure(name: string): PerformanceMeasure | undefined;
    clearMarks(): void;
    clearMeasures(): void;
    snapshot(): PerformanceSnapshot;
}
//# sourceMappingURL=performance-monitor.d.ts.map