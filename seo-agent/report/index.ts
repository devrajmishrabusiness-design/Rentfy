/**
 * Report module — public exports.
 */

export {
  generateReport,
  validateReportInput,
} from "./report-generator";

export { createReportPlugin } from "./report-plugin";
export type { ReportPluginPayload } from "./report-plugin";

export type {
  ReportInput,
  ReportOptions,
  ReportMetadata,
  SeoReportOutput,
  ExecutionInfo,
} from "./types";