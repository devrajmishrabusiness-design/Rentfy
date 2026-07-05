/**
 * Meta Description Analyzer Plugin — adapter from the `analyzeDescription` pure rules
 * to the `SeoPlugin` interface consumed by the SEO engine.
 *
 * Uses the architecture helpers `definePlugin` and `analyzerOutput`
 * for consistency with the plugin architecture.
 */

import type { SeoCheckResult, SeoPlugin, PageSignals } from "../types";
import { definePlugin, analyzerOutput } from "../core/plugin";
import { analyzeDescription, type MetaDescriptionAnalyzerOptions } from "./meta-description-analyzer";

export type { MetaDescriptionAnalyzerOptions } from "./meta-description-analyzer";

/**
 * Create the Meta Description Analyzer plugin with optional configuration.
 *
 * @example
 *   const plugin = createMetaDescriptionPlugin({
 *     targetKeywords: ["rent", "Noida", "apartment"],
 *     city: "Noida",
 *     propertyType: "3BHK",
 *   });
 *   engine.use(plugin);
 */
export const createMetaDescriptionPlugin = (
  opts: MetaDescriptionAnalyzerOptions = {}
): SeoPlugin<PageSignals, SeoCheckResult> => {
  return definePlugin<PageSignals, SeoCheckResult>({
    id: "analyzer.meta-description",
    name: "Meta Description Analyzer",
    version: "0.1.0",
    capability: "analyzer",
    priority: 11,
    run: ({ payload }) => {
      const analysis = analyzeDescription(payload.metaDescription, opts);

      const checkResult: SeoCheckResult = {
        checkId: "meta-description-analyzer",
        summary: `Checked meta description for "${payload.metaDescription?.substring(0, 50) ?? "<missing>"}..." (${analysis.descriptionLength} chars)`,
        issues: analysis.issues,
        passed: analysis.passed,
      };

      return analyzerOutput(
        { id: "analyzer.meta-description", name: "Meta Description Analyzer", version: "0.1.0", capability: "analyzer" } as any,
        checkResult
      );
    },
  });
};