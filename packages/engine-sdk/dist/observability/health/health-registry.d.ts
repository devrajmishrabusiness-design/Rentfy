import type { HealthCheckRegistry, HealthCheckFn, HealthCheckResult, HealthSnapshot } from '../interfaces/health';
export declare class DefaultHealthCheckRegistry implements HealthCheckRegistry {
    private checks;
    private startTime;
    register(name: string, check: HealthCheckFn, metadata?: Record<string, unknown>): void;
    unregister(name: string): boolean;
    check(name?: string): Promise<HealthCheckResult | HealthCheckResult[]>;
    checkAll(): Promise<HealthCheckResult[]>;
    snapshot(): Promise<HealthSnapshot>;
}
//# sourceMappingURL=health-registry.d.ts.map