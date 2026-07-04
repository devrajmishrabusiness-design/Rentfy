# SEO Agent

A modular, framework-agnostic SEO toolkit designed to live inside this
Next.js + Supabase project (RenterEasy) without taking on any of its
framework dependencies.

Current state: **foundation + plugin core + first analyzer plugin.**
The foundation provides contracts (types) and pure helpers (utils). The
plugin core provides a registry-engine-pipeline architecture. The
`analyzer/` module now contains the first production plugin: a Title
Analyzer. Crawler, generator, and reports modules are still planned.

---

## Goals

- **Clean architecture / SOLID** -- every module is a small, single-purpose unit
  with a clear interface.
- **Plugin-first** -- analyzers, generators, crawlers, and reports are all
  plugins. The engine never branches on capability.
- **Independent modules** -- no module imports from siblings inside
  another submodule; cross-module communication goes through `types/*`.
- **Framework-agnostic** -- no Next.js, React, Supabase, Node-only APIs,
  or bold. Everything works in any TypeScript environment.
- **Tree-shakable** -- pure named exports, no side effects.
- **No new dependencies** unless absolutely required.

---

## Folder Layout

```
seo-agent/
|   index.ts                  # Public API entry point
|   types/
|   |   index.ts              # All shared types + Result<T,E> + plugin contracts
|   utils/
|   |   text.ts               # Strip HTML, normalize, slugify, word count, density, readability
|   |   url.ts                # URL parsing/building helpers
|   |   scoring.ts            # Score aggregation and ranking
|   core/
|   |   index.ts              # Public re-exports for plugin system
|   |   engine.ts             # SeoEngine -- orchestrator
|   |   registry.ts           # SeoRegistry -- plugin registry
|   |   pipeline.ts           # Priority-aware pipeline executor
|   |   plugin.ts             # definePlugin, normalizePlugin, output helpers
|   |   context.ts            # EngineConfig + PluginState factories
|   |   README.md             # Plugin architecture deep-dive
|   analyzer/
|   |   index.ts              # Public re-exports
|   |   title-analyzer.ts     # Pure rules for title validation
|   |   title-plugin.ts       # SeoPlugin adapter
|   |   __tests__/
|   |       title-analyzer.test.ts  # Unit tests (test-framework agnostic)
|   README.md
```

`crawler/`, `generator/`, and `reports/` directories are intentionally
**not present yet.** They will be added in subsequent tasks.

---

## Module Responsibilities

### `types/`

Single source of truth for every shared shape, including plugin
contracts.

### `utils/text.ts`

Pure string operations: `stripHtml`, `normalize`, `slugify`, `truncate`,
`countWords`, `keywordDensity`, `fleschReadingEase`, `findOccurrences`.

### `utils/url.ts`

Pure URL operations: `isAbsoluteUrl`, `isInternalLink`, `normalizeUrl`,
`resolveUrl`, `hostnameOf`, `pathnameOf`.

### `utils/scoring.ts`

Score math: `scoreCheck`, `aggregateScores`, `topIssues`.

### `core/engine.ts` -- `SeoEngine`

Orchestrates registration, config building, and pipeline execution.
Public methods: `use(...plugins)`, `remove(id)`, `enable(id)`,
`disable(id)`, `inspect()`, `run(options)`.

### `core/registry.ts` -- `SeoRegistry`

In-memory plugin registration with enable/disable, priority override,
and lookup by capability or phase. Tests can consume it directly.

### `core/pipeline.ts`

Priority-ordered, predicate-gated, sequential plugin pass. Catches
themed errors and surfaces them as structured `PipelineError`s.

### `core/plugin.ts`

`definePlugin` DSL, `normalizePlugin`, `isPlugin` guard, output helpers,
and lifecycle helpers (`skip`, `proceed`, `abort`).

### `core/context.ts`

Builds the immutable `EngineConfig` and the mutable `PluginState` bag
per `engine.run(...)`.

### `analyzer/title-analyzer.ts`

Pure, testable rules for title validation. No plugin-system coupling.
Checks: missing/empty, length (ideal 50-60 chars), brand suffix,
keyword presence. Returns `TitleAnalysis` with full issue list.

### `analyzer/title-plugin.ts`

Adapter from `PageSignals` to `SeoCheckResult` using the rules above.
Exposes `createTitlePlugin(opts)` factory returning a `SeoPlugin`.

---

## Usage

```ts
import {
  SEO_AGENT_VERSION,
  SeoEngine,
  SeoRegistry,
  definePlugin,
  analyzerOutput,
  normalize, slugify, countWords,
  scoreCheck, keywordDensity,
  isAbsoluteUrl,
  ok, err,
  // analyzer
  analyzeTitle,
  createTitlePlugin,
} from "@/seo-agent";

const engine = new SeoEngine();
engine.use(createTitlePlugin({
  brandSuffix: " | RenterEasy",
  enforceBrand: true,
  targetKeywords: ["rent", "Noida"],
}));

const result = await engine.run({
  capability: "analyzer",
  payload: { title: "Rent apartments in Noida | RenterEasy" },
});

if (result.ok) console.log(result.outputs);
```

Future crawler/generator/reports modules will be re-exported from
`seo-agent/index.ts` as they land.

---

## Versioning

`SEO_AGENT_VERSION` exposes the current contract version
(`0.4.0-analyzer-title`). Bump on breaking changes.
