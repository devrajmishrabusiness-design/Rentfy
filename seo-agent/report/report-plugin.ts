/**
 * SEO Report Generator Plugin — Report Plugin adapter.
 *
 * Wraps the pure `generateReport` function as a Report Plugin that registers
 * with the existing engine and executes in the "report" phase.
 *
 * Uses the existing plugin architecture: `definePlugin` and `artifactOutput`.
 */

import type { SeoCheckResult, SeoPlugin } from "../types";
import { definePlugin, artifactOutput } from "../core/plugin";
import { generateReport, validateReportInput } from "./report-generator";
import type { ReportInput, ReportOptions, SeoReportOutput } from "./types";

export type { ReportInput, ReportOptions, SeoReportOutput } from "./types";

/**
 * The payload for the Report Plugin: a list of analyzer check results plus
 * execution metadata. The engine delivers this as the plugin input's `payload`.
 */
export interface ReportPluginPayload {
  /** Check results from all analyzers */
  checks: SeoCheckResult[];
  /** Optional execution info from the engine */
  executionInfo?: Array<{
    checkId: string;
    status: "success" | "failed" | "timeout" | "skipped" | "disabled";
    executionTimeMs?: number;
    errorMessage?: string;
    startedAt?: string;
    completedAt?: string;
  }>;
  /** Property identifier */
  propertyId: string;
  /** Optional URL */
  url?: string;
}

/**
 * Create the SEO Report Generator plugin.
 *
 * @example
 *   const plugin = createReportPlugin({
 *     topIssuesLimit: 10,
 *     recommendationLimit: 5,
 *   });
 *   engine.use(plugin);
 */
export const createReportPlugin = (
  options: ReportOptions = {}
): SeoPlugin<ReportPluginPayload, SeoReportOutput> => {
  return definePlugin<ReportPluginPayload, SeoReportOutput>({
    id: "report.generator",
    name: "SEO Report Generator",
    version: "1.0.0",
    capability: "report",
    priority: 100,
    run: async ({ payload, config }) => {
      const reportInput: ReportInput = {
        checks: payload.checks || [],
        metadata: {
          propertyId: payload.propertyId,
          url: payload.url,
          runId: config.runId,
          engineVersion: config.version,
          generatedAt: new Date().toISOString(),
        },
        executionInfo: payload.executionInfo,
        options,
      };

      // Validate input
      const validation = validateReportInput(reportInput);
      if (!validation.valid) {
        throw new Error(
          `Report input validation failed: ${validation.errors.join(", ")}`
        );
      }

      // Generate the report
      const report = generateReport(reportInput);

      return artifactOutput(
        {
          id: "report.generator",
          name: "SEO Report Generator",
          version: "1.0.0",
          capability: "report",
        } as unknown as SeoPlugin<ReportPluginPayload, SeoReportOutput>,
        report
      );
    },
  });
};