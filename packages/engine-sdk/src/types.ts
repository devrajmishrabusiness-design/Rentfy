import type { EngineError } from './errors';

export interface EngineInfo {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
}

export interface EngineMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  license?: string;
}

export interface EngineCapabilities {
  maxConcurrency?: number;
  supportsStreaming?: boolean;
  supportsCheckpointing?: boolean;
  supportedPhases?: string[];
  customCapabilities?: Record<string, unknown>;
}

export enum EngineStatus {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  IDLE = 'idle',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
}

export type PluginStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface PluginMetrics {
  executions: number;
  successes: number;
  failures: number;
  averageTime: number;
  lastExecutionTime?: number;
}

export interface EngineMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageExecutionTime: number;
  lastRunTime?: number;
  pluginMetrics: Record<string, PluginMetrics>;
  pluginCount?: number;
  activePlugins?: number;
}

export interface PluginState {
  id: string;
  status: PluginStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: EngineError;
  executionTime?: number;
}

export interface EngineState {
  status: EngineStatus;
  startedAt?: Date;
  stoppedAt?: Date;
  currentPhase?: string;
  error?: EngineError;
  plugins: PluginState[];
  metrics: EngineMetrics;
}

export interface PluginDefinition<Input = unknown, Output = unknown, Config = unknown> {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  priority?: number;
  phase?: string;
  config?: Config;
  validateConfig?: (config: Config) => boolean;
  execute: (input: Input, context: PluginExecutionContext<Config>) => Promise<Output> | Output;
  onInit?: (context: PluginInitContext<Config>) => Promise<void> | void;
  onShutdown?: (context: PluginShutdownContext) => Promise<void> | void;
}

export interface PluginConfig {
  id: string;
  enabled?: boolean;
  priority?: number;
  config?: Record<string, unknown>;
}

export interface PluginInitContext<Config = unknown> {
  engineId: string;
  engineVersion: string;
  pluginId: string;
  config: Config;
  logger: PluginLogger;
  storage: PluginStorage;
  eventBus: EventBus;
  metrics: PluginMetrics;
  signals: AbortSignal;
}

export interface PluginExecutionContext<Config = unknown> {
  engineId: string;
  engineVersion: string;
  runId: string;
  pluginId: string;
  config: Config;
  logger: PluginLogger;
  storage: PluginStorage;
  eventBus: EventBus;
  metrics: PluginMetrics;
  signals: AbortSignal;
  metadata: Record<string, unknown>;
}

export interface PluginShutdownContext {
  engineId: string;
  pluginId: string;
  logger: PluginLogger;
}

export interface PluginResult<Output = unknown> {
  success: boolean;
  output?: Output;
  error?: EngineError;
  executionTime: number;
  skipped: boolean;
}

export interface PluginLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child(meta: Record<string, unknown>): PluginLogger;
}

export interface PluginStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
}

export interface EngineContext {
  config: EngineConfig;
  logger: PluginLogger;
  storage: PluginStorage;
  metrics: PluginMetrics;
  eventBus: EventBus;
  pluginRegistry: PluginRegistry;
  pluginExecutor: PluginExecutor;
}

export interface PluginRegistry {
  register<Input, Output, Config>(plugin: PluginDefinition<Input, Output, Config>): void;
  unregister(pluginId: string): boolean;
  get<Input, Output, Config>(pluginId: string): PluginDefinition<Input, Output, Config> | undefined;
  getAll(): PluginDefinition[];
  getByPhase(phase: string): PluginDefinition[];
  getEnabled(): PluginDefinition[];
  isRegistered(pluginId: string): boolean;
  enable(pluginId: string): boolean;
  disable(pluginId: string): boolean;
  getDependencyGraph(): Map<string, string[]>;
  validateDependencies(): { valid: boolean; cycles: string[][]; missing: string[] };
  clear(): void;
}

export interface PluginExecutor {
  initialize<Config>(plugin: PluginDefinition, context: PluginInitContext<Config>): Promise<void>;
  execute<Input, Output, Config>(plugin: PluginDefinition<Input, Output, Config>, input: Input, context: PluginExecutionContext<Config>): Promise<PluginResult<Output>>;
  shutdown(plugin: PluginDefinition, context: PluginShutdownContext): Promise<void>;
  abort(pluginId: string): void;
  abortAll(): void;
}

export interface ExecutionOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  onProgress?: (progress: number, message: string) => void;
}

export interface EngineRunContext {
  engineId: string;
  engineVersion: string;
  runId: string;
  input: unknown;
  config: EngineConfig;
  startTime: Date;
  metadata: Record<string, unknown>;
}

export interface EngineResult<Output = unknown> {
  success: boolean;
  output?: Output;
  error?: EngineError;
  executionTime: number;
  pluginResults: Record<string, PluginResult>;
  metadata: Record<string, unknown>;
}

export interface EngineEvents {
  onStateChange?: (state: EngineState) => void;
  onPhaseStart?: (phase: string, context: EngineRunContext) => void;
  onPhaseComplete?: (phase: string, context: EngineRunContext, result: unknown) => void;
  onPluginStart?: (pluginId: string, context: EngineRunContext) => void;
  onPluginComplete?: (pluginId: string, context: EngineRunContext, result: unknown) => void;
  onPluginError?: (pluginId: string, context: EngineRunContext, error: EngineError) => void;
  onError?: (error: EngineError, context: EngineRunContext) => void;
  onComplete?: (context: EngineRunContext, result: EngineResult) => void;
}

export interface EngineHooks {
  beforeRun?: (context: EngineRunContext) => Promise<void>;
  afterRun?: (context: EngineRunContext, result: EngineResult) => Promise<void>;
  beforePhase?: (phase: string, context: EngineRunContext) => Promise<void>;
  afterPhase?: (phase: string, context: EngineRunContext, result: unknown) => Promise<void>;
  beforePlugin?: (pluginId: string, context: EngineRunContext) => Promise<void>;
  afterPlugin?: (pluginId: string, context: EngineRunContext, result: PluginResult) => Promise<void>;
  onError?: (error: EngineError, context: EngineRunContext) => Promise<void>;
  onInit?: (context: EngineRunContext) => Promise<void>;
  onShutdown?: (context: EngineRunContext) => Promise<void>;
}

export type PluginExecutionOrder = 'parallel' | 'sequential' | 'priority';

export interface EngineOptions {
  config?: EngineConfig;
  hooks?: EngineHooks;
  events?: EngineEvents;
  logger?: PluginLogger;
  storage?: PluginStorage;
}

export interface EngineConfig {
  [key: string]: unknown;
}

export interface EngineEvent {
  type: string;
  payload?: unknown;
  timestamp: number;
  source?: string;
  engine?: string;
  error?: EngineError;
}

export type EngineEventHandler = (event: EngineEvent) => void | Promise<void>;

export interface EventBus {
  on(event: string, handler: EngineEventHandler): void;
  off(event: string, handler: EngineEventHandler): void;
  emit(event: EngineEvent): void;
  once(event: string, handler: EngineEventHandler): void;
  clear(): void;
  getHandlerCount(event: string): number;
  hasHandlers(event: string): boolean;
}

export interface EngineHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  engine: string;
  version: string;
  uptime: number;
  plugins: Array<{
    id: string;
    status: 'healthy' | 'unhealthy';
    version: string;
  }>;
  checks: {
    initialized: boolean;
    running: boolean;
    storage: boolean;
  };
}
