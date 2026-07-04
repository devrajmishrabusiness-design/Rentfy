/**
 * Analyzer module — public exports.
 *
 * Each analyzer is shipped as a factory (`create*Plugin`) so callers
 * can configure it per-site before registering it with the engine.
 */

// Pure rules (testable without the plugin system)
export {
  analyzeTitle,
  type TitleAnalyzerOptions,
  type TitleAnalysis,
  type DuplicateTitleEntry,
  type DuplicateTitleStore,
} from "./title-analyzer";

// Plugin adapter
export { createTitlePlugin } from "./title-plugin";
export type { TitleAnalyzerOptions as TitlePluginOptions } from "./title-plugin";
