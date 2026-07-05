/**
 * URL Analyzer Plugin — adapter from the `analyzeUrl` pure rules
 * to the `SeoPlugin` interface consumed by the SEO engine.
 *
 * Uses the architecture helpers `definePlugin` and `analyzerOutput`
 * for consistency with the plugin architecture.
 */

import type { SeoCheckResult, SeoPlugin, PageSignals } from "../types";
import { definePlugin, analyzerOutput } from "../core/plugin";
import { analyzeUrl, type UrlAnalyzerOptions } from "./url-analyzer";

export type { UrlAnalyzerOptions } from "./url-analyzer";

/**
 * Create the URL Analyzer plugin with optional configuration.
 *
 * @example
 *   const plugin = createUrlPlugin({
 *     city: "Noida",
 *     locality: "Sector 62",
 *     propertyType: "3BHK",
 *   });
 *   engine.use(plugin);
 */
export const createUrlPlugin = (
  opts: UrlAnalyzerOptions = {}
): SeoPlugin<PageSignals, SeoCheckResult> => {
  return definePlugin<PageSignals, SeoCheckResult>({
    id: "analyzer.url",
    name: "URL Analyzer",
    version: "0.1.0",
    capability: "analyzer",
    priority: 12,
    run: ({ payload }) => {
      // Extract slug from full URL if needed, or use canonical
      const urlSlug = payload.canonical;
      const analysis = analyzeUrl(urlSlug, opts);

      const checkResult: SeoCheckResult = {
        checkId: "url-analyzer",
        summary: `Checked URL slug "${analysis.urlSlug || "<missing>"}" (${analysis.slugLength} chars)`,
        issues: analysis.issues,
        passed: analysis.passed,
      };

      return analyzerOutput(
        { id: "analyzer.url", name: "URL Analyzer", version: "0.1.0", capability: "analyzer" } as any,
        checkResult
      );
    },
  });
};