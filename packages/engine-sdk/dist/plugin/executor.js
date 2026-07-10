"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultPluginExecutor = void 0;
const errors_1 = require("../errors");
class DefaultPluginExecutor {
    activeExecutions = new Map();
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    async initialize(plugin, context) {
        if (!plugin.onInit) {
            return;
        }
        try {
            await this.withTimeout(plugin.onInit(context), 30000, `Plugin '${plugin.id}' initialization timeout`);
        }
        catch (error) {
            throw new errors_1.PluginError(plugin.id, errors_1.EngineErrorCode.LIFECYCLE_HOOK_FAILED, `Plugin '${plugin.id}' initialization failed`, {
                cause: error instanceof Error ? error : undefined,
            });
        }
    }
    async execute(plugin, input, context) {
        const startTime = Date.now();
        const abortController = new AbortController();
        this.activeExecutions.set(plugin.id, abortController);
        const executionContext = {
            ...context,
            signals: abortController.signal,
        };
        try {
            if (plugin.validateConfig && !plugin.validateConfig(context.config)) {
                throw new errors_1.PluginError(plugin.id, errors_1.EngineErrorCode.PLUGIN_EXECUTION_FAILED, `Plugin '${plugin.id}' config validation failed`);
            }
            const output = await this.withTimeout(plugin.execute(input, executionContext), context.signals.reason ? 0 : 300000, `Plugin '${plugin.id}' execution timeout`);
            return {
                success: true,
                output: output,
                executionTime: Date.now() - startTime,
                skipped: false,
            };
        }
        catch (error) {
            const engineError = error instanceof Error
                ? new errors_1.PluginError(plugin.id, errors_1.EngineErrorCode.PLUGIN_EXECUTION_FAILED, `Plugin '${plugin.id}' execution failed`, {
                    cause: error,
                })
                : new errors_1.PluginError(plugin.id, errors_1.EngineErrorCode.PLUGIN_EXECUTION_FAILED, `Plugin '${plugin.id}' execution failed`, {
                    cause: error instanceof Error ? error : undefined,
                });
            return {
                success: false,
                error: engineError,
                executionTime: Date.now() - startTime,
                skipped: false,
            };
        }
        finally {
            this.activeExecutions.delete(plugin.id);
        }
    }
    async shutdown(plugin, context) {
        if (!plugin.onShutdown) {
            return;
        }
        try {
            await this.withTimeout(plugin.onShutdown(context), 10000, `Plugin '${plugin.id}' shutdown timeout`);
        }
        catch (error) {
            context.logger.error(`Plugin '${plugin.id}' shutdown failed`, { error: error.message });
        }
    }
    abort(pluginId) {
        const controller = this.activeExecutions.get(pluginId);
        if (controller) {
            controller.abort();
        }
    }
    abortAll() {
        for (const controller of this.activeExecutions.values()) {
            controller.abort();
        }
        this.activeExecutions.clear();
    }
    async withTimeout(promise, timeoutMs, timeoutMessage) {
        if (timeoutMs <= 0) {
            return promise;
        }
        return Promise.race([
            promise,
            new Promise((_, reject) => {
                const timeout = setTimeout(() => {
                    reject(new errors_1.LifecycleError('execution', errors_1.EngineErrorCode.TIMEOUT, timeoutMessage));
                }, timeoutMs);
                promise.finally(() => clearTimeout(timeout));
            }),
        ]);
    }
}
exports.DefaultPluginExecutor = DefaultPluginExecutor;
//# sourceMappingURL=executor.js.map