/**
 * Scoring utilities.
 *
 * Each analyzer returns its own SeoCheckResult. The orchestrator
 * (analyzer/index) calls `aggregateScores` to build a single overall score.
 *
 * Pure functions only. No external dependencies.
 */

import type {
  AnalysisResult,
  IssueCategory,
  SeverityLevel,
  SeoCheckResult,
  SeoIssue,
  ScoreBreakdown,
} from "../types";

const severityWeight: Record<SeverityLevel, number> = {
  critical: 10,
  warning: 5,
  info: 1,
  success: 0,
};

/**
 * Compute a single check's score (0–100) from its issues.
 * 100 means no issues; deductions weighted by severity.
 */
export const scoreCheck = (issues: SeoIssue[]): number => {
  if (!issues.length) return 100;
  const penalty = issues.reduce((acc, issue) => {
    const w = issue.weight ?? severityWeight[issue.severity];
    return acc + w;
  }, 0);
  return Math.max(0, 100 - penalty);
};

/**
 * Aggregate multiple checks into an overall ScoreBreakdown.
 *
 * For each issue category, we accumulate the per-issue penalty (so a category
 * with many critical issues scores lower than one with no issues), then
 * convert to a 0–100 score per category.
 */
export const aggregateScores = (
  checks: SeoCheckResult[]
): ScoreBreakdown => {
  const categoryPenalty: Record<IssueCategory, number> = {
    meta: 0,
    headings: 0,
    content: 0,
    performance: 0,
    accessibility: 0,
    mobile: 0,
    "structured-data": 0,
    links: 0,
    images: 0,
    keywords: 0,
    technical: 0,
  };
  const categoryCounts: Record<IssueCategory, number> = {
    meta: 0,
    headings: 0,
    content: 0,
    performance: 0,
    accessibility: 0,
    mobile: 0,
    "structured-data": 0,
    links: 0,
    images: 0,
    keywords: 0,
    technical: 0,
  };

  let totalScore = 0;
  let passed = 0;
  let failed = 0;
  let warnings = 0;
  let passedChecks = 0;

  for (const check of checks) {
    const s = scoreCheck(check.issues);
    totalScore += s;
    passedChecks += check.passed ? 1 : 0;

    for (const issue of check.issues) {
      const w = issue.weight ?? severityWeight[issue.severity];
      categoryPenalty[issue.category] += w;
      categoryCounts[issue.category]++;
      if (issue.severity === "success") passed++;
      else if (issue.severity === "warning") warnings++;
      else failed++;
    }
  }

  const averageByCategory = (cat: IssueCategory): number => {
    if (categoryCounts[cat] === 0) return 100;
    const avgPenalty = categoryPenalty[cat] / categoryCounts[cat];
    return Math.max(0, Math.round(100 - avgPenalty));
  };

  const finalByCategory: Record<IssueCategory, number> = {
    meta: averageByCategory("meta"),
    headings: averageByCategory("headings"),
    content: averageByCategory("content"),
    performance: averageByCategory("performance"),
    accessibility: averageByCategory("accessibility"),
    mobile: averageByCategory("mobile"),
    "structured-data": averageByCategory("structured-data"),
    links: averageByCategory("links"),
    images: averageByCategory("images"),
    keywords: averageByCategory("keywords"),
    technical: averageByCategory("technical"),
  };

  return {
    overall: checks.length ? Math.round(totalScore / checks.length) : 100,
    byCategory: finalByCategory,
    passed,
    failed,
    warnings,
    passedChecks,
    totalChecks: checks.length,
  };
};

/**
 * Pick the top N most important issues.
 * Sort: critical > warning > info > success. Use weight as tiebreaker.
 */
export const topIssues = (
  result: AnalysisResult | { checks: SeoCheckResult[] },
  n = 10
): SeoIssue[] => {
  const all = result.checks.flatMap((c) => c.issues);
  return [...all]
    .sort((a, b) => {
      const order: SeverityLevel[] = [
        "critical",
        "warning",
        "info",
        "success",
      ];
      if (a.severity !== b.severity) {
        return order.indexOf(a.severity) - order.indexOf(b.severity);
      }
      return (b.weight ?? 0) - (a.weight ?? 0);
    })
    .slice(0, n);
};
