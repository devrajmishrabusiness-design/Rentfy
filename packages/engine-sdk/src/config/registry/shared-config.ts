import type { ConfigRegistry as IConfigRegistry, ConfigValidationResult, ConfigLoaderOptions } from '../interfaces/registry';
import type { ConfigSchema, ConfigSnapshot, ConfigProvider } from '../interfaces/provider';
import { ConfigValidator } from '../validation/validator';
import { MemoryConfigProvider } from '../providers/memory';
import { EngineErrorCode, EngineError } from '../../errors';

export interface SharedConfigOptions extends ConfigLoaderOptions {
  readonly validator?: ConfigValidator;
}

export class SharedConfig implements IConfigRegistry {
  private readonly schemas: Map<string, ConfigSchema> = new Map();
  private readonly values: Map<string, unknown> = new Map();
  private readonly provider: MemoryConfigProvider;
  private readonly providers: readonly ConfigProvider[];
  private readonly validator: ConfigValidator;
  private readonly namespace: string;

  constructor(options: SharedConfigOptions = {}) {
    this.namespace = options.namespace ?? 'default';
    this.validator = options.validator ?? new ConfigValidator();
    this.provider = new MemoryConfigProvider();

    this.providers = options.providers ?? [];

    if (options.schemas) {
      for (const [key, schema] of Object.entries(options.schemas)) {
        this.registerSchema(key, schema);
      }
    }
  }

  register<T = unknown>(key: string, schema: ConfigSchema<T>): void {
    const existing = this.schemas.get(key);
    if (existing) {
      throw new EngineError(EngineErrorCode.PLUGIN_ALREADY_REGISTERED, `Configuration key ${key} is already registered`);
    }
    this.registerSchema(key, schema);
    if (schema.defaultValue !== undefined) {
      this.set(key, schema.defaultValue);
    }
  }

  get<T = unknown>(key: string): T {
    if (!this.schemas.has(key)) {
      throw new EngineError(EngineErrorCode.PLUGIN_NOT_FOUND, `Configuration key ${key} is not registered`);
    }
    if (this.values.has(key)) {
      return this.values.get(key) as T;
    }
    throw new EngineError(EngineErrorCode.CONFIG_VALIDATION_FAILED, `No value set for configuration key ${key}`);
  }

  set<T = unknown>(key: string, value: T): void {
    if (!this.schemas.has(key)) {
      throw new EngineError(EngineErrorCode.PLUGIN_NOT_FOUND, `Configuration key ${key} is not registered`);
    }
    this.values.set(key, value);
  }

  has(key: string): boolean {
    return this.values.has(key);
  }

  remove(key: string): boolean {
    return this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
    this.schemas.clear();
  }

  validate(): ConfigValidationResult {
    const schemaObj: Record<string, ConfigSchema> = {};
    for (const [key, schema] of this.schemas) {
      schemaObj[key] = schema;
    }
    const valueObj: Record<string, unknown> = {};
    for (const [key, value] of this.values) {
      valueObj[key] = value;
    }
    return this.validator.validate(schemaObj, valueObj);
  }

  snapshot(): ConfigSnapshot {
    const result: ConfigSnapshot = {};
    result[this.namespace] = {};
    for (const [key, value] of this.values) {
      (result[this.namespace] as Record<string, unknown>)[key] = value;
    }
    return result;
  }

  async load(): Promise<void> {
    for (const provider of this.providers) {
      const data = await provider.load(this.namespace);
      for (const [key, value] of Object.entries(data)) {
        this.setIfRegistered(key, value);
      }
    }
  }

  protected registerSchema<T = unknown>(key: string, schema: ConfigSchema<T>): void {
    this.schemas.set(key, schema as ConfigSchema);
  }

  private setIfRegistered(key: string, value: unknown): void {
    if (this.schemas.has(key)) {
      this.values.set(key, value);
    }
  }

  protected get schemasSnapshot(): Map<string, ConfigSchema> {
    return this.schemas;
  }
}