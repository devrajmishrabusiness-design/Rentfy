/**
 * Schema Analyzer Plugin — adapter from the `analyzeSchema` pure rules
 * to the `SeoPlugin` interface consumed by the SEO engine.
 *
 * Uses the architecture helpers `definePlugin` and `analyzerOutput`
 * for consistency with the plugin architecture.
 */

import type { SeoCheckResult, SeoPlugin, PageSignals } from "../types";
import { definePlugin, analyzerOutput } from "../core/plugin";
import { analyzeSchema, type SchemaAnalyzerOptions } from "./schema-analyzer";

export type { SchemaAnalyzerOptions } from "./schema-analyzer";

/**
 * Create the Schema Analyzer plugin with optional configuration.
 *
 * @example
 *   const plugin = createSchemaPlugin({
 *     allowedTypes: ["RealEstateListing", "Product"],
 *     requireAddress: true,
 *     requirePrice: true,
 *     requireGeo: false,
 *   });
 *   engine.use(plugin);
 */
export const createSchemaPlugin = (
  opts: SchemaAnalyzerOptions = {}
): SeoPlugin<PageSignals, SeoCheckResult> => {
  return definePlugin<PageSignals, SeoCheckResult>({
    id: "analyzer.schema",
    name: "Schema Analyzer",
    version: "0.1.0",
    capability: "analyzer",
    priority: 12,
    run: ({ payload }) => {
      const analysis = analyzeSchema(payload.schemaJsonLd, opts);

      const schemaTypeStr = typeof analysis.schemaType === "string" 
        ? analysis.schemaType 
        : Array.isArray(analysis.schemaType) 
          ? analysis.schemaType.join(", ") 
          : "<none>";

      const checkResult: SeoCheckResult = {
        checkId: "schema-analyzer",
        summary: `Checked schema.org structured data (${schemaTypeStr}, ${analysis.schemaCount} schema(s), ${analysis.propertyCount} properties)`,
        issues: analysis.issues,
        passed: analysis.passed,
      };

      return analyzerOutput(
        { id: "analyzer.schema", name: "Schema Analyzer", version: "0.1.0", capability: "analyzer" } as any,
        checkResult
      );
    },
  });
};