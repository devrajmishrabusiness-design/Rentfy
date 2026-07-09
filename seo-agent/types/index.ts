/**
 * Core SEO Agent Types
 *
 * These types form the public contract for the SEO Agent. They are designed
 * to be framework-agnostic so any module (analyzer, generator, crawler, etc.)
 * can depend on them without taking on shared dependencies.
 *
 * Keep these types lean. Features should be derived from combinations of
 * the primitives defined here. Prefer composition over inheritance by using
 * intersection/unions where appropriate.
 */

/**
 * CSS color severity buckets used in report UIs.
 * - "critical": must-fix (red)
 * - "warning": should-fix (amber)
 * - "info": nice-to-fix (blue)
 * - "success": already good (green)
 */
export type SeverityLevel = "critical" | "warning" | "info" | "success";

/**
 * Granular SEO issue categories. Each analyzer may report under
 * one or more of these categories.
 */
export type IssueCategory =
  | "meta"
  | "headings"
  | "content"
  | "performance"
  | "accessibility"
  | "mobile"
  | "structured-data"
  | "links"
  | "images"
  | "keywords"
  | "technical";

/**
 * A single discrete SEO issue found by the analyzer.
 */
export interface SeoIssue {
  /** Identifier, e.g. "meta-description-missing". */
  id: string;
  /** Human-readable title. */
  title: string;
  /** Human-readable explanation. */
  description: string;
  /** Severity bucket. */
  severity: SeverityLevel;
  /** Issue category. */
  category: IssueCategory;
  /** Optional fix recommendation. */
  recommendation?: string;
  /** Current observed value (if applicable). */
  currentValue?: string | number | boolean;
  /** Recommended target value. */
  expectedValue?: string | number | boolean;
  /** Weight used for final scoring. 0–10. */
  weight?: number;
}

/**
 * A collection of issues belonging to one analyzer / category.
 */
export interface SeoCheckResult {
  /** The analyzer or rule ID that produced this group. */
  checkId: string;
  /** A short summary of what was checked. */
  summary: string;
  /** All individual issues found. */
  issues: SeoIssue[];
  /** Free-form pass/fail. Convenience boolean. */
  passed: boolean;
}

/**
 * Full analysis result for one URL/page.
 */
export interface AnalysisResult {
  url: string;
  /** Whether the URL was crawlable. */
  isCrawled: boolean;
  /** ISO timestamp of the analysis. */
  analyzedAt: string;
  /** Total score 0–100. */
  score: number;
  /** Individual check results (one per analyzer). */
  checks: SeoCheckResult[];
  /** Indicators pulled from the parsed page. */
  signals: PageSignals;
  /** Pass-to-pass list of top issues. */
  topIssues: SeoIssue[];
}

/**
 * Metadata for a single image discovered on a page. Used by the
 * Image Analyzer via `PageSignals.images` and by `ImageAnalyzerInput`.
 *
 * Defined here (rather than in the image analyzer) because it is part
 * of the shared `PageSignals` contract that the engine payload carries.
 */
export interface ImageMetadata {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  format?: string;
  isHero?: boolean;
}

/**
 * Page-level signals extracted during a crawl.
 * Each field maps to a single SEO consideration.
 */
export interface PageSignals {
  title?: string;
  titleLength?: number;
  metaDescription?: string;
  metaDescriptionLength?: number;
  canonical?: string;
  robots?: string;
  h1Count?: number;
  h2Count?: number;
  h3Count?: number;
  headings?: Array<{ level: number; text: string; id?: string }>;
  content?: string;
  wordCount?: number;
  internalLinks?: number;
  externalLinks?: number;
  brokenLinks?: number;
  imagesWithoutAlt?: number;
  imagesTotal?: number;
  /**
   * Detailed image list (one entry per detected <img>). Consumed by
   * the Image Analyzer plugin when present; absent when only the
   * aggregate counters are available.
   */
  images?: ImageMetadata[];
  hasOpenGraph?: boolean;
  hasTwitterCard?: boolean;
  hasJsonLd?: boolean;
  schemaJsonLd?: string | object;
  hasSitemap?: boolean;
  hasRobotsTxt?: boolean;
  language?: string;
  viewport?: string;
  loadTimeMs?: number;
  pageSizeKb?: number;
}

/**
 * Internal link reference discovered by the crawler.
 */
export interface CrawlLink {
  sourceUrl: string;
  targetUrl: string;
  anchor?: string;
  rel?: string;
  isInternal: boolean;
  isBroken?: boolean;
  status?: number;
}

/**
 * Result of a crawl operation.
 */
export interface CrawlResult {
  startUrl: string;
  completedAt: string;
  pages: CrawledPage[];
  brokenLinks: CrawlLink[];
  totalPages: number;
  totalBroken: number;
}

/**
 * A single page captured during a crawl.
 */
export interface CrawledPage {
  url: string;
  status: number;
  title?: string;
  metaDescription?: string;
  h1?: string;
  wordCount?: number;
  outgoingLinks: CrawlLink[];
  imagesTotal?: number;
  imagesWithoutAlt?: number;
  loadTimeMs?: number;
  sizeKb?: number;
  discoveredAt: string;
  depth: number;
  fromUrl?: string;
}

/**
 * SEO generator outputs / inputs.
 */
export interface SeoMeta {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  openGraph?: OpenGraphTags;
  twitter?: TwitterTags;
}

export interface OpenGraphTags {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
  siteName?: string;
  locale?: string;
}

export interface TwitterTags {
  card?: "summary" | "summary_large_image" | "app" | "player";
  title?: string;
  description?: string;
  image?: string;
  site?: string;
  creator?: string;
}

/**
 * Structured data templates.
 */
export interface StructuredDataTemplate {
  context: string;
  type: string;
  data: Record<string, unknown>;
}

/**
 * Keyword analysis types.
 */
export interface KeywordInput {
  text: string;
  targetKeyword: string;
  language?: string;
}

export interface KeywordReport {
  target: string;
  occurrences: number;
  density: number;
  inTitle: boolean;
  inMeta: boolean;
  inH1: boolean;
  inFirstParagraph: boolean;
  variants: string[];
  recommendations: string[];
}

/**
 * Generator pipeline step inputs / outputs.
 */
export interface PageInput {
  title?: string;
  content?: string;
  url?: string;
  imageUrl?: string;
  type?: string;
  language?: string;
  targetKeywords?: string[];
  agency?: {
    name: string;
    logoUrl?: string;
  };
}

/**
 * Final report rendered for a user (HTML, MD, JSON).
 */
export interface SeoReport {
  id: string;
  generatedAt: string;
  url?: string;
  siteWide?: boolean;
  score: number;
  sections: ReportSection[];
  formats: ReportFormat[];
}

export interface ReportSection {
  id: string;
  title: string;
  description?: string;
  data: unknown;
}

export type ReportFormat = "html" | "markdown" | "json";

/**
 * Score primitive with breakdown.
 */
export interface ScoreBreakdown {
  overall: number;
  byCategory: Record<IssueCategory, number>;
  passed: number;
  failed: number;
  warnings: number;
  passedChecks: number;
  totalChecks: number;
}

/**
 * Generic Result<T, E> for module-level error handling.
 */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Helper to construct a successful result.
 */
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

/**
 * Helper to construct a failed result.
 */
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/* ==========================================================================
 * Plugin Contracts
 *
 * These are SHARED contracts used by every plugin type (analyzer,
 * generator, crawler, report). Putting them in `types/` instead of in
 * `core/` keeps the plugin system itself framework-agnostic: a plugin
 * only needs `types` to compile. `core/` builds on top.
 * ========================================================================== */

/**
 * Every plugin contributes to one capability. Capability acts as a
 * discriminator so the engine can route each plugin to the right
 * execution stage.
 */
export type PluginCapability =
  | "analyzer"
  | "generator"
  | "crawler"
  | "report";

/**
 * Lifecycle phase of the engine.
 *
 * The engine runs plugins in a fixed order:
 *
 *     bootstrap → crawl → analyze → generate → report
 *
 * Each plugin declares the phase it belongs to via its capability.
 */
export type PluginPhase =
  | "bootstrap"
  | "crawl"
  | "analyze"
  | "generate"
  | "report";

/**
 * Engine pipeline input. Holds everything the engine hands to plugins.
 *
 * `payload` is the typed data a plugin deals with — e.g. for an analyzer
 * it's `PageSignals`, for a generator it's a `PageInput`, etc. The engine
 * does not inspect it — the plugin is responsible for typing its own
 * input through TypeScript generics (see `core/plugin.ts`).
 */
export interface PluginInput<TPayload = unknown> {
  /** Which phase is currently executing. */
  phase: PluginPhase;
  /** The capability requested by the caller of `engine.run(...)`. */
  capability: PluginCapability;
  /** Generic payload — shape depends on capability. */
  payload: TPayload;
  /** Engine configuration shared with all plugins. */
  config: EngineConfig;
  /** Mutable bag plugins can write intermediate values into. */
  state: PluginState;
}

/**
 * Engine configuration. Plugins read but never write.
 */
export interface EngineConfig {
  /** ISO timestamp of when the run started. */
  runId: string;
  /** Optional target URL or scope (every plugin decides how to use it). */
  scope?: string;
  /** Per-plugin enable/disable overrides keyed by `plugin.id`. */
  enabledPlugins: ReadonlySet<string>;
  /** Mapping of plugin id → resolved priority (lower runs first). */
  priorities: ReadonlyMap<string, number>;
  /** Engine version (kept here to avoid circular imports). */
  version: string;
  /** Free-form extension point — never mutate. */
  options: Readonly<Record<string, unknown>>;
}

/**
 * Mutable per-run state bag. Plugins may read/write keys, but should
 * namespace their keys (e.g. `"metaAnalyzer.flag"`).
 */
export interface PluginState {
  set(key: string, value: unknown): void;
  get<T = unknown>(key: string): T | undefined;
  has(key: string): boolean;
  entries(): IterableIterator<[string, unknown]>;
}

/**
 * Output of a single plugin.
 *
 * - For analyzers: `kind = "issues"` — wraps a `SeoCheckResult`.
 * - For generators: `kind = "artifact"` — wraps generated SEO payload.
 * - For crawlers:   `kind = "data"` — wraps a `CrawlResult`.
 * - For reports:    `kind = "artifact"` — wraps a `SeoReport`.
 */
export interface PluginOutput<TValue = unknown> {
  /** Plugin id that produced the output. */
  pluginId: string;
  /** Output discriminator. Routes how the pipeline processes the value. */
  kind: "issues" | "data" | "artifact";
  /** The actual output payload (issue bundle, generated meta, crawl data, etc.). */
  value: TValue;
}

/**
 * Plugin lifecycle hook return values.
 *
 * - `continue` (default) — let the engine proceed normally.
 * - `skip`              — treat this phase as a no-op for this plugin.
 * - `abort`             — fail the entire engine run with an error.
 */
export type PluginHook<TPayload = unknown> =
  | { kind: "continue" }
  | { kind: "skip"; reason?: string }
  | { kind: "abort"; error: Error };

/**
 * The single universal plugin interface.
 *
 * Every analyzer, generator, crawler, and report implements this exact
 * shape — only the generic argument changes. This is what makes the
 * plugin system "indifferent" — the engine never discriminates on
 * capability at the type level; TypeScript generics do.
 *
 * Generic parameters:
 * - `TInput`  : expected input payload  (e.g. `PageSignals`)
 * - `TOutput` : produced output value   (e.g. `SeoCheckResult`)
 *
 * Plugins should not throw unexpectedly. They should signal control
 * flow through `PluginHook` and only throw for unrecoverable errors.
 */
export interface SeoPlugin<TInput = unknown, TOutput = unknown> {
  /** Stable, unique plugin id (kebab-case is recommended, e.g. "meta-description-length"). */
  readonly id: string;
  /** Human-readable name for logs / UIs. */
  readonly name: string;
  /** Plugin version (semver). */
  readonly version: string;
  /** Capability this plugin contributes to. */
  readonly capability: PluginCapability;
  /** Phase at which the engine runs this plugin. Defaults to capability-as-phase. */
  readonly phase?: PluginPhase;
  /** Lower number = runs first. Ties broken by registration order. Default: 100. */
  readonly priority?: number;
  /**
   * Whether the plugin is enabled by default. Engine config and
   * runtime toggles can still flip this. Default: true.
   */
  readonly enabledByDefault?: boolean;
  /**
   * Optional capability / phase guard. If it returns `abort` or `skip`,
   * the plugin is bypassed for this run.
   */
  readonly condition?: (input: PluginInput) => PluginHook<TInput>;
  /** Main execution. Must be pure with respect to its input — should not mutate `input.payload`. */
  readonly run: (input: PluginInput<TInput>) => PluginOutput<TOutput> | Promise<PluginOutput<TOutput>>;
  /** Optional cleanup hook. Runs after the pipeline completes (or aborts). */
  readonly teardown?: (input: PluginInput<TInput>, output: PluginOutput<TOutput>) => void | Promise<void>;
}

/**
 * Plugin module shape: a plugin can be exported as a default object, or
 * via a `create` factory. Factories make future composability / config
 * possible without changing this contract.
 */
export type PluginModule<TInput = unknown, TOutput = unknown> =
  | SeoPlugin<TInput, TOutput>
  | { create: (options?: unknown) => SeoPlugin<TInput, TOutput> };

/**
 * Pipeline error raised by the engine when a plugin aborts or throws.
 */
export interface PipelineError extends Error {
  pluginId: string;
  phase: PluginPhase;
}

/**
 * Result of an entire engine run.
 *
 * - When `ok = true`, `output` contains the accumulated artifacts for
 *   the requested capability.
 * - When `ok = false`, `error` is a `PipelineError`.
 */
export interface EngineRunResult<TOutput = unknown> {
  ok: boolean;
  runId: string;
  /** Order in which plugins executed. */
  executed: string[];
  /** Skipped plugins (and why). */
  skipped: Array<{ pluginId: string; reason: string }>;
  /** Outputs grouped by plugin id. */
  outputs: Record<string, PluginOutput<TOutput>>;
  /** Final payload, if the phase produced one. */
  payload?: TOutput;
  /** Error, if any. */
  error?: PipelineError;
}

/**
 * Options callers pass to `engine.run(...)`.
 */
export interface EngineRunOptions<TPayload = unknown> {
  /** Capability to invoke — drives routing and pipeline selection. */
  capability: PluginCapability;
  /** Payload for the capability. Type is the caller's responsibility. */
  payload: TPayload;
  /** Optional scope identifier (e.g. a URL or site name). */
  scope?: string;
  /** Optional per-plugin overrides: `{ "plugin.id": false }` to disable. */
  pluginOverrides?: Record<string, boolean>;
  /** Optional per-plugin priority overrides. */
  priorityOverrides?: Record<string, number>;
  /** Free-form options forwarded to plugins (read-only). */
  options?: Record<string, unknown>;
}
