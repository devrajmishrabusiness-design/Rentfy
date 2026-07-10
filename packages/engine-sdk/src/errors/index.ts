export enum EngineErrorCode {
  ENGINE_NOT_INITIALIZED = 'ENGINE_NOT_INITIALIZED',
  ENGINE_ALREADY_RUNNING = 'ENGINE_ALREADY_RUNNING',
  ENGINE_START_FAILED = 'ENGINE_START_FAILED',
  ENGINE_STOP_FAILED = 'ENGINE_STOP_FAILED',
  ENGINE_CONFIG_INVALID = 'ENGINE_CONFIG_INVALID',
  PLUGIN_NOT_FOUND = 'PLUGIN_NOT_FOUND',
  PLUGIN_ALREADY_REGISTERED = 'PLUGIN_ALREADY_REGISTERED',
  PLUGIN_REGISTRATION_FAILED = 'PLUGIN_REGISTRATION_FAILED',
  PLUGIN_EXECUTION_FAILED = 'PLUGIN_EXECUTION_FAILED',
  PLUGIN_INIT_FAILED = 'PLUGIN_INIT_FAILED',
  PLUGIN_SHUTDOWN_FAILED = 'PLUGIN_SHUTDOWN_FAILED',
  PLUGIN_DEPENDENCY_CYCLE = 'PLUGIN_DEPENDENCY_CYCLE',
  PLUGIN_DEPENDENCY_MISSING = 'PLUGIN_DEPENDENCY_MISSING',
  PLUGIN_VERSION_INCOMPATIBLE = 'PLUGIN_VERSION_INCOMPATIBLE',
  LIFECYCLE_HOOK_FAILED = 'LIFECYCLE_HOOK_FAILED',
  CONFIG_VALIDATION_FAILED = 'CONFIG_VALIDATION_FAILED',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  ENGINE_NOT_RUNNING = 'ENGINE_NOT_RUNNING',
  CONTEXT_CREATION_FAILED = 'CONTEXT_CREATION_FAILED',
  TIMEOUT = 'TIMEOUT',
  ABORTED = 'ABORTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class BaseEngineError extends Error {
  public readonly code: EngineErrorCode;
  public readonly metadata?: Record<string, unknown>;
  public readonly details?: Record<string, unknown>;
  public override readonly cause?: Error;
  public readonly timestamp: number;
  public readonly category: string;

  constructor(code: EngineErrorCode, message: string, options?: { metadata?: Record<string, unknown>; details?: Record<string, unknown>; cause?: Error; category?: string }) {
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

  static isEngineError(error: unknown): error is BaseEngineError {
    return error instanceof BaseEngineError;
  }

  toJSON(): Record<string, unknown> {
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

export class EngineError extends BaseEngineError {
  public override readonly category: string = 'engine';

  constructor(code: EngineErrorCode, message: string, options?: { metadata?: Record<string, unknown>; cause?: Error }) {
    super(code, message, { ...options, category: 'engine' });
    this.name = 'EngineError';
    Object.setPrototypeOf(this, EngineError.prototype);
  }
}

export class PluginError extends BaseEngineError {
  public readonly pluginId: string;
  public override readonly category: string = 'plugin';

  constructor(pluginId: string, code: EngineErrorCode, message: string, options?: { metadata?: Record<string, unknown>; cause?: Error }) {
    super(code, message, { ...options, category: 'plugin' });
    this.name = 'PluginError';
    this.pluginId = pluginId;
    Object.setPrototypeOf(this, PluginError.prototype);
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      pluginId: this.pluginId,
      category: this.category,
    };
  }
}

export class ConfigurationError extends BaseEngineError {
  public override readonly category: string = 'configuration';

  constructor(code: EngineErrorCode, message: string, options?: { metadata?: Record<string, unknown>; cause?: Error }) {
    super(code, message, { ...options, category: 'configuration' });
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

export class LifecycleError extends BaseEngineError {
  public readonly phase: string;
  public override readonly category: string = 'lifecycle';

  constructor(phase: string, code: EngineErrorCode, message: string, options?: { metadata?: Record<string, unknown>; cause?: Error }) {
    super(code, message, { ...options, category: 'lifecycle' });
    this.name = 'LifecycleError';
    this.phase = phase;
    Object.setPrototypeOf(this, LifecycleError.prototype);
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      phase: this.phase,
      category: this.category,
    };
  }
}