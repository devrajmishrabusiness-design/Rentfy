/**
 * Title Analyzer Plugin — adapter from the `analyzeTitle` pure rules
 * to the `SeoPlugin` interface consumed by the SEO engine.
 *
 * Uses the architecture helpers `definePlugin` and `analyzerOutput`
 * for consistency with the plugin architecture.
 */

import type { SeoCheckResult, SeoPlugin, PageSignals } from "../types";
import { definePlugin, analyzerOutput } from "../core/plugin";
import { analyzeTitle, type TitleAnalyzerOptions } from "./title-analyzer";

export type { TitleAnalyzerOptions } from "./title-analyzer";

/**
 * Create the Title Analyzer plugin with optional configuration.
 *
 * @example
 *   const plugin = createTitlePlugin({
 *     brandSuffix: " | Rentfy",
 *     enforceBrand: true,
 *     targetKeywords: ["rent", "Noida", "apartment"],
 *   });
 *   engine.use(plugin);
 */
export const createTitlePlugin = (
  opts: TitleAnalyzerOptions = {}
): SeoPlugin<PageSignals, SeoCheckResult> => {
  const plugin: SeoPlugin<PageSignals, SeoCheckResult> = definePlugin<PageSignals, SeoCheckResult>({
    id: "analyzer.title",
    name: "Title Analyzer",
    version: "0.1.0",
    capability: "analyzer",
    priority: 10,
    run: ({ payload }) => {
      const analysis = analyzeTitle(payload.title, opts);

      const checkResult: SeoCheckResult = {
        checkId: "title-analyzer",
        summary: `Checked title for "${payload.title ?? "<missing>"}" (${analysis.titleLength} chars)`,
        issues: analysis.issues,
        passed: analysis.passed,
      };

      return analyzerOutput(plugin, checkResult);
    },
  });
  return plugin;
};