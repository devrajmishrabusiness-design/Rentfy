/**
 * Keyword Analyzer Plugin — adapter from the `analyzeKeywords` pure rules
 * to the `SeoPlugin` interface consumed by the SEO engine.
 *
 * Uses the architecture helpers `definePlugin` and `analyzerOutput`
 * for consistency with the plugin architecture.
 */

import type { SeoCheckResult, SeoPlugin, PageSignals } from "../types";
import { definePlugin, analyzerOutput } from "../core/plugin";
import { analyzeKeywords, type KeywordAnalyzerOptions } from "./keyword-analyzer";

export type { KeywordAnalyzerOptions } from "./keyword-analyzer";

/**
 * Create the Keyword Analyzer plugin with optional configuration.
 *
 * @example
 *   const plugin = createKeywordPlugin({
 *     primaryKeyword: "3BHK",
 *     secondaryKeywords: ["apartment", "Noida", "Sector 62"],
 *     minDensity: 0.5,
 *     maxDensity: 2.5,
 *     requireInTitle: true,
 *     requireInH1: true,
 *   });
 *   engine.use(plugin);
 */
export const createKeywordPlugin = (
  opts: KeywordAnalyzerOptions = {}
): SeoPlugin<PageSignals, SeoCheckResult> => {
  return definePlugin<PageSignals, SeoCheckResult>({
    id: "analyzer.keyword",
    name: "Keyword Analyzer",
    version: "0.1.0",
    capability: "analyzer",
    priority: 14,
    run: ({ payload }) => {
      const analysis = analyzeKeywords(payload.content, {
        ...opts,
        title: payload.title,
        metaDescription: payload.metaDescription,
        urlSlug: payload.canonical,
        headings: payload.headings,
        targetKeywords: opts.primaryKeyword ? [opts.primaryKeyword, ...(opts.secondaryKeywords || [])] : opts.secondaryKeywords,
      });

      const summary = `Checked keyword usage (${analysis.primaryKeyword || "no keyword"}, ${analysis.keywordOccurrences} occurrences, ${analysis.keywordDensity.toFixed(2)}% density)`;

      const checkResult: SeoCheckResult = {
        checkId: "keyword-analyzer",
        summary,
        issues: analysis.issues,
        passed: analysis.passed,
      };

      return analyzerOutput(
        { id: "analyzer.keyword", name: "Keyword Analyzer", version: "0.1.0", capability: "analyzer" } as any,
        checkResult
      );
    },
  });
};