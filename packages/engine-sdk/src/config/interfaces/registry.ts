import type { ConfigSchema, ConfigSnapshot, ConfigProvider } from './provider';

export interface ConfigRegistry {
  register<T = unknown>(key: string, schema: ConfigSchema<T>): void;
  get<T = unknown>(key: string): T;
  set<T = unknown>(key: string, value: T): void;
  has(key: string): boolean;
  remove(key: string): boolean;
  clear(): void;
  validate(): ConfigValidationResult;
  snapshot(): ConfigSnapshot;
}

export interface ConfigValidationResult {
  readonly valid: boolean;
  readonly errors: ConfigValidationError[];
}

export interface ConfigValidationError {
  readonly key: string;
  readonly message: string;
  readonly code: string;
}

export interface ConfigLoaderOptions {
  readonly providers?: readonly ConfigProvider[];
  readonly schemas?: Record<string, ConfigSchema>;
  readonly namespace?: string;
}