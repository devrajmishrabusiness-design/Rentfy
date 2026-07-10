import type { HealthCheckRegistry, HealthCheckFn, HealthCheckResult, HealthSnapshot, HealthStatus } from '../interfaces/health';

function determineOverall(statuses: HealthStatus[]): HealthStatus {
  if (statuses.length === 0) return 'healthy';
  if (statuses.includes('unhealthy')) return 'unhealthy';
  if (statuses.includes('degraded')) return 'degraded';
  return 'healthy';
}

export class DefaultHealthCheckRegistry implements HealthCheckRegistry {
  private checks: Map<string, { fn: HealthCheckFn; metadata?: Record<string, unknown> }> = new Map();
  private startTime: number = Date.now();

  register(name: string, check: HealthCheckFn, metadata?: Record<string, unknown>): void {
    this.checks.set(name, { fn: check, metadata });
  }

  unregister(name: string): boolean {
    return this.checks.delete(name);
  }

  async check(name?: string): Promise<HealthCheckResult | HealthCheckResult[]> {
    const now = Date.now();
    if (name) {
      const check = this.checks.get(name);
      if (!check) {
        return {
          name,
          status: 'unhealthy',
          message: `Health check "${name}" not registered`,
          durationMs: 0,
          timestamp: now,
        };
      }
      return healthCheckErrorWrapper(name, check.fn);
    }
    return this.checkAll();
  }

  async checkAll(): Promise<HealthCheckResult[]> {
    const results = await Promise.all(
      Array.from(this.checks.entries()).map(([name, check]) =>
        healthCheckErrorWrapper(name, check.fn),
      ),
    );
    return results;
  }

  async snapshot(): Promise<HealthSnapshot> {
    const results = await this.checkAll();
    const statuses = results.map((r) => r.status);
    return {
      overall: determineOverall(statuses),
      checks: results,
      timestamp: Date.now(),
      uptimeMs: Date.now() - this.startTime,
    };
  }
}

async function healthCheckErrorWrapper(name: string, fn: HealthCheckFn): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const result = await fn();
    return {
      ...result,
      name: result.name || name,
      timestamp: result.timestamp || Date.now(),
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return {
      name,
      status: 'unhealthy',
      message: error.message,
      durationMs: Date.now() - start,
      timestamp: Date.now(),
      error: { name: error.name, message: error.message },
    };
  }
}