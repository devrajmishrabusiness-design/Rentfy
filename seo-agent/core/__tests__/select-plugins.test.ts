/**
 * Regression tests for the engine's plugin selection + phase routing.
 *
 * Covers:
 *   - selectPlugins (pipeline.ts): capability↔phase mapping for all
 *     four capabilities, phase overrides, ordering by priority,
 *     enabled-by-default filtering, and config-driven filtering.
 *   - SeoEngine.run (engine.ts): end-to-end execution uses the same
 *     capability→phase routing as selectPlugins, accepts all four
 *     capabilities, and surfaces plugin errors / skips.
 *
 * These tests guard the previous bug where `selectPlugins` compared
 * `p.capability` (e.g. "analyzer") against `phase` (e.g. "analyze")
 * directly, which silently dropped every analyzer plugin.
 *
 * Run with: npx vitest run seo-agent/core/__tests__/select-plugins.test.ts
 */

import { describe, it, expect } from "vitest";
import { definePlugin } from "../plugin";
import {
  runPipeline,
  selectPlugins,
  evaluateCondition,
  toPipelineError,
} from "../pipeline";
import { SeoEngine } from "../engine";
import { buildConfig } from "../context";
import type {
  EngineConfig,
  PluginCapability,
  PluginPhase,
  SeoPlugin,
} from "../../types";

/* ----------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------- */

let configCounter = 0;

/**
 * Build a minimal EngineConfig for selectPlugins. The pipeline only
 * reads `enabledPlugins` and `priorities`, so the rest can be empty.
 *
 * - `enabled` → IDs added to enabledPlugins (everything else dropped).
 * - `prioritiesMap` → priority overrides for the listed IDs.
 * - `candidates` → used to read each candidate's `priority` value,
 *   because `buildConfig` derives priorities from the registered list.
 *
 * This is intentionally low-level: selectPlugins is a building block,
 * not a self-contained API.
 */
const makeConfig = (
  enabled: string[] = [],
  prioritiesMap: Record<string, number> = {},
  candidates: ReadonlyArray<SeoPlugin> = []
): EngineConfig => {
  const registered: Array<{ id: string; priority?: number }> = [];
  const candidateById = new Map(candidates.map((c) => [c.id, c]));
  const allIds = Array.from(
    new Set([
      "a", "b", "c", "cr", "g", "r",
      "p10", "p50", "p100",
      "g-on-report", "a-bootstrap",
      "on", "off", "default-on",
      "g1", "r1", "a1", "cr1",
      "first", "second",
      "s", "f", "next", "ab",
      "only", "only-analzyer", "wrong-phase",
    ])
  );
  for (const id of allIds) {
    const c = candidateById.get(id);
    registered.push({ id, priority: c?.priority ?? 100 });
  }
  const overrides: Record<string, boolean> = {};
  for (const id of allIds) {
    if (!enabled.includes(id)) overrides[id] = false;
  }
  const priorityOverrides: Record<string, number> = { ...prioritiesMap };
  return buildConfig(
    `test-run-${++configCounter}`,
    "0.0.0-test",
    {
      pluginOverrides: overrides,
      ...(Object.keys(priorityOverrides).length > 0
        ? { priorityOverrides }
        : {}),
    },
    registered
  );
};

/**
 * Build a plugin with defaults, taking only what varies.
 */
const plugin = (
  id: string,
  capability: PluginCapability,
  extra: Partial<SeoPlugin> = {}
): SeoPlugin =>
  definePlugin({
    id,
    name: `Plugin ${id}`,
    capability,
    run: () => ({ pluginId: id, kind: "issues", value: null }),
    ...extra,
  });

/* ----------------------------------------------------------------
 * 1. selectPlugins — capability→phase mapping (the regression)
 * ---------------------------------------------------------------- */

describe("selectPlugins — capability→phase mapping", () => {
  it("includes analyzer plugins when phase='analyze' (regression for prior bug)", () => {
    const candidates = [plugin("a", "analyzer")];
    const cfg = makeConfig(["a"], {}, candidates);
    const result = selectPlugins(candidates, "analyzer", "analyze", cfg);
    expect(result.map((p) => p.id)).toEqual(["a"]);
  });

  it("excludes analyzer plugins when phase='generate'", () => {
    const candidates = [plugin("a", "analyzer")];
    const cfg = makeConfig(["a"], {}, candidates);
    const result = selectPlugins(candidates, "analyzer", "generate", cfg);
    expect(result).toEqual([]);
  });

  it("includes generator plugins when phase='generate'", () => {
    const candidates = [plugin("g", "generator")];
    const cfg = makeConfig(["g"], {}, candidates);
    const result = selectPlugins(candidates, "generator", "generate", cfg);
    expect(result.map((p) => p.id)).toEqual(["g"]);
  });

  it("excludes generator plugins when phase='analyze'", () => {
    const candidates = [plugin("g", "generator")];
    const cfg = makeConfig(["g"], {}, candidates);
    const result = selectPlugins(candidates, "generator", "analyze", cfg);
    expect(result).toEqual([]);
  });

  it("includes crawler plugins when phase='crawl'", () => {
    const candidates = [plugin("cr", "crawler")];
    const cfg = makeConfig(["cr"], {}, candidates);
    const result = selectPlugins(candidates, "crawler", "crawl", cfg);
    expect(result.map((p) => p.id)).toEqual(["cr"]);
  });

  it("excludes crawler plugins when phase='analyze'", () => {
    const candidates = [plugin("cr", "crawler")];
    const cfg = makeConfig(["cr"], {}, candidates);
    const result = selectPlugins(candidates, "crawler", "analyze", cfg);
    expect(result).toEqual([]);
  });

  it("includes report plugins when phase='report'", () => {
    const candidates = [plugin("r", "report")];
    const cfg = makeConfig(["r"], {}, candidates);
    const result = selectPlugins(candidates, "report", "report", cfg);
    expect(result.map((p) => p.id)).toEqual(["r"]);
  });

  it("excludes report plugins when phase='generate'", () => {
    const candidates = [plugin("r", "report")];
    const cfg = makeConfig(["r"], {}, candidates);
    const result = selectPlugins(candidates, "report", "generate", cfg);
    expect(result).toEqual([]);
  });

  it("selectPlugins capability mapping matches engine capability→phase mapping for all 4 capabilities", () => {
    // The engine computes phase as capabilityToPhase[capability] where:
    //   analyzer  → "analyze"
    //   generator → "generate"
    //   crawler   → "crawl"
    //   report    → "report"
    // selectPlugins MUST agree on the same mapping.
    const expectations: Array<[PluginCapability, PluginPhase]> = [
      ["analyzer", "analyze"],
      ["generator", "generate"],
      ["crawler", "crawl"],
      ["report", "report"],
    ];
    for (const [cap, phase] of expectations) {
      const candidates = [
        plugin("only", cap),
        plugin("wrong-phase", cap, { phase: "report" as PluginPhase }),
      ];
      const cfg = makeConfig(["only"], {}, candidates);
      const result = selectPlugins(candidates, cap, phase, cfg);
      expect(result.map((p) => p.id)).toEqual(["only"]);
    }
  });
});

/* ----------------------------------------------------------------
 * 2. selectPlugins — capability filter
 * ---------------------------------------------------------------- */

describe("selectPlugins — capability filtering", () => {
  it("only returns plugins matching the requested capability", () => {
    const candidates = [
      plugin("a1", "analyzer"),
      plugin("g1", "generator"),
      plugin("cr1", "crawler"),
      plugin("r1", "report"),
    ];
    const cfg = makeConfig(["a1"], {}, candidates);
    const result = selectPlugins(candidates, "analyzer", "analyze", cfg);
    expect(result.map((p) => p.id)).toEqual(["a1"]);
  });

  it("returns an empty array when no plugins match the capability", () => {
    const candidates = [plugin("g1", "generator"), plugin("r1", "report")];
    const cfg = makeConfig(["g1", "r1"], {}, candidates);
    const result = selectPlugins(candidates, "analyzer", "analyze", cfg);
    expect(result).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const candidates = [
      plugin("a", "analyzer"),
      plugin("b", "analyzer"),
    ];
    const snapshot = candidates.map((p) => p.id);
    const cfg = makeConfig(["a", "b"], {}, candidates);
    selectPlugins(candidates, "analyzer", "analyze", cfg);
    expect(candidates.map((p) => p.id)).toEqual(snapshot);
  });
});

/* ----------------------------------------------------------------
 * 3. selectPlugins — phase overrides
 * ---------------------------------------------------------------- */

describe("selectPlugins — explicit phase overrides", () => {
  it("respects plugins that declare an explicit `phase` matching the request", () => {
    // A generator plugin that legitimately declares `phase: "report"`
    // (e.g., a post-generate report generator) should be selectable
    // when the caller asks for the report phase.
    const candidates = [
      plugin("g-on-report", "generator", { phase: "report" }),
    ];
    const cfg = makeConfig(["g-on-report"], {}, candidates);
    const result = selectPlugins(
      candidates,
      "generator",
      "report",
      cfg
    );
    expect(result.map((p) => p.id)).toEqual(["g-on-report"]);
  });

  it("uses plugin.declared phase instead of capabilityToPhase[capability]", () => {
    // Plugin declares analyzer but with phase: "bootstrap".
    // selectPlugins should accept it when phase="bootstrap"
    // and reject it when phase="analyze".
    const candidates = [
      plugin("a-bootstrap", "analyzer", { phase: "bootstrap" }),
    ];
    const cfg = makeConfig(["a-bootstrap"], {}, candidates);

    const accepted = selectPlugins(
      candidates,
      "analyzer",
      "bootstrap",
      cfg
    );
    expect(accepted.map((p) => p.id)).toEqual(["a-bootstrap"]);

    const rejected = selectPlugins(candidates, "analyzer", "analyze", cfg);
    expect(rejected).toEqual([]);
  });
});

/* ----------------------------------------------------------------
 * 4. selectPlugins — enabledByDefault + config.enabledPlugins
 * ---------------------------------------------------------------- */

describe("selectPlugins — enable filtering", () => {
  it("filters out plugins with enabledByDefault=false", () => {
    const candidates = [
      plugin("on", "analyzer", { enabledByDefault: true }),
      plugin("off", "analyzer", { enabledByDefault: false }),
    ];
    const cfg = makeConfig(["on", "off"], {}, candidates);
    const result = selectPlugins(candidates, "analyzer", "analyze", cfg);
    expect(result.map((p) => p.id)).toEqual(["on"]);
  });

  it("treats undefined enabledByDefault as enabled", () => {
    const candidates = [plugin("default-on", "analyzer")];
    const cfg = makeConfig(["default-on"], {}, candidates);
    const result = selectPlugins(candidates, "analyzer", "analyze", cfg);
    expect(result).toHaveLength(1);
  });

  it("filters out plugins that are not in config.enabledPlugins", () => {
    const candidates = [
      plugin("a", "analyzer"),
      plugin("b", "analyzer"),
    ];
    // Only "a" added to enabled list → "b" gets pluginOverrides=false.
    const cfg = makeConfig(["a"], {}, candidates);
    const result = selectPlugins(candidates, "analyzer", "analyze", cfg);
    expect(result.map((p) => p.id)).toEqual(["a"]);
  });

  it("combines both filters (enabledByDefault AND config.enabledPlugins)", () => {
    const candidates = [
      plugin("a", "analyzer"),
      plugin("b", "analyzer", { enabledByDefault: false }),
      plugin("c", "analyzer"),
    ];
    const cfg = makeConfig(["a", "b", "c"], {}, candidates);
    const result = selectPlugins(candidates, "analyzer", "analyze", cfg);
    expect(result.map((p) => p.id)).toEqual(["a", "c"]);
  });
});

/* ----------------------------------------------------------------
 * 5. selectPlugins — ordering
 * ---------------------------------------------------------------- */

describe("selectPlugins — ordering", () => {
  it("orders plugins ascending by priority (lower runs first)", () => {
    const candidates = [
      plugin("p50", "analyzer", { priority: 50 }),
      plugin("p10", "analyzer", { priority: 10 }),
      plugin("p100", "analyzer", { priority: 100 }),
    ];
    // cands[?].priority flows through to config.priorities via the helper
    const cfg = makeConfig(["p50", "p10", "p100"], {}, candidates);
    const result = selectPlugins(candidates, "analyzer", "analyze", cfg);
    expect(result.map((p) => p.id)).toEqual(["p10", "p50", "p100"]);
  });

  it("uses config.priorities override when present", () => {
    const candidates = [
      plugin("a", "analyzer", { priority: 5 }),
      plugin("b", "analyzer", { priority: 5 }),
    ];
    // Override moves "b" before "a".
    const cfg = makeConfig(["a", "b"], { a: 100, b: 50 }, candidates);
    const result = selectPlugins(candidates, "analyzer", "analyze", cfg);
    expect(result.map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("plugin-priority is the resolved priority when no override is set", () => {
    // Both plugins declared priorities — no overrides → plugin.priority
    // is the value that ends up in config.priorities via buildConfig.
    const candidates = [
      plugin("a", "analyzer", { priority: 1 }),
      plugin("b", "analyzer", { priority: 2 }),
    ];
    const cfg = makeConfig(["a", "b"], {}, candidates);
    const result = selectPlugins(candidates, "analyzer", "analyze", cfg);
    expect(result.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("uses default priority (100) when no priority is declared", () => {
    const candidates = [
      plugin("a", "analyzer", { priority: 1 }),
      plugin("b", "analyzer"),
    ];
    const cfg = makeConfig(["a", "b"], {}, candidates);
    const result = selectPlugins(candidates, "analyzer", "analyze", cfg);
    expect(result.map((p) => p.id)).toEqual(["a", "b"]);
  });
});

/* ----------------------------------------------------------------
 * 6. selectPlugins — defensive cases
 * ---------------------------------------------------------------- */

describe("selectPlugins — defensive cases", () => {
  it("returns an empty array for unknown capability/phase combinations", () => {
    const candidates = [
      plugin("a", "analyzer"),
      plugin("g", "generator"),
    ];
    const cfg = makeConfig(["a", "g"], {}, candidates);
    // "generate" is a valid phase but the capability is "analyzer"
    // so this should be empty.
    const result = selectPlugins(candidates, "analyzer", "generate", cfg);
    expect(result).toEqual([]);
  });

  it("handles an empty candidate list gracefully", () => {
    const cfg = makeConfig([], {}, []);
    const result = selectPlugins([], "analyzer", "analyze", cfg);
    expect(result).toEqual([]);
  });

  it("handles an empty enabledPlugins set (returns nothing)", () => {
    const candidates = [plugin("a", "analyzer"), plugin("b", "analyzer")];
    const emptyConfig: EngineConfig = {
      runId: "empty",
      enabledPlugins: new Set<string>(),
      priorities: new Map([
        ["a", 100],
        ["b", 100],
      ]),
      version: "0.0.0-test",
      options: {},
    };
    const result = selectPlugins(candidates, "analyzer", "analyze", emptyConfig);
    expect(result).toEqual([]);
  });
});

/* ----------------------------------------------------------------
 * 7. evaluateCondition / toPipelineError (no regression in helpers)
 * ---------------------------------------------------------------- */

describe("evaluateCondition", () => {
  it("returns { kind: 'continue' } when plugin has no condition", () => {
    const p = plugin("c", "analyzer");
    const result = evaluateCondition(p, {
      payload: {},
      config: {} as EngineConfig,
      state: {} as any,
      capability: "analyzer",
      phase: "analyze",
    });
    expect(result).toEqual({ kind: "continue" });
  });

  it("delegates to the plugin-supplied condition", () => {
    const p = definePlugin({
      id: "g",
      name: "G",
      capability: "generator",
      run: () => ({ pluginId: "g", kind: "issues", value: null }),
      condition: () => ({ kind: "skip", reason: "nope" }),
    });
    const result = evaluateCondition(p, {
      payload: {},
      config: {} as EngineConfig,
      state: {} as any,
      capability: "generator",
      phase: "generate",
    });
    expect(result.kind).toBe("skip");
    if (result.kind === "skip") {
      expect(result.reason).toBe("nope");
    }
  });
});

describe("toPipelineError", () => {
  it("wraps an Error into a PipelineError with pluginId and phase", () => {
    const p = plugin("p", "analyzer");
    const wrapped = toPipelineError(new Error("boom"), p, "analyze");
    expect(wrapped.message).toBe("boom");
    expect(wrapped.pluginId).toBe("p");
    expect(wrapped.phase).toBe("analyze");
  });

  it("handles non-Error throws with a default message", () => {
    const p = plugin("p", "analyzer");
    const wrapped = toPipelineError("string-error", p, "analyze");
    expect(wrapped.message).toBe("string-error");
    expect(wrapped.pluginId).toBe("p");
  });
});

/* ----------------------------------------------------------------
 * 8. runPipeline — end-to-end execution through selectPlugins path
 * ---------------------------------------------------------------- */

describe("runPipeline integration (no-engine path)", () => {
  it("executes analyzer plugins selected for the 'analyze' phase", async () => {
    const candidates = [plugin("a", "analyzer")];
    const cfg = makeConfig(["a"], {}, candidates);
    const selected = selectPlugins(candidates, "analyzer", "analyze", cfg);
    const result = await runPipeline(selected, {
      capability: "analyzer",
      phase: "analyze",
      payload: null,
      config: cfg,
    });
    expect(result.ok).toBe(true);
    expect(result.executed).toEqual(["a"]);
    expect(result.outputs["a"]).toBeDefined();
  });

  it("skips plugins whose condition returns 'skip'", async () => {
    const skipper = definePlugin({
      id: "s",
      name: "S",
      capability: "analyzer",
      run: () => ({ pluginId: "s", kind: "issues", value: null }),
      condition: () => ({ kind: "skip", reason: "test skip" }),
    });
    const candidates = [skipper];
    const cfg = makeConfig(["s"], {}, candidates);
    const selected = selectPlugins(candidates, "analyzer", "analyze", cfg);
    const result = await runPipeline(selected, {
      capability: "analyzer",
      phase: "analyze",
      payload: null,
      config: cfg,
    });
    expect(result.ok).toBe(true);
    expect(result.executed).toEqual([]);
    expect(result.skipped).toEqual([
      { pluginId: "s", reason: "test skip" },
    ]);
  });

  it("surfaces plugin throws via result.error", async () => {
    const failing = definePlugin({
      id: "f",
      name: "F",
      capability: "analyzer",
      run: () => {
        throw new Error("kaboom");
      },
    });
    const candidates = [failing];
    const cfg = makeConfig(["f"], {}, candidates);
    const selected = selectPlugins(candidates, "analyzer", "analyze", cfg);
    const result = await runPipeline(selected, {
      capability: "analyzer",
      phase: "analyze",
      payload: null,
      config: cfg,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.pluginId).toBe("f");
    expect(result.error?.message).toBe("kaboom");
  });

  it("aborts the rest of the pipeline when a condition returns 'abort'", async () => {
    let secondRan = false;
    const aborter = definePlugin({
      id: "ab",
      name: "AB",
      capability: "analyzer",
      run: () => ({ pluginId: "ab", kind: "issues", value: null }),
      condition: () => ({ kind: "abort", error: new Error("halt") }),
    });
    const next = definePlugin({
      id: "next",
      name: "Next",
      capability: "analyzer",
      run: () => {
        secondRan = true;
        return { pluginId: "next", kind: "issues", value: null };
      },
    });
    const candidates = [aborter, next];
    const cfg = makeConfig(["ab", "next"], {}, candidates);
    const selected = selectPlugins(candidates, "analyzer", "analyze", cfg);
    const result = await runPipeline(selected, {
      capability: "analyzer",
      phase: "analyze",
      payload: null,
      config: cfg,
    });
    expect(result.ok).toBe(false);
    expect(secondRan).toBe(false);
    expect(result.error?.pluginId).toBe("ab");
    expect(result.executed).toEqual([]);
  });
});

/* ----------------------------------------------------------------
 * 9. SeoEngine.run — end-to-end with all four capabilities
 * ---------------------------------------------------------------- */

describe("SeoEngine.run — capability routing", () => {
  it("runs analyzer plugins when capability='analyzer'", async () => {
    const engine = new SeoEngine();
    engine.use(plugin("a", "analyzer"));
    const result = await engine.run({
      capability: "analyzer",
      payload: null,
    });
    expect(result.ok).toBe(true);
    expect(result.executed).toEqual(["a"]);
  });

  it("runs generator plugins when capability='generator'", async () => {
    const engine = new SeoEngine();
    engine.use(plugin("g", "generator"));
    const result = await engine.run({
      capability: "generator",
      payload: null,
    });
    expect(result.ok).toBe(true);
    expect(result.executed).toEqual(["g"]);
  });

  it("runs crawler plugins when capability='crawler'", async () => {
    const engine = new SeoEngine();
    engine.use(plugin("cr", "crawler"));
    const result = await engine.run({
      capability: "crawler",
      payload: null,
    });
    expect(result.ok).toBe(true);
    expect(result.executed).toEqual(["cr"]);
  });

  it("runs report plugins when capability='report'", async () => {
    const engine = new SeoEngine();
    engine.use(plugin("r", "report"));
    const result = await engine.run({
      capability: "report",
      payload: null,
    });
    expect(result.ok).toBe(true);
    expect(result.executed).toEqual(["r"]);
  });

  it("does NOT execute plugins registered for other capabilities", async () => {
    const engine = new SeoEngine();
    engine.use(plugin("a", "analyzer"));
    engine.use(plugin("g", "generator"));
    const result = await engine.run({
      capability: "analyzer",
      payload: null,
    });
    expect(result.executed).toEqual(["a"]);
    expect(result.outputs["g"]).toBeUndefined();
  });

  it("regression: prior bug would have DROPPED the analyzer plugin", async () => {
    // Smoke test: with the old code, selectPlugins(candidates,
    // "analyzer", "analyze", cfg) would return [] because it compared
    // p.capability ("analyzer") === phase ("analyze") — false. After the
    // fix, the plugin is correctly selected.
    const engine = new SeoEngine();
    engine.use(plugin("only-analzyer", "analyzer"));
    const result = await engine.run({
      capability: "analyzer",
      payload: null,
    });
    expect(result.executed).toContain("only-analzyer");
    expect(result.ok).toBe(true);
  });
});

/* ----------------------------------------------------------------
 * 10. SeoEngine.run — plugin overrides & priorities
 * ---------------------------------------------------------------- */

describe("SeoEngine.run — config-driven overrides", () => {
  it("pluginOverrides=false disables a plugin for that run", async () => {
    const engine = new SeoEngine();
    engine.use(plugin("a", "analyzer"));
    const result = await engine.run({
      capability: "analyzer",
      payload: null,
      pluginOverrides: { a: false },
    });
    expect(result.executed).toEqual([]);
  });

  it("priorityOverrides reorders plugins", async () => {
    const engine = new SeoEngine();
    engine.use(plugin("first", "analyzer", { priority: 1 }));
    engine.use(plugin("second", "analyzer", { priority: 2 }));
    // Force second to run first.
    const result = await engine.run({
      capability: "analyzer",
      payload: null,
      priorityOverrides: { first: 5, second: 1 },
    });
    expect(result.executed).toEqual(["second", "first"]);
  });
});

/* ----------------------------------------------------------------
 * 11. SeoEngine.run — events hook
 * ---------------------------------------------------------------- */

describe("SeoEngine.run — events hook", () => {
  it("invokes afterPlugin for each executed plugin", async () => {
    const seen: string[] = [];
    const engine = new SeoEngine({
      events: {
        afterPlugin: ({ plugin, skipped }) => {
          if (!skipped) seen.push(plugin.id);
        },
      },
    });
    engine.use(plugin("a", "analyzer"));
    engine.use(plugin("b", "analyzer", { priority: 5 }));
    await engine.run({ capability: "analyzer", payload: null });
    expect(seen).toContain("a");
    expect(seen).toContain("b");
  });
});
