/**
 * Image Analyzer Plugin — adapter from the `analyzeImages` pure rules
 * to the `SeoPlugin` interface consumed by the SEO engine.
 *
 * Uses the architecture helpers `definePlugin` and `analyzerOutput`
 * for consistency with the plugin architecture.
 */

import type { SeoCheckResult, SeoPlugin, PageSignals } from "../types";
import { definePlugin, analyzerOutput } from "../core/plugin";
import { analyzeImages, type ImageAnalyzerOptions, type ImageAnalyzerInput } from "./image-analyzer";

export type { ImageAnalyzerOptions } from "./image-analyzer";

/**
 * Create the Image Analyzer plugin with optional configuration.
 *
 * @example
 *   const plugin = createImagePlugin({
 *     minImageCount: 5,
 *     recommendedImageCount: 10,
 *     maxFileSize: 200,
 *   });
 *   engine.use(plugin);
 */
export const createImagePlugin = (
  opts: ImageAnalyzerOptions = {}
): SeoPlugin<PageSignals, SeoCheckResult> => {
  const plugin: SeoPlugin<PageSignals, SeoCheckResult> = definePlugin<PageSignals, SeoCheckResult>({
    id: "analyzer.image",
    name: "Image Analyzer",
    version: "0.1.0",
    capability: "analyzer",
    priority: 14,
    run: ({ payload }) => {
      // Forward the image list from the engine payload. When the
      // crawl layer has not produced a detailed image list, we fall
      // back to an empty array — which surfaces as the IMG-001
      // "No images found" issue, exactly as the analyzer rules
      // expect.
      const input: ImageAnalyzerInput = {
        images: payload.images ?? [],
      };

      const analysis = analyzeImages(input, opts);

      const checkResult: SeoCheckResult = {
        checkId: "image-analyzer",
        summary: analysis.summary,
        issues: analysis.issues,
        passed: analysis.passed,
      };

      return analyzerOutput(plugin, checkResult);
    },
  });
  return plugin;
};