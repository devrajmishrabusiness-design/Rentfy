/**
 * Plugin helpers — normalize factories to plain `SeoPlugin` and provide
 * a small DSL for defining plugins without boilerplate.
 *
 * This module deals only with plugin *shape*. The engine consumes the
 * output of `normalizePlugin` directly.
 */

import type {
  PluginHook,
  PluginModule,
  PluginOutput,
  PluginPhase,
  SeoPlugin,
} from "../types";

/**
 * Runtime check: is this value already a usable plugin?
 */
export const isPlugin = <TInput, TOutput>(
  value: unknown
): value is SeoPlugin<TInput, TOutput> => {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<SeoPlugin>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.capability === "string" &&
    typeof v.run === "function"
  );
};

/**
 * Normalize a `PluginModule` (raw plugin or factory) into a plain
 * `SeoPlugin`. Useful for consumers that want to accept either shape.
 */
export const normalizePlugin = <TInput, TOutput>(
  mod: PluginModule<TInput, TOutput>,
  options?: unknown
): SeoPlugin<TInput, TOutput> => {
  if (isPlugin<TInput, TOutput>(mod)) return mod;
  if (
    typeof mod === "object" &&
    mod !== null &&
    "create" in mod &&
    typeof mod.create === "function"
  ) {
    const instance = mod.create(options);
    if (!isPlugin<TInput, TOutput>(instance)) {
      throw new Error(
        "normalizePlugin: factory did not return a valid SeoPlugin"
      );
    }
    return instance;
  }
  throw new Error("normalizePlugin: value is not a PluginModule");
};

/**
 * Lightweight DSL for plugin authors. Encapsulates the parts of the
 * `SeoPlugin` interface that have sensible defaults.
 *
 * @example
 *   export const metaDescriptionPlugin = definePlugin({
 *     id: "meta-description",
 *     name: "Meta description length",
 *     capability: "analyzer",
 *     run: ({ payload }) => ({
 *       pluginId: "meta-description",
 *       kind: "issues",
 *       value: { checkId: "meta-description", summary: "...", issues: [], passed: true },
 *     }),
 *   });
 */
export interface PluginDefinition<TInput, TOutput>
  extends Omit<SeoPlugin<TInput, TOutput>, "version" | "phase"> {
  version?: string;
  phase?: PluginPhase;
}

const defaultVersion = "0.0.0";

export const definePlugin = <TInput = unknown, TOutput = unknown>(
  def: PluginDefinition<TInput, TOutput>
): SeoPlugin<TInput, TOutput> => {
  if (!def.id) throw new Error("definePlugin: id is required");
  if (!def.name) throw new Error("definePlugin: name is required");
  if (!def.capability) throw new Error("definePlugin: capability is required");
  if (typeof def.run !== "function") {
    throw new Error("definePlugin: run is required");
  }
  return {
    id: def.id,
    name: def.name,
    version: def.version ?? defaultVersion,
    capability: def.capability,
    phase: def.phase,
    priority: def.priority,
    enabledByDefault: def.enabledByDefault,
    condition: def.condition,
    run: def.run,
    teardown: def.teardown,
  };
};

/**
 * Helper used by analyzers / generators to short-circuit a plugin run.
 * Keeps plugin code free of repeating the discriminated object.
 */
export const skip = (reason?: string): PluginHook => ({
  kind: "skip",
  reason,
});

/**
 * Helper used by analyzers / generators for the success path of a hook.
 */
export const proceed = (): PluginHook => ({ kind: "continue" });

/**
 * Helper used to abort the entire run from a plugin.
 */
export const abort = (message: string, phase: PluginPhase): PluginHook => ({
  kind: "abort",
  error: Object.assign(new Error(message), { phase }),
});

/**
 * Tiny helper to make analyzer outputs less verbose.
 */
export const analyzerOutput = <TInput, TOutput>(
  plugin: SeoPlugin<TInput, TOutput>,
  value: TOutput
): PluginOutput<TOutput> => ({
  pluginId: plugin.id,
  kind: "issues",
  value,
});

/**
 * Tiny helper to make generator / report outputs less verbose.
 */
export const artifactOutput = <TInput, TOutput>(
  plugin: SeoPlugin<TInput, TOutput>,
  value: TOutput
): PluginOutput<TOutput> => ({
  pluginId: plugin.id,
  kind: "artifact",
  value,
});

/**
 * Tiny helper to make crawler outputs less verbose.
 */
export const dataOutput = <TInput, TOutput>(
  plugin: SeoPlugin<TInput, TOutput>,
  value: TOutput
): PluginOutput<TOutput> => ({
  pluginId: plugin.id,
  kind: "data",
  value,
});
