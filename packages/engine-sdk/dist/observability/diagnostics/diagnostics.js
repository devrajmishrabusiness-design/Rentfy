"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultDiagnostics = void 0;
const os_1 = require("os");
function captureSystemInfo() {
    return {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        cpus: (0, os_1.cpus)().length,
        uptime: process.uptime(),
        memory: {
            heapUsed: process.memoryUsage().heapUsed,
            heapTotal: process.memoryUsage().heapTotal,
            external: process.memoryUsage().external,
            rss: process.memoryUsage().rss,
        },
        pid: process.pid,
    };
}
class DefaultDiagnostics {
    startTime;
    metrics;
    tracer;
    health;
    performance;
    constructor(deps) {
        this.startTime = Date.now();
        this.metrics = deps.metrics;
        this.tracer = deps.tracer;
        this.health = deps.health;
        this.performance = deps.performance;
    }
    snapshot() {
        return {
            timestamp: Date.now(),
            system: captureSystemInfo(),
            metrics: this.metrics.snapshot(),
            traces: this.tracer.snapshot(),
            health: {
                overall: 'healthy',
                checks: [],
                timestamp: Date.now(),
                uptimeMs: Date.now() - this.startTime,
            },
            performance: this.performance.snapshot(),
            uptimeMs: Date.now() - this.startTime,
        };
    }
    async snapshotAsync() {
        const healthSnapshot = await this.health.snapshot();
        return {
            timestamp: Date.now(),
            system: captureSystemInfo(),
            metrics: this.metrics.snapshot(),
            traces: this.tracer.snapshot(),
            health: healthSnapshot,
            performance: this.performance.snapshot(),
            uptimeMs: Date.now() - this.startTime,
        };
    }
}
exports.DefaultDiagnostics = DefaultDiagnostics;
//# sourceMappingURL=diagnostics.js.map