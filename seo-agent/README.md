# SEO Agent

A modular, framework-agnostic SEO toolkit designed to live inside this
Next.js + Supabase project (Rentfy) without taking on any of its
framework dependencies.

Current state: **foundation + plugin core + 7 analyzer plugins +
report generator.** The foundation provides contracts (`types`) and
pure helpers (`utils`). The plugin core provides a
registry-engine-pipeline architecture. The `analyzer/` module ships
seven production analyzers (title, meta-description, url, heading,
image, schema, keyword). The `report/` module ships a Report
Generator plugin. Crawler and generator modules are still planned.

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
|   |   index.ts              # All shared types + Result<T,E> + plugin contracts + ImageMetadata
|   utils/
|   |   text.ts               # Strip HTML, normalize, slugify, word count, density, readability
|   |   url.ts                # URL parsing/building helpers
|   |   scoring.ts            # Score aggregation and ranking (cross-check)
|   |   analyzer-helpers.ts   # Shared analyzer helpers: dedupeSeverity, calculateScore, simpleHash, mergeAnalyzerOptions
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
|   |   title-analyzer.ts         # Pure rules for <title> validation
|   |   title-plugin.ts           # SeoPlugin adapter (priority 10)
|   |   meta-description-analyzer.ts   # Meta description rules
|   |   meta-description-plugin.ts     # SeoPlugin adapter (priority 11)
|   |   url-analyzer.ts           # URL slug rules
|   |   url-plugin.ts             # SeoPlugin adapter (priority 12)
|   |   heading-analyzer.ts       # Heading hierarchy rules
|   |   heading-plugin.ts         # SeoPlugin adapter (priority 13)
|   |   image-analyzer.ts         # Image alt/format/dimension rules
|   |   image-plugin.ts           # SeoPlugin adapter (priority 14)
|   |   schema-analyzer.ts        # JSON-LD structured-data rules
|   |   schema-plugin.ts          # SeoPlugin adapter (priority 15)
|   |   keyword-analyzer.ts       # Density / placement rules
|   |   keyword-plugin.ts         # SeoPlugin adapter (priority 16)
|   |   __tests__/                # One *.test.ts per analyzer (test-framework agnostic)
|   report/
|   |   index.ts              # Public re-exports
|   |   report-generator.ts   # Pure aggregation logic (RFC-008)
|   |   report-plugin.ts      # SeoPlugin adapter
|   |   types.ts             # Report-specific input/output types
|   |   __tests__/           # report-generator + report-plugin unit tests
|   README.md
```

`crawler/` and `generator/` modules are intentionally **not present
yet.** They will be added in subsequent tasks.

> **Plugin priorities are unique per analyzer.** The audit
> established that two pairs of analyzers previously shared
> priorities (URL/Schema at 12, Heading/Image at 13). Choosing a
> strict ascending run (10-16) eliminates the dependency on
> registration order and guarantees deterministic pipeline ordering.

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

### `utils/analyzer-helpers.ts`

Shared helpers reused by every analyzer (formerly duplicated
verbatim across each `*-analyzer.ts`): `dedupeSeverity`,
`calculateScore`, `calculateScoreBreakdown`, `simpleHash`, and the
generic `mergeAnalyzerOptions`. Pure, framework-agnostic, no
external dependencies.

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

### `analyzer/*-analyzer.ts`

Each analyzer (title, meta-description, url, heading, image, schema,
keyword) is a pure rules module that returns its own `*Analysis`
result with a full `SeoIssue[]` list. They share scoring helpers from
`utils/analyzer-helpers.ts` but each retains its own issue-factory
functions and per-analyzer options interface.

### `analyzer/*-plugin.ts`

Each plugin adapter wraps the corresponding analyzer as a `SeoPlugin`
consumed by the engine. Every plugin declares a **unique priority**
(see the folder layout above) so execution order is deterministic
regardless of the order callers invoke `engine.use(...)`.

### `report/`

Pure report aggregation logic (`report-generator.ts`) plus a
`SeoPlugin` adapter (`report-plugin.ts`). Produces a `SeoReportOutput`
from a list of `SeoCheckResult`s. See RFC-008 for the full design.

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
  // analyzers
  analyzeTitle,
  createTitlePlugin,
  createMetaDescriptionPlugin,
  createUrlPlugin,
  createHeadingPlugin,
  createImagePlugin,
  createSchemaPlugin,
  createKeywordPlugin,
  // report
  createReportPlugin,
} from "@/seo-agent";

const engine = new SeoEngine();
engine.use(
  createTitlePlugin({
    brandSuffix: " | Rentfy",
    enforceBrand: true,
    targetKeywords: ["rent", "Noida"],
  }),
  createMetaDescriptionPlugin({ city: "Noida", propertyType: "3BHK" }),
  createUrlPlugin({ city: "Noida", propertyType: "3BHK" }),
  createHeadingPlugin({ targetKeywords: ["3BHK", "Noida"] }),
  createImagePlugin({ recommendedImageCount: 10 }),
  createSchemaPlugin({ requireAddress: true, requirePrice: true }),
  createKeywordPlugin({ primaryKeyword: "3BHK in Noida" }),
);

const result = await engine.run({
  capability: "analyzer",
  payload: {
    title: "Rent 3BHK apartments in Noida | Rentfy",
    metaDescription: "Rent a 3BHK apartment in Noida. ...",
    canonical: "/rent/noida/3bhk-apartment",
    headings: [{ level: 1, text: "3BHK Apartment in Noida" }],
    images: [{ src: "/img/hero.jpg", alt: "3BHK hero", isHero: true }],
    schemaJsonLd: { "@context": "https://schema.org", "@type": "RealEstateListing" },
    content: "Spacious 3BHK apartment in Noida...",
  },
});

if (result.ok) console.log(result.outputs);
```

Future crawler/generator modules will be re-exported from
`seo-agent/index.ts` as they land.

---

## Versioning

`SEO_AGENT_VERSION` exposes the current contract version
(`0.4.0-analyzer-title`). Bump on breaking changes.
