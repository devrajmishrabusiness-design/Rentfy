/**
 * SEOEngine — the central orchestrator of the plugin system.
 *
 * Responsibilities:
 *   - Owns a plugin registry.
 *   - Resolves capability-to-phase routing.
 *   - Builds a fresh `EngineConfig` per run.
 *   - Delegates execution to `runPipeline`.
 *   - Exposes a tiny `run(...)` surface for callers.
 *
 * Non-responsibilities:
 *   - Knowing anything about Next.js, React, or Supabase.
 *   - Knowing what any specific plugin does.
 *   - Storing global/run-over state (each run gets its own state bag).
 *
 * The engine is intentionally small. Anything richer (events, log
 * levels, metrics) is layered via the `events` hook.
 */

import { buildConfig } from "./context";
import { runPipeline, selectPlugins } from "./pipeline";
import type { SeoRegistry } from "./registry";
import { createRegistry } from "./registry";
import type {
  EngineRunOptions,
  EngineRunResult,
  PluginCapability,
  PluginPhase,
  SeoPlugin,
} from "../types";

const ENGINE_VERSION = "0.1.0-core";

/**
 * Optional engine listeners. Useful for instrumentation / debugging.
 * All hooks are no-ops by default (`{} as EngineEvents`).
 */
export interface EngineEvents {
  /** Called once per plugin run, after the pipeline forwards the result. */
  afterPlugin?: (info: {
    runId: string;
    plugin: SeoPlugin;
    phase: PluginPhase;
    skipped: boolean;
    error?: Error;
  }) => void;
}

/**
 * Capability-to-phase mapping. A plugin's `capability` doubles as the
 * default `phase` unless overridden.
 */
const capabilityToPhase: Record<PluginCapability, PluginPhase> = {
  analyzer: "analyze",
  generator: "generate",
  crawler: "crawl",
  report: "report",
};

let runCounter = 0;

/**
 * The SEO engine. Construct with an optional config object.
 *
 *   const engine = new SeoEngine({ registry: myRegistry });
 *
 * If no registry is provided, an empty in-memory one is created — so
 * tests can spin up an engine without setup.
 */
export class SeoEngine {
  private readonly registry: SeoRegistry;
  private readonly version: string;
  private readonly events: EngineEvents;

  constructor(options?: {
    registry?: SeoRegistry;
    version?: string;
    events?: EngineEvents;
  }) {
    this.registry = options?.registry ?? createRegistry();
    this.version = options?.version ?? ENGINE_VERSION;
    this.events = options?.events ?? {};
  }

  /** Hand plugins in. Convenience wrapper around the registry. */
  use<TInput, TOutput>(
    ...plugins: ReadonlyArray<SeoPlugin<TInput, TOutput>>
  ): this {
    for (const plugin of plugins) {
      this.registry.register(plugin as unknown as SeoPlugin);
    }
    return this;
  }

  /** Remove a plugin by id. */
  remove(id: string): boolean {
    return this.registry.unregister(id);
  }

  /** Enable a registered plugin. */
  enable(id: string): boolean {
    return this.registry.enable(id);
  }

  /** Disable a registered plugin (kept in the registry, not run). */
  disable(id: string): boolean {
    return this.registry.disable(id);
  }

  /** Inspect the underlying registry (read-only view). */
  inspect(): ReadonlyArray<SeoPlugin> {
    return this.registry.list();
  }

  /**
   * Run a single capability. Selects matching plugins, resolves their
   * priorities, builds a fresh `EngineConfig`, and delegates to the
   * pipeline.
   *
   * @returns an `EngineRunResult` containing the executed plugin ids,
   *          their outputs, and any error.
   */
  async run<TPayload = unknown, TOutput = unknown>(
    options: EngineRunOptions<TPayload>
  ): Promise<EngineRunResult<TOutput>> {
    const runId = `${ENGINE_VERSION}-${Date.now()}-${++runCounter}`;
    const phase = capabilityToPhase[options.capability];

    const registered = this.registry.list().map((plugin) => ({
      id: plugin.id,
      priority: plugin.priority,
    }));

    const config = buildConfig(
      runId,
      this.version,
      options,
      registered
    );

    const selected = selectPlugins(
      this.registry.list(),
      options.capability,
      phase,
      config
    );

    const result = await runPipeline<TPayload, TOutput>(selected, {
      capability: options.capability,
      phase,
      payload: options.payload,
      config,
      onAfterRun: (plugin, _output, skipped, error) => {
        if (typeof this.events.afterPlugin === "function") {
          this.events.afterPlugin({
            runId,
            plugin,
            phase,
            skipped,
            error,
          });
        }
      },
    });

    return result;
  }
}
