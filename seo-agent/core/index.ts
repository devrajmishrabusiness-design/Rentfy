/**
 * Core module — public API of the plugin system.
 *
 * Re-exports the engine, registry, plugin helpers, and pipeline
 * primitives so consumers only need to import from this single file.
 *
 * Re-exports also kick in types so consumers can `import type` without
 * reaching into internal modules.
 */

// Engine
export { SeoEngine } from "./engine";
export type { EngineEvents } from "./engine";

// Registry
export { SeoRegistry, createRegistry } from "./registry";
export type { SeoRegistryLike } from "./registry";

// Pipeline (used directly by tests & custom orchestrators)
export {
  selectPlugins,
  evaluateCondition,
  runPipeline,
  toPipelineError,
} from "./pipeline";
export type { PipelineExecutorOptions } from "./pipeline";

// Plugin helpers (define, normalize, output helpers)
export {
  isPlugin,
  normalizePlugin,
  definePlugin,
  skip,
  proceed,
  abort,
  analyzerOutput,
  artifactOutput,
  dataOutput,
  declareCapability,
} from "./plugin";

// Context helpers
export { buildConfig, createPluginState } from "./context";
