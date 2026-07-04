/**
 * Pipeline executor — runs plugins in a predictable, priority-ordered
 * pass for a given phase.
 *
 * Does not own a registry, an engine, or a config; it receives all
 * dependencies through arguments. Anything outside its single job is
 * the engine's responsibility.
 *
 * The pass is sequential by design. Plugins may be async — we always
 * `await` each one. Plugins are responsible for their own parallelism
 * if they need it.
 */

import type {
  EngineConfig,
  EngineRunResult,
  PluginCapability,
  PluginHook,
  PluginInput,
  PluginOutput,
  PluginPhase,
  PipelineError,
  SeoPlugin,
} from "../types";
import { createPluginState } from "./context";

const lowerPriorityFirst = (
  priorities: ReadonlyMap<string, number>
): (a: SeoPlugin, b: SeoPlugin) => number => {
  return (a, b) => {
    const pa = priorities.get(a.id) ?? a.priority ?? 100;
    const pb = priorities.get(b.id) ?? b.priority ?? 100;
    if (pa !== pb) return pa - pb;
    return 0;
  };
};

/**
 * Choose the plugins that should run for a given phase.
 *
 * Selection rules:
 *   1. Must match the requested capability.
 *   2. Must have an effective phase equal to `phase`.
 *   3. Must be enabled in the engine config.
 *
 * Returned plugins are ordered ascending by priority (lower runs first).
 * Ties fall back to insertion order in the registry, which the engine
 * preserves by registering plugins sequentially.
 */
export const selectPlugins = (
  candidate: ReadonlyArray<SeoPlugin>,
  capability: PluginCapability,
  phase: PluginPhase,
  config: EngineConfig
): SeoPlugin[] => {
  return candidate
    .filter((p) => p.capability === capability)
    .filter((p) => (p.phase ?? (p.capability as PluginPhase)) === phase)
    .filter((p) => (p.enabledByDefault ?? true))
    .filter((p) => config.enabledPlugins.has(p.id))
    .slice()
    .sort(lowerPriorityFirst(config.priorities));
};

/**
 * Evaluate a plugin's optional condition hook. Plugins may signal skip
 * or abort through it.
 */
export const evaluateCondition = (
  plugin: SeoPlugin,
  input: PluginInput
): PluginHook => {
  if (!plugin.condition) return { kind: "continue" };
  return plugin.condition(input);
};

/**
 * Wrap a thrown plugin error into a structured `PipelineError`.
 */
export const toPipelineError = (
  err: unknown,
  plugin: SeoPlugin,
  phase: PluginPhase
): PipelineError => {
  if (err instanceof Error) {
    const cause = err as Error & {
      pluginId?: string;
      phase?: PluginPhase;
    };
    cause.pluginId = plugin.id;
    cause.phase = phase;
    return cause as PipelineError;
  }
  const message =
    typeof err === "string"
      ? err
      : "Plugin failed with non-error value";
  const e = new Error(message) as PipelineError;
  e.pluginId = plugin.id;
  e.phase = phase;
  return e;
};

/**
 * Execute all selected plugins for a given phase. Captures outputs and
 * records skips/aborts. The pipeline itself never throws — failures are
 * surfaced through `EngineRunResult.error`.
 *
 * @param plugins      pre-selected, priority-sorted plugins for this phase
 * @param capability   capability requested by the caller
 * @param phase        phase to execute (always == capability by default)
 * @param payload      engine-supplied payload (passed as `input.payload`)
 * @param config       immutable engine config
 * @param options      optional extension hooks (e.g. for instrumentation)
 */
export interface PipelineExecutorOptions<TPayload, TOutput> {
  capability: PluginCapability;
  phase: PluginPhase;
  payload: TPayload;
  config: EngineConfig;
  /**
   * Optional hook called after each plugin completes. Used by the
   * engine for emitting events, logging, etc.
   */
  onAfterRun?: (
    plugin: SeoPlugin,
    output: PluginOutput<TOutput> | null,
    skipped: boolean,
    error?: PipelineError
  ) => void;
}

export const runPipeline = async <TPayload, TOutput>(
  plugins: ReadonlyArray<SeoPlugin>,
  options: PipelineExecutorOptions<TPayload, TOutput>
): Promise<EngineRunResult<TOutput>> => {
  const state = createPluginState();
  const executed: string[] = [];
  const skipped: EngineRunResult["skipped"] = [];
  const outputs: Record<string, PluginOutput<TOutput>> = {};
  let error: PipelineError | undefined;

  for (const plugin of plugins) {
    const input: PluginInput<TPayload> = {
      phase: options.phase,
      capability: options.capability,
      payload: options.payload,
      config: options.config,
      state,
    };

    // 1. Condition gate
    const hook = evaluateCondition(plugin, input);
    if (hook.kind === "skip" || hook.kind === "abort") {
      if (hook.kind === "skip") {
        skipped.push({
          pluginId: plugin.id,
          reason: hook.reason ?? "skipped by condition",
        });
        options.onAfterRun?.(plugin, null, true);
        continue;
      }
      error = Object.assign(hook.error, {
        pluginId: plugin.id,
        phase: options.phase,
      });
      break;
    }

    // 2. Run plugin
    try {
      const result = await plugin.run(input as PluginInput);
      const typed = result as PluginOutput<TOutput>;
      outputs[plugin.id] = typed;
      executed.push(plugin.id);
      options.onAfterRun?.(plugin, typed, false);

      // 3. Optional teardown
      if (plugin.teardown) {
        await plugin.teardown(input as PluginInput, typed);
      }
    } catch (caught) {
      const fail = toPipelineError(caught, plugin, options.phase);
      error = fail;
      options.onAfterRun?.(plugin, null, false, fail);
      break;
    }
  }

  return {
    ok: !error,
    runId: options.config.runId,
    executed,
    skipped,
    outputs,
    error,
  };
};
