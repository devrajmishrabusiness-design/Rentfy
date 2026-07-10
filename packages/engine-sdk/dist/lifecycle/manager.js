"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultLifecycleManager = void 0;
const errors_1 = require("../errors");
const registry_1 = require("../plugin/registry");
const executor_1 = require("../plugin/executor");
const event_bus_1 = require("../context/event-bus");
const logger_1 = require("../context/logger");
const storage_1 = require("../context/storage");
const metrics_1 = require("../context/metrics");
class DefaultLifecycleManager {
    status = 'idle';
    plugins = [];
    pluginRegistry;
    pluginExecutor;
    eventBus;
    logger;
    storage;
    metrics;
    abortController = new AbortController();
    options;
    constructor(options = {}) {
        this.options = options;
        this.eventBus = new event_bus_1.DefaultEventBus();
        this.logger = new logger_1.DefaultEngineLogger('engine-sdk');
        this.storage = new storage_1.DefaultPluginStorage();
        this.metrics = new metrics_1.DefaultPluginMetrics();
        this.pluginRegistry = new registry_1.DefaultPluginRegistry();
        this.pluginExecutor = new executor_1.DefaultPluginExecutor(this.logger);
    }
    async initialize(plugins) {
        if (this.status !== 'idle' && this.status !== 'stopped') {
            throw new EngineError(EngineErrorCode.ENGINE_ALREADY_RUNNING, 'Engine is already initialized');
        }
        this.status = 'initializing';
        this.emit({ type: 'engine:initializing', engine: 'engine-sdk', timestamp: Date.now() });
        try {
            for (const plugin of plugins) {
                this.pluginRegistry.register(plugin);
            }
            await this.validateDependencies();
            await this.initializePlugins();
            await this.hooks.onInit?.(this.createContext());
            this.status = 'running';
            this.emit({ type: 'engine:initialized', engine: 'engine-sdk', timestamp: Date.now() });
        }
        catch (error) {
            this.status = 'error';
            throw error;
        }
    }
    async execute(plugin, input) {
        if (this.status !== 'running') {
            throw new EngineError(EngineErrorCode.ENGINE_NOT_RUNNING, 'Engine is not running');
        }
        if (this.abortController.signal.aborted) {
            throw new errors_1.LifecycleError('execution', EngineErrorCode.ABORTED, 'Execution aborted');
        }
        return this.pluginExecutor.execute(plugin, input, this.createExecutionContext(plugin));
    }
    async shutdown() {
        if (this.status === 'stopped' || this.status === 'idle') {
            return;
        }
        this.status = 'stopping';
        this.abortController.abort();
        this.emit({ type: 'engine:shutdown', engine: 'engine-sdk', timestamp: Date.now() });
        try {
            const plugins = this.pluginRegistry.getEnabled().reverse();
            for (const plugin of plugins) {
                try {
                    const context = this.createShutdownContext(plugin);
                    await this.pluginExecutor.shutdown(plugin, context);
                }
                catch (error) {
                    this.logger.error(`Error shutting down plugin ${plugin.id}`, { error: error.message });
                }
            }
            await this.hooks.onShutdown?.(this.createContext());
            this.status = 'stopped';
            this.emit({ type: 'engine:shutdown:complete', engine: 'engine-sdk', timestamp: Date.now() });
        }
        catch (error) {
            this.status = 'error';
            throw error;
        }
    }
    getStatus() {
        return this.status;
    }
    getMetrics() {
        return {
            uptime: 0,
            pluginCount: this.plugins.length,
            activePlugins: this.pluginRegistry.getEnabled().length,
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            averageExecutionTime: 0,
        };
    }
    async validateDependencies() {
        const validation = this.pluginRegistry.validateDependencies();
        if (!validation.valid) {
            const errorMessages = [];
            if (validation.cycles.length > 0) {
                errorMessages.push(`Dependency cycles: ${validation.cycles.map(c => c.join(' -> ')).join(', ')}`);
            }
            if (validation.missing.length > 0) {
                errorMessages.push(`Missing dependencies: ${validation.missing.join(', ')}`);
            }
            throw new EngineError(EngineErrorCode.PLUGIN_DEPENDENCY_CYCLE, errorMessages.join('; '));
        }
    }
    async initializePlugins() {
        const plugins = this.pluginRegistry.getEnabled();
        for (const plugin of plugins) {
            if (this.abortController.signal.aborted) {
                throw new errors_1.LifecycleError('initialization', EngineErrorCode.ABORTED, 'Initialization aborted');
            }
            try {
                const context = this.createInitContext(plugin);
                await this.pluginExecutor.initialize(plugin, context);
            }
            catch (error) {
                this.status = 'error';
                throw new errors_1.PluginError(plugin.id, EngineErrorCode.PLUGIN_INIT_FAILED, `Failed to initialize plugin ${plugin.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, { cause: error instanceof Error ? error : undefined });
            }
        }
    }
    createContext() {
        return {
            engineId: 'engine-sdk',
            engineVersion: '1.0.0',
            runId: this.generateRunId(),
            status: this.status,
            startTime: Date.now(),
        };
    }
    createInitContext(plugin) {
        return {
            engineId: 'engine-sdk',
            engineVersion: '1.0.0',
            pluginId: plugin.id,
            config: plugin.config,
            logger: this.logger,
            storage: this.storage,
            eventBus: this.eventBus,
            metrics: this.metrics,
            signals: this.abortController.signal,
        };
    }
    createExecutionContext(plugin) {
        return {
            engineId: 'engine-sdk',
            engineVersion: '1.0.0',
            runId: this.generateRunId(),
            pluginId: plugin.id,
            config: plugin.config,
            logger: this.logger,
            storage: this.storage,
            eventBus: this.eventBus,
            metrics: this.metrics,
            signals: this.abortController.signal,
            metadata: {},
        };
    }
    createShutdownContext(plugin) {
        return {
            engineId: 'engine-sdk',
            pluginId: plugin.id,
            logger: this.logger,
        };
    }
    generateRunId() {
        return `engine-sdk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
    emit(event) {
        this.eventBus.emit(event);
    }
    on(event, handler) {
        this.eventBus.on(event, handler);
    }
    off(event, handler) {
        this.eventBus.off(event, handler);
    }
    hooks = {
        onInit: async () => { },
        onShutdown: async () => { },
    };
}
exports.DefaultLifecycleManager = DefaultLifecycleManager;
//# sourceMappingURL=manager.js.map