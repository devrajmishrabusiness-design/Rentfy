# Core — Plugin Architecture

The `core/` module is the plugin system on top of which analyzers,
generators, crawlers, and reports are built. It is **framework-agnostic**
(no Next.js, React, Supabase, or DOM types).

---

## Files

```
core/
├── index.ts        # Public re-exports
├── engine.ts       # SeoEngine — orchestrator
├── registry.ts     # SeoRegistry — plugin registry
├── pipeline.ts     # Priority-aware pipeline executor
├── plugin.ts       # Plugin normalization + DSL helpers
└── context.ts      # EngineConfig / PluginState factories
```

---

## Pipeline Phases

The engine runs plugins in a fixed lifecycle:

```
bootstrap → crawl → analyze → generate → report
```

Each plugin declares its **capability** (`"analyzer" | "generator" | "crawler" | "report"`)
which is automatically mapped to a phase. Plugins may override `phase`
explicitly but rarely need to.

| Capability | Default Phase |
| ---------- | ------------- |
| analyzer   | analyze       |
| generator  | generate      |
| crawler    | crawl         |
| report     | report        |

---

## The Universal Plugin Shape

Every plugin implements the same interface — only the generic types
change per capability:

```ts
import type { SeoPlugin } from "@/seo-agent";

interface SeoPlugin<TInput = unknown, TOutput = unknown> {
  readonly id: string;            // unique, kebab-case
  readonly name: string;
  readonly version: string;
  readonly capability: PluginCapability;
  readonly phase?: PluginPhase;   // defaults to capability-as-phase
  readonly priority?: number;     // lower runs first, default 100
  readonly enabledByDefault?: boolean; // default true
  readonly condition?: (input) => PluginHook;
  readonly run: (input) => PluginOutput | Promise<PluginOutput>;
  readonly teardown?: (input, output) => void | Promise<void>;
}
```

This is what makes the system extensible: the engine never branches
on capability; it lifts everything to type-level via generics. New
plugin types slot in without engine changes.

---

## Defining a Plugin

Use `definePlugin` for the cleanest declaration:

```ts
import { definePlugin, analyzerOutput, skip, type SeoPlugin } from "@/seo-agent";

export const metaDescriptionPlugin = definePlugin({
  id: "meta-description-length",
  name: "Meta description length",
  capability: "analyzer",
  priority: 50,                            // runs before less-important checks
  run: ({ payload }) => {
    if (!payload.metaDescription) {
      return analyzerOutput(
        { id: "meta-description-length", name: "Meta description length", capability: "analyzer" } as SeoPlugin,
        {
          checkId: "meta-description-length",
          summary: "Missing meta description",
          issues: [{
            id: "meta-description-missing",
            title: "Meta description missing",
            description: "Pages without a meta description rank worse in SERPs.",
            severity: "critical",
            category: "meta",
            recommendation: "Add a 120–160 character meta description.",
          }],
          passed: false,
        },
      );
    }
    return analyzerOutput(
      { id: "meta-description-length", name: "Meta description length", capability: "analyzer" } as SeoPlugin,
      {
        checkId: "meta-description-length",
        summary: "Meta description present",
        issues: [],
        passed: true,
      },
    );
  },
});
```

> Implementations of analyzers/crawlers/etc. have been shipped
> (7 analyzers + report). The illustrative example above shows the
> `definePlugin` adapter pattern in general usage.

---

## Lifecycle Hooks

A plugin may implement three optional hooks:

| Hook        | When it runs                          | Use it for                          |
| ----------- | ------------------------------------- | ----------------------------------- |
| `condition` | Before `run`                          | short-circuit (skip/abort a phase)  |
| `run`       | Main execution                        | produce plugin output               |
| `teardown`  | After `run`, even on error            | release resources, log, flush state |

`condition` returns `PluginHook`:

- `{ kind: "continue" }`  — proceed normally (default)
- `{ kind: "skip" }`      — bypass this plugin for this run
- `{ kind: "abort" }`     — fail the whole engine run

---

## Priorities & Ordering

Lower `priority` numbers run first. Ties fall back to registration
order. Override priority at registration:

```ts
engine.use(plugin);
// or override per-run:
engine.run({ ..., priorityOverrides: { "analyzer.meta-description-length": 10 } });
```

---

## Enabling / Disabling Plugins

Plugs can be toggled in two ways:

```ts
// Pre-flight (mutates the registry default):
engine.disable("analyzer.meta-description-length");
engine.enable("analyzer.meta-description-length");

// Per-run, non-destructive (highest priority):
engine.run({
  capability: "analyzer",
  payload,
  pluginOverrides: { "analyzer.meta-description-length": false },
});
```

---

## Pipeline Guarantees

1. **Sequential execution** — plugins run one at a time, always awaited.
2. **Strict error handling** — a thrown error or `abort` halts the run;
   no later plugins in the same phase run, but earlier outputs and
   `skipped` records are preserved on the result.
3. **Predicate gating** — `condition(...)` is the only sanctioned way
   to decide whether a plugin runs for a given input.
4. **Priority ordering** — engines mutate priority via the registry,
   pipeline resolves the final sort order before each run.
5. **Deterministic output ordering** — `EngineRunResult.executed[]`
   reflects execution order and may be replayed.

---

## Engines Are Cheap

`SeoEngine` instances do not own state. Each call to `run(...)` builds
a fresh `PluginState` bag, frozen config, and runId. This means:

- Tests can create new engines freely.
- Runs cannot leak data into each other.
- Plugins can trust `input.state` to be a clean slate.

---

## Composition Rules (SOLID)

| Principle         | How the core enforces it                                     |
| ----------------- | ------------------------------------------------------------ |
| S — Single Resp.  | Each file owns one concern (engine vs registry vs pipeline). |
| O — Open/Closed   | New plugin capabilities = zero engine changes.               |
| L — Liskov        | `SeoRegistry` and future "registry-like" share an interface. |
| I — Segregation   | `definePlugin` lets callers skip fields they don't need.    |
| D — Depend. Inv.  | Engine depends on `SeoRegistryLike`, not on a concrete impl. |
