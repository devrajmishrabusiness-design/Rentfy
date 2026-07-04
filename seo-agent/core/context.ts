/**
 * Engine execution context — pure helpers to construct the immutable
 * `EngineConfig` and the mutable `PluginState` bag that flow through
 * every plugin invocation.
 *
 * No framework dependencies. No side-effects beyond building plain
 * JavaScript objects.
 */

import type {
  EngineConfig,
  EngineRunOptions,
  PluginState,
} from "../types";

const DEFAULT_PRIORITY = 100;

/**
 * Build the immutable config passed to plugins. Computed once per
 * `engine.run(...)` and re-read by the pipeline.
 *
 * The returned object is frozen — plugins are not allowed to mutate it.
 */
export const buildConfig = (
  runId: string,
  version: string,
  options: EngineRunOptions,
  registered: ReadonlyArray<{ id: string; priority?: number }>
): EngineConfig => {
  const enabled = new Set<string>();
  const priorities = new Map<string, number>();

  for (const plugin of registered) {
    const overrideEnabled = options.pluginOverrides?.[plugin.id];
    const enabledFlag = overrideEnabled !== undefined
      ? overrideEnabled
      : true;
    if (enabledFlag) enabled.add(plugin.id);

    const overridePri = options.priorityOverrides?.[plugin.id];
    priorities.set(
      plugin.id,
      overridePri ?? plugin.priority ?? DEFAULT_PRIORITY
    );
  }

  return Object.freeze({
    runId,
    scope: options.scope,
    enabledPlugins: enabled,
    priorities,
    version,
    options: Object.freeze({ ...(options.options ?? {}) }),
  });
};

/**
 * Build a fresh, mutable-but-namespaced plugin state bag.
 *
 * The store keeps keys exactly as written. Plugins SHOULD namespace
 * their keys (e.g. `"analyzer.meta-description.length"`) to avoid
 * collisions across plugins.
 */
export const createPluginState = (): PluginState => {
  const store = new Map<string, unknown>();
  return {
    set(key, value) {
      store.set(key, value);
    },
    get<T = unknown>(key: string): T | undefined {
      return store.get(key) as T | undefined;
    },
    has(key) {
      return store.has(key);
    },
    entries() {
      return store.entries();
    },
  };
};
