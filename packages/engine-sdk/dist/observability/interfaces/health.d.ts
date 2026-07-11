export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export interface HealthCheckResult {
    name: string;
    status: HealthStatus;
    message?: string;
    durationMs: number;
    timestamp: number;
    metadata?: Record<string, unknown>;
    error?: {
        name: string;
        message: string;
    };
}
export interface HealthSnapshot {
    overall: HealthStatus;
    checks: HealthCheckResult[];
    timestamp: number;
    uptimeMs: number;
}
export type HealthCheckFn = () => Promise<HealthCheckResult>;
export interface HealthCheckRegistry {
    register(name: string, check: HealthCheckFn, metadata?: Record<string, unknown>): void;
    unregister(name: string): boolean;
    check(name?: string): Promise<HealthCheckResult | HealthCheckResult[]>;
    checkAll(): Promise<HealthCheckResult[]>;
    snapshot(): Promise<HealthSnapshot>;
}
//# sourceMappingURL=health.d.ts.map