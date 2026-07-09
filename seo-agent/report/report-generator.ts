/**
 * SEO Report Generator — Pure aggregation logic.
 *
 * This module contains the pure functions for aggregating analyzer outputs
 * into a unified SEO report. It does not depend on the plugin system.
 *
 * All functions are stateless, side-effect-free, and deterministic.
 */

import type { SeoCheckResult, SeoIssue, IssueCategory, SeverityLevel } from "../types";
import { aggregateScores, topIssues as computeTopIssues } from "../utils/scoring";
import type { ReportInput, SeoReportOutput, DedupedIssue, ExecutionInfo } from "./types";

const REPORT_VERSION = "1.0.0";
const PASSED_THRESHOLD = 70;

/**
 * Default report options.
 */
const DEFAULT_OPTIONS: Required<NonNullable<ReportInput["options"]>> = {
  includeSuccessIssues: false,
  topIssuesLimit: 10,
  recommendationLimit: 5,
  categoryWeights: {},
  dedupeStrategy: "best-severity",
};

/**
 * Severity order for sorting (higher index = more severe).
 */
const SEVERITY_ORDER: Record<SeverityLevel, number> = {
  critical: 3,
  warning: 2,
  info: 1,
  success: 0,
};

/**
 * Default weight by severity (used when issue.weight is undefined).
 */
const DEFAULT_WEIGHT_BY_SEVERITY: Record<SeverityLevel, number> = {
  critical: 10,
  warning: 5,
  info: 1,
  success: 0,
};

/**
 * Canonical category order for deterministic output.
 */
const CATEGORY_ORDER: IssueCategory[] = [
  "meta",
  "headings",
  "content",
  "performance",
  "accessibility",
  "mobile",
  "structured-data",
  "links",
  "images",
  "keywords",
  "technical",
];

/**
 * Get weight for an issue (uses issue.weight or derives from severity).
 */
const getIssueWeight = (issue: SeoIssue): number => {
  return issue.weight ?? DEFAULT_WEIGHT_BY_SEVERITY[issue.severity];
};

/**
 * Compare two issues for deduplication based on strategy.
 * Returns positive if `candidate` (b) should replace `existing` (a), negative if `existing` should be kept.
 */
const compareForDedupe = (
  existing: DedupedIssue,
  candidate: DedupedIssue,
  strategy: "first" | "best-severity" | "most-specific"
): number => {
  if (strategy === "first") {
    return -1; // Never replace (keep first)
  }

  if (strategy === "best-severity") {
    // Positive if candidate is more severe than existing
    return SEVERITY_ORDER[candidate.issue.severity] - SEVERITY_ORDER[existing.issue.severity];
  }

  if (strategy === "most-specific") {
    // Positive if candidate has higher weight than existing
    return getIssueWeight(candidate.issue) - getIssueWeight(existing.issue);
  }

  return SEVERITY_ORDER[candidate.issue.severity] - SEVERITY_ORDER[existing.issue.severity]; // Default: best-severity
};

/**
 * Normalize an issue to fill in missing required fields.
 */
const normalizeIssue = (issue: SeoIssue, checkId: string, index: number): SeoIssue => {
  return {
    id: issue.id || `${checkId}-issue-${index}`,
    title: issue.title || issue.id || `${checkId}-issue-${index}`,
    description: issue.description || issue.title || issue.id || "Issue",
    severity: issue.severity || "info",
    category: issue.category || "technical",
    recommendation: issue.recommendation,
    currentValue: issue.currentValue,
    expectedValue: issue.expectedValue,
    weight: issue.weight,
  };
};

/**
 * Deduplicate issues within a single check.
 */
const deduplicateIssues = (
  issues: SeoIssue[],
  checkId: string,
  strategy: "first" | "best-severity" | "most-specific"
): SeoIssue[] => {
  const issueMap = new Map<string, DedupedIssue>();

  for (let i = 0; i < issues.length; i++) {
    const issue = normalizeIssue(issues[i], checkId, i);
    const key = `${issue.id}::${issue.category}::${issue.title}`;
    const existing = issueMap.get(key);

    if (!existing) {
      issueMap.set(key, {
        issue,
        sourceCheckId: checkId,
        duplicateCount: 1,
      });
    } else {
      const candidate: DedupedIssue = {
        issue,
        sourceCheckId: checkId,
        duplicateCount: existing.duplicateCount + 1,
      };

      if (compareForDedupe(existing, candidate, strategy) > 0) {
        issueMap.set(key, candidate);
      } else {
        existing.duplicateCount++;
      }
    }
  }

  return Array.from(issueMap.values()).map((d) => d.issue);
};

/**
 * Filter out null/undefined/malformed checks.
 */
const sanitizeChecks = (checks: SeoCheckResult[]): SeoCheckResult[] => {
  return checks.filter((check): check is SeoCheckResult => {
    return check != null && typeof check === "object" && Array.isArray(check.issues);
  });
};

/**
 * Deduplicate all issues across all checks.
 */
const deduplicateAllIssues = (
  checks: SeoCheckResult[],
  strategy: "first" | "best-severity" | "most-specific"
): SeoCheckResult[] => {
  return checks.map((check) => ({
    ...check,
    issues: deduplicateIssues(check.issues, check.checkId, strategy),
  }));
};

/**
 * Compute score grade from overall score.
 */
const computeScoreGrade = (score: number): "excellent" | "good" | "needs-improvement" | "poor" => {
  if (score >= 90) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "needs-improvement";
  return "poor";
};

/**
 * Bucket issues by severity.
 */
const bucketIssuesBySeverity = (
  issues: SeoIssue[],
  includeSuccess: boolean
): {
  critical: SeoIssue[];
  high: SeoIssue[];
  medium: SeoIssue[];
  low: SeoIssue[];
} => {
  const critical: SeoIssue[] = [];
  const high: SeoIssue[] = [];
  const medium: SeoIssue[] = [];
  const low: SeoIssue[] = [];

  for (const issue of issues) {
    switch (issue.severity) {
      case "critical":
        critical.push(issue);
        break;
      case "warning":
        high.push(issue);
        break;
      case "info":
        medium.push(issue);
        break;
      case "success":
        if (includeSuccess) {
          low.push(issue);
        }
        break;
    }
  }

  // Sort each bucket by severity order (for determinism), then by weight, then by id
  const sortIssues = (arr: SeoIssue[]) =>
    arr.sort((a, b) => {
      const severityDiff = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
      if (severityDiff !== 0) return severityDiff;
      const weightDiff = getIssueWeight(b) - getIssueWeight(a);
      if (weightDiff !== 0) return weightDiff;
      return a.id.localeCompare(b.id);
    });

  return {
    critical: sortIssues([...critical]),
    high: sortIssues([...high]),
    medium: sortIssues([...medium]),
    low: sortIssues([...low]),
  };
};

/**
 * Extract and deduplicate recommendations.
 */
const extractRecommendations = (
  issues: SeoIssue[],
  limit: number
): string[] => {
  const seen = new Set<string>();
  const recommendations: string[] = [];

  // Sort by severity (critical first), then weight (higher first), then id
  const sorted = [...issues].sort((a, b) => {
    const severityDiff = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
    if (severityDiff !== 0) return severityDiff;
    const weightDiff = getIssueWeight(b) - getIssueWeight(a);
    if (weightDiff !== 0) return weightDiff;
    return a.id.localeCompare(b.id);
  });

  for (const issue of sorted) {
    if (!issue.recommendation) continue;
    const trimmed = issue.recommendation.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    recommendations.push(trimmed);
    if (recommendations.length >= limit) break;
  }

  return recommendations;
};

/**
 * Compute execution summary from execution info.
 */
const computeExecutionSummary = (executionInfo?: ExecutionInfo[]): {
  totalExecutionTimeMs: number;
  successfulAnalyzers: number;
  failedAnalyzers: number;
  skippedAnalyzers: number;
  disabledAnalyzers: number;
} => {
  if (!executionInfo || executionInfo.length === 0) {
    return {
      totalExecutionTimeMs: 0,
      successfulAnalyzers: 0,
      failedAnalyzers: 0,
      skippedAnalyzers: 0,
      disabledAnalyzers: 0,
    };
  }

  let totalExecutionTimeMs = 0;
  let successfulAnalyzers = 0;
  let failedAnalyzers = 0;
  let skippedAnalyzers = 0;
  let disabledAnalyzers = 0;

  for (const info of executionInfo) {
    if (info.executionTimeMs !== undefined) {
      totalExecutionTimeMs += info.executionTimeMs;
    }

    switch (info.status) {
      case "success":
        successfulAnalyzers++;
        break;
      case "failed":
      case "timeout":
        failedAnalyzers++;
        break;
      case "skipped":
        skippedAnalyzers++;
        break;
      case "disabled":
        disabledAnalyzers++;
        break;
    }
  }

  return {
    totalExecutionTimeMs,
    successfulAnalyzers,
    failedAnalyzers,
    skippedAnalyzers,
    disabledAnalyzers,
  };
};

/**
 * Add critical issues for failed analyzers.
 */
const addFailedAnalyzerIssues = (
  checks: SeoCheckResult[],
  executionInfo?: ExecutionInfo[]
): SeoCheckResult[] => {
  if (!executionInfo) return checks;

  const failedChecks = executionInfo.filter(
    (info) => info.status === "failed" || info.status === "timeout"
  );

  if (failedChecks.length === 0) return checks;

  const failedAnalyzerIssues: SeoCheckResult = {
    checkId: "report-generator",
    summary: "Failed analyzer execution",
    issues: failedChecks.map((info) => ({
      id: `${info.checkId}-execution-failed`,
      title: `Analyzer ${info.checkId} failed to execute`,
      description: info.errorMessage ?? "Unknown error occurred",
      severity: "critical" as SeverityLevel,
      category: "technical" as IssueCategory,
      recommendation: "Re-run analysis or investigate analyzer error",
      weight: 10,
    })),
    passed: false,
  };

  return [...checks, failedAnalyzerIssues];
};

/**
 * Count checks by status.
 */
const countCheckStatuses = (
  checks: SeoCheckResult[]
): {
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  totalChecks: number;
} => {
  let passedChecks = 0;
  let failedChecks = 0;
  let warningChecks = 0;
  let totalChecks = 0;

  for (const check of checks) {
    totalChecks++;

    const hasCritical = check.issues.some((i) => i.severity === "critical");
    const hasWarning = check.issues.some((i) => i.severity === "warning");

    if (hasCritical) {
      failedChecks++;
    } else if (hasWarning) {
      warningChecks++;
    } else if (check.passed && check.issues.length === 0) {
      passedChecks++;
    } else if (check.passed) {
      passedChecks++;
    }
  }

  return { passedChecks, failedChecks, warningChecks, totalChecks };
};

/**
 * Generate the SEO report from analyzer outputs.
 *
 * This is the main pure function that implements RFC-008.
 */
export const generateReport = (input: ReportInput): SeoReportOutput => {
  const options: Required<NonNullable<ReportInput["options"]>> = {
    ...DEFAULT_OPTIONS,
    ...input.options,
  };

  // Sanitize input: filter out null/undefined/malformed checks
  const validInputChecks = sanitizeChecks(input.checks);

  // Add failed analyzer issues
  const checksWithFailures = addFailedAnalyzerIssues(validInputChecks, input.executionInfo);

  // Deduplicate issues
  const dedupedChecks = deduplicateAllIssues(checksWithFailures, options.dedupeStrategy);

  // Compute category scores using existing aggregateScores utility
  const scoreBreakdown = aggregateScores(dedupedChecks);

  // Apply custom category weights if provided
  let categoryScores: Record<IssueCategory, number> = { ...scoreBreakdown.byCategory };

  if (Object.keys(options.categoryWeights).length > 0) {
    const weights = options.categoryWeights;
    let weightedSum = 0;
    let totalWeight = 0;

    for (const cat of CATEGORY_ORDER) {
      const weight = weights[cat] ?? 1;
      weightedSum += categoryScores[cat] * weight;
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      const weightedOverall = Math.round(weightedSum / totalWeight);
      // Keep individual category scores as-is, only overall is weighted
      categoryScores = { ...categoryScores };
      scoreBreakdown.overall = weightedOverall;
    }
  }

  const overallScore = scoreBreakdown.overall;
  const scoreGrade = computeScoreGrade(overallScore);

  // Collect all issues
  const allIssues = dedupedChecks.flatMap((c) => c.issues);

  // Bucket issues by severity
  const buckets = bucketIssuesBySeverity(allIssues, options.includeSuccessIssues);
  const topIssuesList = computeTopIssues({ checks: dedupedChecks }, options.topIssuesLimit);

  // Extract recommendations
  const recommendations = extractRecommendations(allIssues, options.recommendationLimit);

  // Count check statuses
  const checkCounts = countCheckStatuses(dedupedChecks);

  // Compute execution summary
  const executionSummary = computeExecutionSummary(input.executionInfo);

  // Determine pass/fail
  const hasCriticalIssues = buckets.critical.length > 0;
  const passed = overallScore >= PASSED_THRESHOLD && !hasCriticalIssues;

  // Build output
  return {
    overallScore,
    scoreGrade,
    passed,
    passedThreshold: PASSED_THRESHOLD,
    categoryScores,
    criticalIssues: buckets.critical,
    highIssues: buckets.high,
    mediumIssues: buckets.medium,
    lowIssues: buckets.low,
    topIssues: topIssuesList,
    recommendations,
    passedChecks: checkCounts.passedChecks,
    failedChecks: checkCounts.failedChecks,
    warningChecks: checkCounts.warningChecks,
    totalChecks: checkCounts.totalChecks,
    analyzerResults: dedupedChecks,
    executionSummary,
    metadata: {
      ...input.metadata,
      reportVersion: REPORT_VERSION,
    },
  };
};

/**
 * Validate report input.
 */
export const validateReportInput = (input: ReportInput): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!input.metadata.propertyId) {
    errors.push("metadata.propertyId is required");
  }

  if (!input.metadata.runId) {
    errors.push("metadata.runId is required");
  }

  if (!input.metadata.engineVersion) {
    errors.push("metadata.engineVersion is required");
  }

  if (!input.metadata.generatedAt) {
    errors.push("metadata.generatedAt is required");
  }

  if (!Array.isArray(input.checks)) {
    errors.push("checks must be an array");
  }

  return { valid: errors.length === 0, errors };
};