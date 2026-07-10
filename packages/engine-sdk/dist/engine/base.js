"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractEngine = void 0;
const types_1 = require("../types");
const errors_1 = require("../errors");
const registry_1 = require("../plugin/registry");
const executor_1 = require("../plugin/executor");
const event_bus_1 = require("../context/event-bus");
const logger_1 = require("../context/logger");
const storage_1 = require("../context/storage");
const metrics_1 = require("../context/metrics");
class AbstractEngine {
    info;
    config;
    status = types_1.EngineStatus.IDLE;
    metrics = this.getInitialMetrics();
    hooks;
    eventBus;
    logger;
    storage;
    pluginRegistry;
    pluginExecutor;
    pluginMetrics;
    initialized = false;
    running = false;
    abortController = new AbortController();
    constructor(info, config, hooks = {}, options = {}) {
        this.info = info;
        this.config = config;
        this.hooks = hooks;
        this.eventBus = options.eventBus ?? new event_bus_1.DefaultEventBus();
        this.logger = options.logger ?? new logger_1.DefaultEngineLogger(info.name);
        this.storage = options.storage ?? new storage_1.DefaultPluginStorage();
        this.pluginRegistry = options.pluginRegistry ?? new registry_1.DefaultPluginRegistry();
        this.pluginExecutor = options.pluginExecutor ?? new executor_1.DefaultPluginExecutor(this.logger);
        this.pluginMetrics = options.pluginMetrics ?? new metrics_1.DefaultPluginMetrics();
        this.setupDefaultHooks();
    }
    setupDefaultHooks() {
        this.hooks.beforeRun ??= async () => { };
        this.hooks.afterRun ??= async () => { };
        this.hooks.beforePhase ??= async () => { };
        this.hooks.afterPhase ??= async () => { };
        this.hooks.beforePlugin ??= async () => { };
        this.hooks.afterPlugin ??= async () => { };
        this.hooks.onError ??= async () => { };
        this.hooks.onInit ??= async () => { };
        this.hooks.onShutdown ??= async () => { };
    }
    getInitialMetrics() {
        return {
            totalRuns: 0,
            successfulRuns: 0,
            failedRuns: 0,
            averageExecutionTime: 0,
            pluginMetrics: {},
        };
    }
    async initialize(config) {
        if (this.initialized) {
            this.logger.warn('Engine already initialized');
            return;
        }
        if (config) {
            Object.assign(this.config, config);
        }
        this.status = types_1.EngineStatus.INITIALIZING;
        this.emit({ type: 'engine:initializing', engine: this.info.name, timestamp: Date.now() });
        try {
            await this.validateConfig(this.config);
            await this.registerPlugins(this.config['plugins'] || []);
            await this.initializePlugins();
            await this.onInitialize();
            this.initialized = true;
            this.status = types_1.EngineStatus.IDLE;
            this.emit({ type: 'engine:initialized', engine: this.info.name, timestamp: Date.now() });
            this.logger.info(`Engine ${this.info.name} v${this.info.version} initialized`);
        }
        catch (error) {
            this.status = types_1.EngineStatus.ERROR;
            const engineError = this.createError(errors_1.EngineErrorCode.ENGINE_START_FAILED, `Failed to initialize engine: ${error instanceof Error ? error.message : 'Unknown error'}`, { cause: error instanceof Error ? error : undefined });
            this.emit({ type: 'engine:error', engine: this.info.name, error: engineError, timestamp: Date.now() });
            throw engineError;
        }
    }
    async start() {
        if (!this.initialized) {
            throw this.createError(errors_1.EngineErrorCode.ENGINE_NOT_INITIALIZED, 'Engine must be initialized before starting');
        }
        if (this.running) {
            throw this.createError(errors_1.EngineErrorCode.ENGINE_ALREADY_RUNNING, 'Engine is already running');
        }
        this.running = true;
        this.status = types_1.EngineStatus.RUNNING;
        this.abortController = new AbortController();
        this.emit({ type: 'engine:started', engine: this.info.name, timestamp: Date.now() });
        this.logger.info(`Engine ${this.info.name} started`);
        await this.onStart();
    }
    async stop() {
        if (!this.running) {
            this.logger.warn('Engine not running');
            return;
        }
        this.status = types_1.EngineStatus.STOPPING;
        this.emit({ type: 'engine:stopping', engine: this.info.name, timestamp: Date.now() });
        this.logger.info(`Engine ${this.info.name} stopping`);
        try {
            this.abortController.abort();
            await this.onStop();
            this.running = false;
            this.status = types_1.EngineStatus.IDLE;
            this.emit({ type: 'engine:stopped', engine: this.info.name, timestamp: Date.now() });
            this.logger.info(`Engine ${this.info.name} stopped`);
        }
        catch (error) {
            this.status = types_1.EngineStatus.ERROR;
            const engineError = this.createError(errors_1.EngineErrorCode.ENGINE_STOP_FAILED, `Failed to stop engine: ${error instanceof Error ? error.message : 'Unknown error'}`, { cause: error instanceof Error ? error : undefined });
            this.emit({ type: 'engine:error', engine: this.info.name, error: engineError, timestamp: Date.now() });
            throw engineError;
        }
    }
    async dispose() {
        if (this.running) {
            await this.stop();
        }
        this.status = types_1.EngineStatus.STOPPING;
        this.emit({ type: 'engine:disposing', engine: this.info.name, timestamp: Date.now() });
        this.logger.info(`Engine ${this.info.name} disposing`);
        try {
            await this.shutdownPlugins();
            await this.onDispose();
            this.initialized = false;
            this.emit({ type: 'engine:disposed', engine: this.info.name, timestamp: Date.now() });
            this.logger.info(`Engine ${this.info.name} disposed`);
        }
        catch (error) {
            this.logger.error(`Error during disposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    async health() {
        return {
            status: this.status === types_1.EngineStatus.ERROR ? 'unhealthy' : this.status === types_1.EngineStatus.IDLE ? 'healthy' : 'degraded',
            engine: this.info.name,
            version: this.info.version,
            uptime: this.metrics.lastRunTime ? Date.now() - this.metrics.lastRunTime : 0,
            plugins: Array.from(this.pluginRegistry.getEnabled()).map(p => ({
                id: p.id,
                status: 'healthy',
                version: p.version,
            })),
            checks: {
                initialized: this.initialized,
                running: this.running,
                storage: await this.checkStorage(),
            },
        };
    }
    async checkStorage() {
        try {
            await this.storage.set('health_check', 'ok');
            const value = await this.storage.get('health_check');
            await this.storage.delete('health_check');
            return value === 'ok';
        }
        catch {
            return false;
        }
    }
    on(event, handler) {
        this.eventBus.on(event, handler);
    }
    off(event, handler) {
        this.eventBus.off(event, handler);
    }
    emit(event) {
        this.eventBus.emit(event);
    }
    async initializePlugins() {
        const plugins = this.pluginRegistry.getEnabled();
        for (const plugin of plugins) {
            try {
                const context = this.createInitContext(plugin);
                await this.pluginExecutor.initialize(plugin, context);
            }
            catch (error) {
                const pluginError = this.createError(errors_1.EngineErrorCode.PLUGIN_INIT_FAILED, `Failed to initialize plugin ${plugin.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, { pluginId: plugin.id, cause: error instanceof Error ? error : undefined });
                throw pluginError;
            }
        }
    }
    async shutdownPlugins() {
        const plugins = this.pluginRegistry.getEnabled().reverse();
        for (const plugin of plugins) {
            try {
                const context = this.createShutdownContext(plugin);
                await this.pluginExecutor.shutdown(plugin, context);
            }
            catch (error) {
                this.logger.error(`Error shutting down plugin ${plugin.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, { pluginId: plugin.id });
            }
        }
    }
    createInitContext(plugin) {
        return {
            engineId: this.info.name,
            engineVersion: this.info.version,
            pluginId: plugin.id,
            config: plugin.config ?? {},
            logger: this.logger,
            storage: this.storage,
            eventBus: this.eventBus,
            metrics: this.pluginMetrics,
            signals: this.abortController.signal,
        };
    }
    createExecutionContext(plugin, metadata = {}) {
        return {
            engineId: this.info.name,
            engineVersion: this.info.version,
            runId: this.generateRunId(),
            pluginId: plugin.id,
            config: plugin.config ?? {},
            logger: this.logger,
            storage: this.storage,
            eventBus: this.eventBus,
            metrics: this.pluginMetrics,
            signals: this.abortController.signal,
            metadata,
        };
    }
    createShutdownContext(plugin) {
        return {
            engineId: this.info.name,
            pluginId: plugin.id,
            logger: this.logger,
        };
    }
    generateRunId() {
        return `${this.info.name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
    createError(code, message, options) {
        if (options?.pluginId) {
            return new errors_1.PluginError(options.pluginId, code, message, { metadata: options?.metadata, cause: options?.cause });
        }
        return new errors_1.EngineError(code, message, { metadata: options?.metadata, cause: options?.cause });
    }
}
exports.AbstractEngine = AbstractEngine;
//# sourceMappingURL=base.js.map