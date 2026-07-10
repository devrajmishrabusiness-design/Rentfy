export declare enum EngineErrorCode {
    ENGINE_NOT_INITIALIZED = "ENGINE_NOT_INITIALIZED",
    ENGINE_ALREADY_RUNNING = "ENGINE_ALREADY_RUNNING",
    ENGINE_START_FAILED = "ENGINE_START_FAILED",
    ENGINE_STOP_FAILED = "ENGINE_STOP_FAILED",
    ENGINE_CONFIG_INVALID = "ENGINE_CONFIG_INVALID",
    PLUGIN_NOT_FOUND = "PLUGIN_NOT_FOUND",
    PLUGIN_ALREADY_REGISTERED = "PLUGIN_ALREADY_REGISTERED",
    PLUGIN_REGISTRATION_FAILED = "PLUGIN_REGISTRATION_FAILED",
    PLUGIN_EXECUTION_FAILED = "PLUGIN_EXECUTION_FAILED",
    PLUGIN_INIT_FAILED = "PLUGIN_INIT_FAILED",
    PLUGIN_SHUTDOWN_FAILED = "PLUGIN_SHUTDOWN_FAILED",
    PLUGIN_DEPENDENCY_CYCLE = "PLUGIN_DEPENDENCY_CYCLE",
    PLUGIN_DEPENDENCY_MISSING = "PLUGIN_DEPENDENCY_MISSING",
    PLUGIN_VERSION_INCOMPATIBLE = "PLUGIN_VERSION_INCOMPATIBLE",
    LIFECYCLE_HOOK_FAILED = "LIFECYCLE_HOOK_FAILED",
    CONFIG_VALIDATION_FAILED = "CONFIG_VALIDATION_FAILED",
    INVALID_STATE_TRANSITION = "INVALID_STATE_TRANSITION",
    TIMEOUT = "TIMEOUT",
    ABORTED = "ABORTED",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export declare class BaseEngineError extends Error {
    readonly code: EngineErrorCode;
    readonly metadata?: Record<string, unknown>;
    readonly cause?: Error;
    readonly timestamp: number;
    readonly category: string;
    constructor(code: EngineErrorCode, message: string, options?: {
        metadata?: Record<string, unknown>;
        cause?: Error;
        category?: string;
    });
    static isEngineError(error: unknown): error is BaseEngineError;
    toJSON(): Record<string, unknown>;
}
export declare class EngineError extends BaseEngineError {
    readonly category = "engine";
    constructor(code: EngineErrorCode, message: string, options?: {
        metadata?: Record<string, unknown>;
        cause?: Error;
    });
}
export declare class PluginError extends BaseEngineError {
    readonly pluginId: string;
    readonly category = "plugin";
    constructor(pluginId: string, code: EngineErrorCode, message: string, options?: {
        metadata?: Record<string, unknown>;
        cause?: Error;
    });
    toJSON(): Record<string, unknown>;
}
export declare class ConfigurationError extends BaseEngineError {
    readonly category = "configuration";
    constructor(code: EngineErrorCode, message: string, options?: {
        metadata?: Record<string, unknown>;
        cause?: Error;
    });
}
export declare class LifecycleError extends BaseEngineError {
    readonly phase: string;
    readonly category = "lifecycle";
    constructor(phase: string, code: EngineErrorCode, message: string, options?: {
        metadata?: Record<string, unknown>;
        cause?: Error;
    });
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=index.d.ts.map