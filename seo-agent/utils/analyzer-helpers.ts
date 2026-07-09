/**
 * Analyzer helpers — shared utilities reused by every analyzer.
 *
 * Prior to this module each analyzer duplicated these pure helpers
 * verbatim (~100 lines per file). Centralising them removes the
 * divergence risk: scoring constants and the dedupe/hash behaviour
 * now live in one audited place.
 *
 * Behaviour is byte-identical to the previously-duplicated copies
 * so all existing analyzer unit tests continue to pass.
 *
 * Pure functions only. No external dependencies. Framework-agnostic.
 */

import type { SeoIssue, ScoreBreakdown } from "../types";

/**
 * Severity order used when the same issue id recurs and we need to keep
 * the highest-severity variant. Higher = more severe.
 */
const severityOrder: Record<string, number> = {
  critical: 3,
  warning: 2,
  info: 1,
  success: 0,
};

/**
 * Per-severity penalty used by `calculateScore` and
 * `calculateScoreBreakdown`. These match the constants that every
 * analyzer previously duplicated (critical=25, warning=10, info=2,
 * success=0; an unknown severity falls back to 5).
 */
const severityPenalty: Record<string, number> = {
  critical: 25,
  warning: 10,
  info: 2,
  success: 0,
};

/**
 * Default score for every IssueCategory before any deductions. Keeping
 * the canonical list in one place prevents new categories from being
 * silently dropped by an analyzer.
 */
const initialCategoryScores: Record<string, number> = {
  meta: 100,
  headings: 100,
  content: 100,
  performance: 100,
  accessibility: 100,
  mobile: 100,
  "structured-data": 100,
  links: 100,
  images: 100,
  keywords: 100,
  technical: 100,
};

/**
 * If the same issue id appears multiple times, keep only the
 * highest-severity variant. Stable on insertion order otherwise.
 *
 * This is the exact behaviour every analyzer implemented locally
 * under the name `dedupeSeverity`.
 */
export const dedupeSeverity = (issues: SeoIssue[]): SeoIssue[] => {
  const map = new Map<string, SeoIssue[]>();
  for (const issue of issues) {
    const list = map.get(issue.id) ?? [];
    list.push(issue);
    map.set(issue.id, list);
  }

  const result: SeoIssue[] = [];
  for (const list of map.values()) {
    if (list.length === 1) {
      result.push(list[0]);
      continue;
    }
    const best = list.reduce((prev, curr) =>
      (severityOrder[curr.severity] ?? 0) > (severityOrder[prev.severity] ?? 0)
        ? curr
        : prev
    );
    result.push(best);
  }
  return result;
};

/**
 * Calculate a numeric score (0-100) from a list of issues.
 * 100 = perfect (no issues or `passed` explicitly). Otherwise penalties
 * are summed per severity (critical=25, warning=10, info=2, success=0),
 * with an unknown severity contributing 5.
 *
 * The `passed` parameter is kept for behavioural parity with the
 * previous per-analyzer copies: a caller that already knows the analyzer
 * "passed" can short-circuit and return 100 directly.
 */
export const calculateScore = (issues: SeoIssue[], passed: boolean): number => {
  if (passed) return 100;

  let penalty = 0;
  for (const issue of issues) {
    penalty += severityPenalty[issue.severity] ?? 5;
  }

  return Math.max(0, 100 - penalty);
};

/**
 * Calculate a per-category score breakdown.
 *
 * Every category starts at 100; each issue deducts its severity
 * penalty from the category it belongs to (clamped at 0).
 *
 * The returned `overall` field calls `calculateScore` with
 * `passed = false` so the breakdown reflects the actual issue set
 * rather than the caller's early-return decision.
 */
export const calculateScoreBreakdown = (issues: SeoIssue[]): ScoreBreakdown => {
  const categoryScores: Record<string, number> = { ...initialCategoryScores };

  for (const issue of issues) {
    const penalty = severityPenalty[issue.severity] ?? 5;
    const current = categoryScores[issue.category] ?? 100;
    categoryScores[issue.category] = Math.max(0, current - penalty);
  }

  const byCategory: Record<string, number> = {};
  for (const cat of Object.keys(categoryScores)) {
    byCategory[cat] = categoryScores[cat];
  }

  return {
    overall: calculateScore(issues, false),
    byCategory: byCategory as ScoreBreakdown["byCategory"],
    passed: issues.filter((i) => i.severity === "success").length,
    failed: issues.filter((i) => i.severity === "critical").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
    passedChecks: issues.length,
    totalChecks: issues.length,
  };
};

/**
 * Simple non-cryptographic string hash used for duplicate-title /
 * duplicate-description detection.
 *
 * In production callers needing a collision-resistant hash should
 * supply a SHA-256 (or equivalent) based duplicate store; this helper
 * is intentionally dependency-free and good enough for in-process
 * dedup across reasonable input sizes.
 */
export const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

/**
 * Generic option-merging helper used by every analyzer's local
 * `mergeOptions`. Given a user-provided partial options object and a
 * fully-populated defaults object, returns a new object where each
 * field is either the user-supplied value (when defined) or the
 * corresponding default.
 *
 * Arrays from `defaults` are shallow-copied so callers cannot mutate
 * the shared defaults object by reference.
 *
 * Type parameter `T` is the analyzer's full options interface; callers
 * pass `Defaults<T>` so the result is fully typed without casting.
 */
export const mergeAnalyzerOptions = <T extends object>(
  opts: Partial<T>,
  defaults: T
): T => {
  const result = {} as T;
  for (const key of Object.keys(defaults) as Array<keyof T>) {
    const userValue = opts[key];
    if (userValue !== undefined) {
      result[key] = userValue;
    } else {
      const defaultValue = defaults[key];
      if (Array.isArray(defaultValue)) {
        result[key] = [...(defaultValue as unknown[])] as unknown as T[keyof T];
      } else {
        result[key] = defaultValue;
      }
    }
  }
  return result;
};
