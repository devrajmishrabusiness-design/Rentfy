/**
 * SEO Agent — Public API
 *
 * This is the single entry point for consumers of the SEO Agent.
 * Importing here gives you a deterministic surface area while internal
 * modules can be reorganised without breaking callers.
 *
 * Foundation + plugin core.
 * Future modules (analyzer, crawler, generator, reports) will be
 * exported from their respective subpaths as they are implemented.
 *
 * Framework-agnostic: no Next.js, no React, no Supabase.
 */

// -------- Types --------
export type {
  SeverityLevel,
  IssueCategory,
  SeoIssue,
  SeoCheckResult,
  AnalysisResult,
  PageSignals,
  CrawlLink,
  CrawlResult,
  CrawledPage,
  SeoMeta,
  OpenGraphTags,
  TwitterTags,
  StructuredDataTemplate,
  KeywordInput,
  KeywordReport,
  PageInput,
  SeoReport,
  ReportSection,
  ReportFormat,
  ScoreBreakdown,
  Result,
  // Plugin contracts added in Task 2
  PluginCapability,
  PluginPhase,
  PluginInput,
  PluginOutput,
  PluginHook,
  SeoPlugin,
  PluginModule,
  PluginState,
  EngineConfig,
  EngineRunOptions,
  EngineRunResult,
  PipelineError,
} from "./types";

// Type-level helpers re-exported as values
export { ok, err } from "./types";

// -------- Utils: text --------
export {
  stripHtml,
  normalize,
  slugify,
  truncate,
  countWords,
  keywordDensity,
  fleschReadingEase,
  findOccurrences,
} from "./utils/text";

// -------- Utils: url --------
export {
  isAbsoluteUrl,
  isInternalLink,
  normalizeUrl,
  resolveUrl,
  hostnameOf,
  pathnameOf,
} from "./utils/url";

// -------- Utils: scoring --------
export { scoreCheck, aggregateScores, topIssues } from "./utils/scoring";

// -------- Core: plugin engine --------
export {
  // Engine
  SeoEngine,
  type EngineEvents,
  // Registry
  SeoRegistry,
  createRegistry,
  type SeoRegistryLike,
  // Pipeline
  selectPlugins,
  evaluateCondition,
  runPipeline,
  toPipelineError,
  type PipelineExecutorOptions,
  // Plugin helpers
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
  // Context
  buildConfig,
  createPluginState,
} from "./core";

// -------- Analyzer: title --------
export {
  analyzeTitle,
  createTitlePlugin,
  type TitleAnalyzerOptions,
  type TitleAnalysis,
  type DuplicateTitleEntry,
  type DuplicateTitleStore,
} from "./analyzer";

/**
 * Version of the SEO Agent contract.
 * Bump when there are breaking changes to public types.
 */
export const SEO_AGENT_VERSION = "0.4.0-analyzer-title";
