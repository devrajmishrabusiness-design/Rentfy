import type { Diagnostics, DiagnosticsSnapshot } from '../interfaces/diagnostics';
import type { MetricsCollector } from '../interfaces/metrics';
import type { Tracer } from '../interfaces/tracing';
import type { HealthCheckRegistry } from '../interfaces/health';
import type { PerformanceMonitor } from '../interfaces/performance';
export declare class DefaultDiagnostics implements Diagnostics {
    private startTime;
    private metrics;
    private tracer;
    private health;
    private performance;
    constructor(deps: {
        metrics: MetricsCollector;
        tracer: Tracer;
        health: HealthCheckRegistry;
        performance: PerformanceMonitor;
    });
    snapshot(): DiagnosticsSnapshot;
    snapshotAsync(): Promise<DiagnosticsSnapshot>;
}
//# sourceMappingURL=diagnostics.d.ts.map