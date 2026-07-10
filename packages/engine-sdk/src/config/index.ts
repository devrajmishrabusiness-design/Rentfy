export {
  type ConfigSchema,
  type ConfigNamespace,
  type ConfigEntry,
  type ConfigSnapshot,
  type ConfigProvider,
} from './interfaces/provider';

export {
  type ConfigRegistry,
  type ConfigValidationResult,
  type ConfigValidationError,
  type ConfigLoaderOptions,
} from './interfaces/registry';

export { SharedConfig, type SharedConfigOptions } from './registry/shared-config';
export { ConfigValidator } from './validation/validator';
export { MemoryConfigProvider } from './providers/memory';
export { EnvConfigProvider } from './providers/env';