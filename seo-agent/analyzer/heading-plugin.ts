/**
 * Heading Analyzer Plugin — adapter from the `analyzeHeadings` pure rules
 * to the `SeoPlugin` interface consumed by the SEO engine.
 *
 * Uses the architecture helpers `definePlugin` and `analyzerOutput`
 * for consistency with the plugin architecture.
 */

import type { SeoCheckResult, SeoPlugin, PageSignals } from "../types";
import { definePlugin, analyzerOutput } from "../core/plugin";
import { analyzeHeadings, type HeadingAnalyzerOptions } from "./heading-analyzer";

export type { HeadingAnalyzerOptions, Heading } from "./heading-analyzer";

/**
 * Create the Heading Analyzer plugin with optional configuration.
 *
 * @example
 *   const plugin = createHeadingPlugin({
 *     targetKeywords: ["3BHK", "Noida"],
 *     city: "Noida",
 *     requireKeywordInH1: true,
 *     recommendedH2Count: 5,
 *   });
 *   engine.use(plugin);
 */
export const createHeadingPlugin = (
  opts: HeadingAnalyzerOptions = {}
): SeoPlugin<PageSignals, SeoCheckResult> => {
  return definePlugin<PageSignals, SeoCheckResult>({
    id: "analyzer.heading",
    name: "Heading Analyzer",
    version: "0.1.0",
    capability: "analyzer",
    priority: 13,
    run: ({ payload }) => {
      const analysis = analyzeHeadings(payload.headings as any, opts);

      const summary = `Checked heading structure (${analysis.totalHeadings} total, ${analysis.h1Count} H1, ${analysis.h2Count} H2, avg length: ${analysis.averageHeadingLength} chars)`;

      const checkResult: SeoCheckResult = {
        checkId: "heading-analyzer",
        summary,
        issues: analysis.issues,
        passed: analysis.passed,
      };

      return analyzerOutput(
        { id: "analyzer.heading", name: "Heading Analyzer", version: "0.1.0", capability: "analyzer" } as any,
        checkResult
      );
    },
  });
};