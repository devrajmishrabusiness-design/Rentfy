/**
 * SEO Report Generator Types
 *
 * These types define the input/output contract for the Report Generator plugin.
 */

import type { SeoCheckResult, SeoIssue, IssueCategory } from "../types";

/**
 * Metadata for report generation.
 */
export interface ReportMetadata {
  /** Unique property identifier */
  propertyId: string;
  /** Optional URL analyzed */
  url?: string;
  /** Engine run ID */
  runId: string;
  /** Engine version */
  engineVersion: string;
  /** Report generation timestamp (ISO 8601) */
  generatedAt: string;
}

/**
 * Report generation options.
 */
export interface ReportOptions {
  /** Include success issues in report. Default: false */
  includeSuccessIssues?: boolean;
  /** Max issues in topIssues list. Default: 10 */
  topIssuesLimit?: number;
  /** Max prioritized recommendations. Default: 5 */
  recommendationLimit?: number;
  /** Custom category weights (0-1). Optional */
  categoryWeights?: Partial<Record<IssueCategory, number>>;
  /** Deduplication strategy. Default: "best-severity" */
  dedupeStrategy?: "first" | "best-severity" | "most-specific";
}

/**
 * Execution info for a single analyzer check.
 */
export interface ExecutionInfo {
  /** Check/analyzer ID */
  checkId: string;
  /** Execution status */
  status: "success" | "failed" | "timeout" | "skipped" | "disabled";
  /** Execution time in milliseconds */
  executionTimeMs?: number;
  /** Error message if failed */
  errorMessage?: string;
  /** Start timestamp */
  startedAt?: string;
  /** Completion timestamp */
  completedAt?: string;
}

/**
 * Input to the Report Generator.
 */
export interface ReportInput {
  /** Analyzer check results */
  checks: SeoCheckResult[];
  /** Report metadata */
  metadata: ReportMetadata;
  /** Optional execution info */
  executionInfo?: ExecutionInfo[];
  /** Optional report options */
  options?: ReportOptions;
}

/**
 * Output from the Report Generator (the final SEO report).
 */
export interface SeoReportOutput {
  /** Overall SEO score (0-100) */
  overallScore: number;
  /** Score interpretation grade */
  scoreGrade: "excellent" | "good" | "needs-improvement" | "poor";
  /** Pass/fail determination */
  passed: boolean;
  /** Threshold for passing (default: 70) */
  passedThreshold: number;
  /** Category scores */
  categoryScores: Record<IssueCategory, number>;
  /** Critical severity issues */
  criticalIssues: SeoIssue[];
  /** High severity issues (warnings) */
  highIssues: SeoIssue[];
  /** Medium severity issues (info) */
  mediumIssues: SeoIssue[];
  /** Low severity issues (success, optional) */
  lowIssues: SeoIssue[];
  /** Ranked top issues */
  topIssues: SeoIssue[];
  /** Prioritized actionable recommendations */
  recommendations: string[];
  /** Count of passed checks */
  passedChecks: number;
  /** Count of failed checks */
  failedChecks: number;
  /** Count of checks with warnings */
  warningChecks: number;
  /** Total number of checks */
  totalChecks: number;
  /** Full analyzer results */
  analyzerResults: SeoCheckResult[];
  /** Execution summary */
  executionSummary: {
    totalExecutionTimeMs: number;
    successfulAnalyzers: number;
    failedAnalyzers: number;
    skippedAnalyzers: number;
    disabledAnalyzers: number;
  };
  /** Report metadata */
  metadata: ReportMetadata & {
    /** Report version (RFC-008) */
    reportVersion: string;
  };
}

/**
 * Internal representation of a deduplicated issue with source tracking.
 */
export interface DedupedIssue {
  /** Original issue */
  issue: SeoIssue;
  /** Source check ID */
  sourceCheckId: string;
  /** Number of duplicates merged */
  duplicateCount: number;
}