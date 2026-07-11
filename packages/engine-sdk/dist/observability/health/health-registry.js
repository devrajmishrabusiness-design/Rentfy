"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultHealthCheckRegistry = void 0;
function determineOverall(statuses) {
    if (statuses.length === 0)
        return 'healthy';
    if (statuses.includes('unhealthy'))
        return 'unhealthy';
    if (statuses.includes('degraded'))
        return 'degraded';
    return 'healthy';
}
class DefaultHealthCheckRegistry {
    checks = new Map();
    startTime = Date.now();
    register(name, check, metadata) {
        this.checks.set(name, { fn: check, metadata });
    }
    unregister(name) {
        return this.checks.delete(name);
    }
    async check(name) {
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
    async checkAll() {
        const results = await Promise.all(Array.from(this.checks.entries()).map(([name, check]) => healthCheckErrorWrapper(name, check.fn)));
        return results;
    }
    async snapshot() {
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
exports.DefaultHealthCheckRegistry = DefaultHealthCheckRegistry;
async function healthCheckErrorWrapper(name, fn) {
    const start = Date.now();
    try {
        const result = await fn();
        return {
            ...result,
            name: result.name || name,
            timestamp: result.timestamp || Date.now(),
            durationMs: Date.now() - start,
        };
    }
    catch (err) {
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
//# sourceMappingURL=health-registry.js.map