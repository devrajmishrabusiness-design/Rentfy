"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleError = exports.ConfigurationError = exports.PluginError = exports.EngineError = exports.BaseEngineError = exports.EngineErrorCode = void 0;
var EngineErrorCode;
(function (EngineErrorCode) {
    EngineErrorCode["ENGINE_NOT_INITIALIZED"] = "ENGINE_NOT_INITIALIZED";
    EngineErrorCode["ENGINE_ALREADY_RUNNING"] = "ENGINE_ALREADY_RUNNING";
    EngineErrorCode["ENGINE_START_FAILED"] = "ENGINE_START_FAILED";
    EngineErrorCode["ENGINE_STOP_FAILED"] = "ENGINE_STOP_FAILED";
    EngineErrorCode["ENGINE_CONFIG_INVALID"] = "ENGINE_CONFIG_INVALID";
    EngineErrorCode["PLUGIN_NOT_FOUND"] = "PLUGIN_NOT_FOUND";
    EngineErrorCode["PLUGIN_ALREADY_REGISTERED"] = "PLUGIN_ALREADY_REGISTERED";
    EngineErrorCode["PLUGIN_REGISTRATION_FAILED"] = "PLUGIN_REGISTRATION_FAILED";
    EngineErrorCode["PLUGIN_EXECUTION_FAILED"] = "PLUGIN_EXECUTION_FAILED";
    EngineErrorCode["PLUGIN_INIT_FAILED"] = "PLUGIN_INIT_FAILED";
    EngineErrorCode["PLUGIN_SHUTDOWN_FAILED"] = "PLUGIN_SHUTDOWN_FAILED";
    EngineErrorCode["PLUGIN_DEPENDENCY_CYCLE"] = "PLUGIN_DEPENDENCY_CYCLE";
    EngineErrorCode["PLUGIN_DEPENDENCY_MISSING"] = "PLUGIN_DEPENDENCY_MISSING";
    EngineErrorCode["PLUGIN_VERSION_INCOMPATIBLE"] = "PLUGIN_VERSION_INCOMPATIBLE";
    EngineErrorCode["LIFECYCLE_HOOK_FAILED"] = "LIFECYCLE_HOOK_FAILED";
    EngineErrorCode["CONFIG_VALIDATION_FAILED"] = "CONFIG_VALIDATION_FAILED";
    EngineErrorCode["INVALID_STATE_TRANSITION"] = "INVALID_STATE_TRANSITION";
    EngineErrorCode["ENGINE_NOT_RUNNING"] = "ENGINE_NOT_RUNNING";
    EngineErrorCode["CONTEXT_CREATION_FAILED"] = "CONTEXT_CREATION_FAILED";
    EngineErrorCode["TIMEOUT"] = "TIMEOUT";
    EngineErrorCode["ABORTED"] = "ABORTED";
    EngineErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(EngineErrorCode || (exports.EngineErrorCode = EngineErrorCode = {}));
class BaseEngineError extends Error {
    code;
    metadata;
    details;
    cause;
    timestamp;
    category;
    constructor(code, message, options) {
        super(message);
        this.name = 'EngineError';
        this.code = code;
        this.metadata = options?.metadata;
        this.details = options?.details;
        this.cause = options?.cause;
        this.timestamp = Date.now();
        this.category = options?.category ?? 'engine';
        Object.setPrototypeOf(this, BaseEngineError.prototype);
    }
    static isEngineError(error) {
        return error instanceof BaseEngineError;
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            metadata: this.metadata,
            details: this.details,
            cause: this.cause?.message,
            timestamp: this.timestamp,
            category: this.category,
            stack: this.stack,
        };
    }
}
exports.BaseEngineError = BaseEngineError;
class EngineError extends BaseEngineError {
    category = 'engine';
    constructor(code, message, options) {
        super(code, message, { ...options, category: 'engine' });
        this.name = 'EngineError';
        Object.setPrototypeOf(this, EngineError.prototype);
    }
}
exports.EngineError = EngineError;
class PluginError extends BaseEngineError {
    pluginId;
    category = 'plugin';
    constructor(pluginId, code, message, options) {
        super(code, message, { ...options, category: 'plugin' });
        this.name = 'PluginError';
        this.pluginId = pluginId;
        Object.setPrototypeOf(this, PluginError.prototype);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            pluginId: this.pluginId,
            category: this.category,
        };
    }
}
exports.PluginError = PluginError;
class ConfigurationError extends BaseEngineError {
    category = 'configuration';
    constructor(code, message, options) {
        super(code, message, { ...options, category: 'configuration' });
        this.name = 'ConfigurationError';
        Object.setPrototypeOf(this, ConfigurationError.prototype);
    }
}
exports.ConfigurationError = ConfigurationError;
class LifecycleError extends BaseEngineError {
    phase;
    category = 'lifecycle';
    constructor(phase, code, message, options) {
        super(code, message, { ...options, category: 'lifecycle' });
        this.name = 'LifecycleError';
        this.phase = phase;
        Object.setPrototypeOf(this, LifecycleError.prototype);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            phase: this.phase,
            category: this.category,
        };
    }
}
exports.LifecycleError = LifecycleError;
//# sourceMappingURL=index.js.map