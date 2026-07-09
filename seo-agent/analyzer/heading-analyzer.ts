/**
 * Heading Analyzer â€” pure rules.
 *
 * Every function in this file is stateless, side-effect-free, and
 * deterministic. They are designed to be unit-testable without any
 * knowledge of the plugin system, Next.js, or DOM.
 *
 * The rules object returned by `analyzeHeadings` is what the plugin adapter
 * (`heading-plugin.ts`) converts into a `SeoCheckResult`.
 */

import type { SeoIssue, ScoreBreakdown } from "../types";
import { normalize } from "../utils/text";
import {
  dedupeSeverity,
  calculateScore,
  calculateScoreBreakdown,
  mergeAnalyzerOptions,
} from "../utils/analyzer-helpers";

/* ----------------------------------------------------------------
 * Configuration
 * ---------------------------------------------------------------- */

export interface Heading {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id?: string;
  children?: Heading[];
}

export interface HeadingAnalyzerOptions {
  /** Whether H1 is required. Default: true */
  requireH1?: boolean;
  /** Maximum allowed H1 count. Default: 1 */
  maxH1Count?: number;
  /** Minimum H1 length. Default: 20 */
  minH1Length?: number;
  /** Maximum H1 length. Default: 70 */
  maxH1Length?: number;
  /** Minimum H2 count. Default: 2 */
  minH2Count?: number;
  /** Recommended H2 count. Default: 5 */
  recommendedH2Count?: number;
  /** Keywords to search for in H1 */
  targetKeywords?: string[];
  /** City name for keyword matching */
  city?: string;
  /** Locality name for keyword matching */
  locality?: string;
  /** Property type for keyword matching */
  propertyType?: string;
  /** Whether keyword in H1 is required. Default: true */
  requireKeywordInH1?: boolean;
  /** Whether duplicate headings are allowed. Default: false */
  allowDuplicateHeadings?: boolean;
  /** Minimum heading length to be considered meaningful. Default: 5 */
  minHeadingLength?: number;
}

type RequiredAnalyzerOptions = Required<HeadingAnalyzerOptions>;

const defaults: RequiredAnalyzerOptions = {
  requireH1: true,
  maxH1Count: 1,
  minH1Length: 20,
  maxH1Length: 70,
  minH2Count: 2,
  recommendedH2Count: 5,
  targetKeywords: [],
  city: "",
  locality: "",
  propertyType: "",
  requireKeywordInH1: true,
  allowDuplicateHeadings: false,
  minHeadingLength: 5,
};

const GENERIC_TERMS = new Set([
  "section",
  "info",
  "details",
  "features",
  "click",
  "more",
  "content",
  "page",
  "here",
  "link",
]);

/* ----------------------------------------------------------------
 * Public API â€” analyze headings
 * ---------------------------------------------------------------- */

export interface HeadingAnalysis {
  headings: Heading[] | undefined;
  totalHeadings: number;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  h4Count: number;
  h5Count: number;
  h6Count: number;
  hasH1: boolean;
  h1Text: string | undefined;
  h1Length: number;
  hasKeywordInH1: boolean;
  hasDuplicateHeadings: boolean;
  duplicateHeadingTexts: string[];
  skippedLevels: number[];
  emptyHeadings: number;
  averageHeadingLength: number;
  passed: boolean;
  score: number;
  scoreBreakdown?: ScoreBreakdown;
  issues: SeoIssue[];
}

/**
 * Flatten nested heading structure to sequential array
 */
const flattenHeadings = (headings: Heading[]): Heading[] => {
  const result: Heading[] = [];
  for (const heading of headings) {
    result.push(heading);
    if (heading.children && heading.children.length > 0) {
      result.push(...flattenHeadings(heading.children));
    }
  }
  return result;
};

/**
 * Analyze heading structure against configurable SEO rules.
 */
export const analyzeHeadings = (
  headings: Heading[] | undefined,
  opts: HeadingAnalyzerOptions = {}
): HeadingAnalysis => {
  const options = mergeOptions(opts);

  // Handle null/undefined/non-array input
  if (!headings || !Array.isArray(headings)) {
    const issues: SeoIssue[] = [missingH1Issue()];
    const score = calculateScore(issues, false);
    const scoreBreakdown = calculateScoreBreakdown(issues);
    return finalize(
      headings,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      false,
      undefined,
      0,
      false,
      false,
      [],
      [],
      0,
      0,
      issues,
      false,
      score,
      scoreBreakdown
    );
  }

  // Flatten nested structure
  const flatHeadings = flattenHeadings(headings);
  const totalHeadings = flatHeadings.length;

  // Count headings by level
  const h1Headings = flatHeadings.filter((h) => h.level === 1);
  const h2Headings = flatHeadings.filter((h) => h.level === 2);
  const h3Headings = flatHeadings.filter((h) => h.level === 3);
  const h4Headings = flatHeadings.filter((h) => h.level === 4);
  const h5Headings = flatHeadings.filter((h) => h.level === 5);
  const h6Headings = flatHeadings.filter((h) => h.level === 6);

  const h1Count = h1Headings.length;
  const h2Count = h2Headings.length;
  const h3Count = h3Headings.length;
  const h4Count = h4Headings.length;
  const h5Count = h5Headings.length;
  const h6Count = h6Headings.length;

  const hasH1 = h1Count > 0;
  const h1Text = h1Count > 0 ? h1Headings[0].text : undefined;
  const h1Length = h1Text ? h1Text.length : 0;

  const issues: SeoIssue[] = [];

  // HDG-001: Exactly One H1 Exists
  const h1Check = checkH1Exists(h1Count, options);
  issues.push(h1Check);

  // HDG-002: H1 Is Not Empty
  if (h1Text !== undefined) {
    const h1EmptyCheck = checkH1NotEmpty(h1Text);
    issues.push(h1EmptyCheck);
  }

  // HDG-003: H1 Length Is Within Recommended Range
  if (h1Text !== undefined && h1Text.trim().length > 0) {
    const h1LengthCheck = checkH1Length(h1Text, options);
    issues.push(h1LengthCheck);
  }

  // HDG-004: Primary Keyword Appears in H1
  if (h1Text !== undefined && h1Text.trim().length > 0) {
    const keywordCheck = checkH1Keywords(h1Text, options);
    issues.push(keywordCheck);
  }

  // HDG-005 & HDG-006: Heading Hierarchy and Skipped Levels
  const hierarchyCheck = checkHierarchy(flatHeadings);
  issues.push(...hierarchyCheck);

  // HDG-007: No Duplicate Headings
  const duplicateCheck = checkDuplicates(flatHeadings, options);
  issues.push(duplicateCheck);

  // HDG-008: Heading Text Is Meaningful
  const meaningfulCheck = checkMeaningfulText(flatHeadings, options);
  issues.push(...meaningfulCheck);

  // HDG-009: Recommended Number of H2 Headings
  const h2Check = checkH2Count(h2Count, options);
  issues.push(h2Check);

  // HDG-010: No Empty Headings
  const emptyCheck = checkEmptyHeadings(flatHeadings);
  issues.push(emptyCheck);

  // Calculate metadata
  const hasKeywordInH1 =
    h1Text !== undefined &&
    issues.some(
      (i) => i.id === "HDG-004" && i.severity === "success"
    );

  const hasDuplicateHeadings =
    issues.some(
      (i) => i.id === "HDG-007" && i.severity !== "success"
    );

  const duplicateHeadingTexts = getDuplicateHeadingTexts(flatHeadings);

  const skippedLevels = getSkippedLevels(flatHeadings);

  const emptyHeadings = flatHeadings.filter(
    (h) => !h.text || h.text.trim().length === 0
  ).length;

  const averageHeadingLength =
    flatHeadings.length > 0
      ? Math.round(
          flatHeadings.reduce((sum, h) => sum + (h.text?.length || 0), 0) /
            flatHeadings.length
        )
      : 0;

  // Passed = no issues with severity > "info"
  const passed = !issues.some(
    (i) => i.severity === "critical" || i.severity === "warning"
  );

  // Calculate numeric score
  const score = calculateScore(issues, passed);

  // Calculate score breakdown
  const scoreBreakdown = calculateScoreBreakdown(issues);

  return finalize(
    headings,
    totalHeadings,
    h1Count,
    h2Count,
    h3Count,
    h4Count,
    h5Count,
    h6Count,
    hasH1,
    h1Text,
    h1Length,
    hasKeywordInH1,
    hasDuplicateHeadings,
    duplicateHeadingTexts,
    skippedLevels,
    emptyHeadings,
    averageHeadingLength,
    issues,
    passed,
    score,
    scoreBreakdown
  );
};

/* ----------------------------------------------------------------
 * Internals â€” each rule as a pure function
 * ---------------------------------------------------------------- */

const missingH1Issue = (): SeoIssue => ({
  id: "HDG-001",
  title: "H1 heading is missing",
  description:
    "No H1 heading was found on the page. The H1 is the primary heading and is critical for SEO and accessibility.",
  severity: "critical",
  category: "headings",
  recommendation:
    "Add exactly one H1 heading to the page that describes the main content.",
  weight: 10,
});

const multipleH1Issue = (count: number): SeoIssue => ({
  id: "HDG-001",
  title: "Multiple H1 headings found",
  description:
    `Found ${count} H1 headings. Multiple H1s confuse search engines and screen readers.`,
  severity: "critical",
  category: "headings",
  recommendation:
    "Use exactly one H1 heading. Convert additional H1s to H2 or lower.",
  currentValue: count,
  expectedValue: 1,
  weight: 10,
});

const h1SuccessIssue = (): SeoIssue => ({
  id: "HDG-001",
  title: "Exactly one H1 heading found",
  description:
    "The page has exactly one H1 heading, which is optimal for SEO and accessibility.",
  severity: "success",
  category: "headings",
  weight: 0,
});

const checkH1Exists = (
  h1Count: number,
  options: RequiredAnalyzerOptions
): SeoIssue => {
  if (!options.requireH1 && h1Count === 0) {
    return {
      id: "HDG-001",
      title: "H1 not required",
      description: "H1 requirement is disabled for this analysis.",
      severity: "info",
      category: "headings",
      weight: 0,
    };
  }

  if (h1Count === 0) {
    return missingH1Issue();
  }

  if (h1Count > options.maxH1Count) {
    return multipleH1Issue(h1Count);
  }

  return h1SuccessIssue();
};

const checkH1NotEmpty = (h1Text: string): SeoIssue => {
  const trimmed = h1Text.trim();

  if (trimmed.length === 0) {
    return {
      id: "HDG-002",
      title: "H1 heading is empty",
      description:
        "The H1 heading exists but contains only whitespace. Empty headings provide no SEO or accessibility value.",
      severity: "critical",
      category: "headings",
      recommendation: "Add descriptive text to the H1 heading.",
      weight: 10,
    };
  }

  return {
    id: "HDG-002",
    title: "H1 heading is not empty",
    description: "The H1 heading contains meaningful text.",
    severity: "success",
    category: "headings",
    weight: 0,
  };
};

const checkH1Length = (
  h1Text: string,
  options: RequiredAnalyzerOptions
): SeoIssue => {
  const length = h1Text.length;
  const min = options.minH1Length;
  const max = options.maxH1Length;

  if (length < min) {
    return {
      id: "HDG-003",
      title: "H1 heading is too short",
      description:
        `The H1 is ${length} characters. Headings shorter than ${min} characters lack context.`,
      severity: "warning",
      category: "headings",
      recommendation: `Expand H1 to ${min}-${max} characters while keeping keywords at the start.`,
      currentValue: length,
      expectedValue: min,
      weight: 8,
    };
  }

  if (length > max) {
    return {
      id: "HDG-003",
      title: "H1 heading is too long",
      description:
        `The H1 is ${length} characters. Headings longer than ${max} characters are truncated in SERPs.`,
      severity: "warning",
      category: "headings",
      recommendation: `Shorten H1 to ${min}-${max} characters while keeping key information at the start.`,
      currentValue: length,
      expectedValue: max,
      weight: 8,
    };
  }

  return {
    id: "HDG-003",
    title: "H1 length is optimal",
    description:
      `The H1 is ${length} characters, which falls inside the optimal range (${min}-${max} characters).`,
    severity: "success",
    category: "headings",
    weight: 0,
  };
};

const checkH1Keywords = (
  h1Text: string,
  options: RequiredAnalyzerOptions
): SeoIssue => {
  if (!options.requireKeywordInH1) {
    return {
      id: "HDG-004",
      title: "Keyword check disabled",
      description: "Keyword presence in H1 is not required for this analysis.",
      severity: "info",
      category: "headings",
      weight: 0,
    };
  }

  const keywords = options.targetKeywords.filter((k) => k && k.trim().length > 0);
  const lowerH1 = h1Text.toLowerCase();

  // Build keyword list from options
  const allKeywords: string[] = [...keywords];
  if (options.city && options.city.trim().length > 0) {
    allKeywords.push(options.city);
  }
  if (options.locality && options.locality.trim().length > 0) {
    allKeywords.push(options.locality);
  }
  if (options.propertyType && options.propertyType.trim().length > 0) {
    allKeywords.push(options.propertyType);
  }

  if (allKeywords.length === 0) {
    return {
      id: "HDG-004",
      title: "No keywords configured",
      description: "No target keywords, city, locality, or property type provided.",
      severity: "info",
      category: "headings",
      weight: 0,
    };
  }

  const foundKeywords = allKeywords.filter((kw) =>
    lowerH1.includes(kw.toLowerCase())
  );

  if (foundKeywords.length > 0) {
    return {
      id: "HDG-004",
      title: "Primary keyword found in H1",
      description:
        `The H1 contains: ${foundKeywords.join(", ")}.`,
      severity: "success",
      category: "headings",
      weight: 0,
    };
  }

  return {
    id: "HDG-004",
    title: "Primary keyword missing in H1",
    description:
      `The H1 does not contain any target keywords (${allKeywords.join(", ")}). Including keywords improves SEO relevance.`,
    severity: "warning",
    category: "headings",
    recommendation: `Include at least one target keyword in the H1 heading.`,
    weight: 6,
  };
};

const checkHierarchy = (headings: Heading[]): SeoIssue[] => {
  const issues: SeoIssue[] = [];

  if (headings.length === 0) {
    return issues;
  }

  // HDG-005: Check for proper hierarchy (first heading should be H1)
  const firstHeading = headings[0];
  if (firstHeading.level !== 1) {
    issues.push({
      id: "HDG-005",
      title: "Heading hierarchy starts incorrectly",
      description:
        `The first heading is H${firstHeading.level}. Documents should start with H1.`,
      severity: "warning",
      category: "headings",
      recommendation: "Start the document with an H1 heading.",
      weight: 6,
    });
  } else {
    issues.push({
      id: "HDG-005",
      title: "Heading hierarchy is valid",
      description: "The document starts with H1 and follows proper hierarchy.",
      severity: "success",
      category: "headings",
      weight: 0,
    });
  }

  // HDG-006: Check for skipped levels
  const skippedTransitions: Array<{ from: number; to: number }> = [];
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1].level;
    const curr = headings[i].level;
    const diff = curr - prev;

    // Going down more than 1 level is a skip (e.g., H1 â†’ H3)
    if (diff > 1) {
      skippedTransitions.push({ from: prev, to: curr });
    }
  }

  if (skippedTransitions.length > 0) {
    const examples = skippedTransitions
      .slice(0, 3)
      .map((t) => `H${t.from} â†’ H${t.to}`)
      .join(", ");
    issues.push({
      id: "HDG-006",
      title: "Skipped heading levels detected",
      description:
        `Found ${skippedTransitions.length} skipped level(s): ${examples}. Skipped levels break document outline.`,
      severity: "warning",
      category: "headings",
      recommendation:
        "Use sequential heading levels. Go from H1 to H2, H2 to H3, etc.",
      weight: 6,
    });
  } else {
    issues.push({
      id: "HDG-006",
      title: "No skipped heading levels",
      description: "All heading transitions are sequential (no skipped levels).",
      severity: "success",
      category: "headings",
      weight: 0,
    });
  }

  return issues;
};

const getDuplicateHeadingTexts = (headings: Heading[]): string[] => {
  const textCounts = new Map<string, number>();
  for (const h of headings) {
    if (!h.text || h.text.trim().length === 0) continue;
    const normalized = normalize(h.text);
    textCounts.set(normalized, (textCounts.get(normalized) || 0) + 1);
  }

  const duplicates: string[] = [];
  for (const [text, count] of textCounts.entries()) {
    if (count > 1) {
      duplicates.push(text);
    }
  }
  return duplicates;
};

const checkDuplicates = (
  headings: Heading[],
  options: RequiredAnalyzerOptions
): SeoIssue => {
  if (options.allowDuplicateHeadings) {
    return {
      id: "HDG-007",
      title: "Duplicate check disabled",
      description: "Duplicate heading detection is disabled for this analysis.",
      severity: "info",
      category: "headings",
      weight: 0,
    };
  }

  const duplicates = getDuplicateHeadingTexts(headings);

  if (duplicates.length === 0) {
    return {
      id: "HDG-007",
      title: "No duplicate headings",
      description: "All headings have unique text.",
      severity: "success",
      category: "headings",
      weight: 0,
    };
  }

  return {
    id: "HDG-007",
    title: "Duplicate headings detected",
    description:
      `Found ${duplicates.length} duplicate heading text(s): "${duplicates.slice(0, 3).join('", "')}"${duplicates.length > 3 ? "..." : ""}.`,
    severity: "info",
    category: "headings",
    recommendation: "Make each heading unique to improve content structure.",
    weight: 4,
  };
};

const checkMeaningfulText = (
  headings: Heading[],
  options: RequiredAnalyzerOptions
): SeoIssue[] => {
  const issues: SeoIssue[] = [];
  const meaninglessHeadings: Array<{ level: number; text: string }> = [];

  for (const h of headings) {
    if (!h.text || h.text.trim().length === 0) continue;

    const text = h.text.trim();
    const isTooShort = text.length < options.minHeadingLength;
    const isGeneric = GENERIC_TERMS.has(normalize(text));

    if (isTooShort || isGeneric) {
      meaninglessHeadings.push({ level: h.level, text });
    }
  }

  if (meaninglessHeadings.length === 0) {
    issues.push({
      id: "HDG-008",
      title: "All headings are meaningful",
      description: "All headings are descriptive and provide context.",
      severity: "success",
      category: "headings",
      weight: 0,
    });
  } else {
    const examples = meaninglessHeadings
      .slice(0, 3)
      .map((h) => `H${h.level}: "${h.text}"`)
      .join(", ");
    issues.push({
      id: "HDG-008",
      title: "Generic or short headings detected",
      description:
        `Found ${meaninglessHeadings.length} heading(s) that are too short or generic: ${examples}.`,
      severity: "info",
      category: "headings",
      recommendation:
        "Use specific, descriptive headings instead of generic terms like 'Section' or 'Info'.",
      weight: 4,
    });
  }

  return issues;
};

const checkH2Count = (
  h2Count: number,
  options: RequiredAnalyzerOptions
): SeoIssue => {
  const min = options.minH2Count;
  const recommended = options.recommendedH2Count;

  if (h2Count >= recommended) {
    return {
      id: "HDG-009",
      title: "Adequate H2 headings",
      description:
        `Found ${h2Count} H2 headings, meeting the recommended count of ${recommended}.`,
      severity: "success",
      category: "headings",
      weight: 0,
    };
  }

  if (h2Count >= min) {
    return {
      id: "HDG-009",
      title: "Below recommended H2 count",
      description:
        `Found ${h2Count} H2 headings. Recommended: ${recommended}+. Consider adding more sections.`,
      severity: "info",
      category: "headings",
      recommendation: `Add more H2 headings to break content into sections (recommended: ${recommended}+).`,
      weight: 4,
    };
  }

  return {
    id: "HDG-009",
    title: "Too few H2 headings",
    description:
      `Found ${h2Count} H2 headings. Minimum recommended: ${min}.`,
    severity: "info",
    category: "headings",
    recommendation: `Add more H2 headings to break content into sections (minimum: ${min}, recommended: ${recommended}+).`,
    weight: 4,
  };
};

const checkEmptyHeadings = (headings: Heading[]): SeoIssue => {
  const emptyHeadings = headings.filter(
    (h) => !h.text || h.text.trim().length === 0
  );

  if (emptyHeadings.length === 0) {
    return {
      id: "HDG-010",
      title: "No empty headings",
      description: "All headings contain text.",
      severity: "success",
      category: "headings",
      weight: 0,
    };
  }

  return {
    id: "HDG-010",
    title: "Empty headings detected",
    description:
      `Found ${emptyHeadings.length} empty heading(s). Empty headings create gaps in document structure.`,
    severity: "warning",
    category: "headings",
    recommendation: "Remove empty headings or add descriptive text.",
    weight: 6,
  };
};

const getSkippedLevels = (headings: Heading[]): number[] => {
  const skipped: number[] = [];
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1].level;
    const curr = headings[i].level;
    if (curr - prev > 1) {
      // Record the skipped levels (e.g., H1 â†’ H3 skips level 2)
      for (let level = prev + 1; level < curr; level++) {
        if (!skipped.includes(level)) {
          skipped.push(level);
        }
      }
    }
  }
  return skipped;
};

/* ----------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------- */

function mergeOptions(opts: HeadingAnalyzerOptions): RequiredAnalyzerOptions {
  return mergeAnalyzerOptions(opts, defaults);
}

function finalize(
  headings: Heading[] | undefined,
  totalHeadings: number,
  h1Count: number,
  h2Count: number,
  h3Count: number,
  h4Count: number,
  h5Count: number,
  h6Count: number,
  hasH1: boolean,
  h1Text: string | undefined,
  h1Length: number,
  hasKeywordInH1: boolean,
  hasDuplicateHeadings: boolean,
  duplicateHeadingTexts: string[],
  skippedLevels: number[],
  emptyHeadings: number,
  averageHeadingLength: number,
  issues: SeoIssue[],
  passed: boolean,
  score: number,
  scoreBreakdown: ScoreBreakdown | undefined
): HeadingAnalysis {
  return {
    headings,
    totalHeadings,
    h1Count,
    h2Count,
    h3Count,
    h4Count,
    h5Count,
    h6Count,
    hasH1,
    h1Text,
    h1Length,
    hasKeywordInH1,
    hasDuplicateHeadings,
    duplicateHeadingTexts,
    skippedLevels,
    emptyHeadings,
    averageHeadingLength,
    passed,
    score,
    scoreBreakdown,
    issues: dedupeSeverity(issues),
  };
}
