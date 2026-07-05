/**
 * Meta Description Analyzer — pure rules.
 *
 * Every function in this file is stateless, side-effect-free, and
 * deterministic. They are designed to be unit-testable without any
 * knowledge of the plugin system, Next.js, or DOM.
 *
 * The rules object returned by `analyzeDescription` is what the plugin adapter
 * (`meta-description-plugin.ts`) converts into a `SeoCheckResult`.
 */

import type { SeoIssue, ScoreBreakdown } from "../types";
import { slugify } from "../utils/text";

/* ----------------------------------------------------------------
 * Configuration
 * ---------------------------------------------------------------- */

export interface MetaDescriptionAnalyzerOptions {
  /** Minimum acceptable length. Default: 140. */
  minLength?: number;
  /** Maximum acceptable length. Default: 160. */
  maxLength?: number;
  /** Ideal target length. Default: 150. */
  idealLength?: number;
  /** Keywords that should appear in the description. */
  targetKeywords?: string[];
  /** City name for location check. */
  city?: string;
  /** Locality/neighborhood name for location check. */
  locality?: string;
  /** Property type (e.g., "3BHK", "Apartment"). */
  propertyType?: string;
  /** Whether location mention is required. Default: true. */
  requireLocation?: boolean;
  /** Whether property type mention is required. Default: true. */
  requirePropertyType?: boolean;
  /** Optional store for duplicate description detection (future-proof). */
  duplicateDescriptionStore?: DuplicateDescriptionStore;
}

type RequiredAnalyzerOptions = Omit<Required<MetaDescriptionAnalyzerOptions>, "duplicateDescriptionStore" | "city" | "locality" | "propertyType"> & {
  duplicateDescriptionStore?: DuplicateDescriptionStore;
  city?: string;
  locality?: string;
  propertyType?: string;
};

const defaults: RequiredAnalyzerOptions = {
  minLength: 140,
  maxLength: 160,
  idealLength: 150,
  targetKeywords: [],
  city: undefined,
  locality: undefined,
  propertyType: undefined,
  requireLocation: true,
  requirePropertyType: true,
  duplicateDescriptionStore: undefined,
};

/* ----------------------------------------------------------------
 * Public API — analyze a single meta description string
 * ---------------------------------------------------------------- */

export interface MetaDescriptionAnalysis {
  description: string;
  descriptionLength: number;
  /** true only when description is non-empty and no rule flagged it as critical/warning. */
  passed: boolean;
  /** Numeric score 0-100. */
  score: number;
  /** Breakdown by category. */
  scoreBreakdown?: ScoreBreakdown;
  issues: SeoIssue[];
  /** Whether city or locality was found. */
  hasLocation: boolean;
  /** Whether property type was found. */
  hasPropertyType: boolean;
  /** Which target keywords were found. */
  foundKeywords: string[];
  /** Which target keywords were missing. */
  missingKeywords: string[];
  /** Duplicate description detection results. */
  isDuplicate: boolean;
  duplicateEntries: DuplicateDescriptionEntry[];
}

/**
 * Analyze one meta description against configurable SEO rules.
 */
export const analyzeDescription = (
  description: string | undefined,
  opts: MetaDescriptionAnalyzerOptions = {}
): MetaDescriptionAnalysis => {
  const options = mergeOptions(opts);
  const normalizedDescription = (description ?? "").trim();
  const descriptionLength = normalizedDescription.length;

  const issues: SeoIssue[] = [];

  // MD-001: Missing
  if (description === undefined) {
    issues.push(descriptionMissingIssue());
    return finalize("", 0, issues, false, 0, undefined, false, false, [], [], false, []);
  }

  // MD-002: Empty
  if (descriptionLength === 0) {
    issues.push(descriptionEmptyIssue());
    return finalize("", 0, issues, false, 0, undefined, false, false, [], [], false, []);
  }

  // MD-003: Length check
  const lenCheck = checkLength(normalizedDescription, descriptionLength, options);
  issues.push(lenCheck);

  // MD-004: Keyword presence
  const { found, missing, keywordIssues } = checkKeywords(
    normalizedDescription,
    options
  );
  issues.push(...keywordIssues);

  // MD-005: Location check
  const locationCheck = checkLocation(normalizedDescription, options);
  issues.push(locationCheck);

  // MD-006: Property type check
  const propertyTypeCheck = checkPropertyType(normalizedDescription, options);
  issues.push(propertyTypeCheck);

  // MD-007: Duplicate detection
  let isDuplicate = false;
  let duplicateEntries: DuplicateDescriptionEntry[] = [];
  if (options.duplicateDescriptionStore) {
    const hash = simpleHash(normalizedDescription);
    const entries = options.duplicateDescriptionStore.find(hash);
    isDuplicate = entries.length > 0;
    duplicateEntries = entries;
    issues.push(duplicateIssue(isDuplicate, entries));
  } else {
    issues.push(duplicateDetectionNotEnabledIssue());
  }

  // MD-008: Excessive punctuation
  const punctuationCheck = checkExcessivePunctuation(normalizedDescription);
  issues.push(punctuationCheck);

  // MD-009: ALL CAPS check
  const capsCheck = checkAllCaps(normalizedDescription);
  issues.push(capsCheck);

  // MD-010: Repeated words
  const repeatedWordsCheck = checkRepeatedWords(normalizedDescription);
  issues.push(repeatedWordsCheck);

  // Passed = no issues with severity > "info"
  const passed = !issues.some(
    (i) => i.severity === "critical" || i.severity === "warning"
  );

  // Calculate numeric score
  const score = calculateScore(issues, passed);

  // Calculate score breakdown
  const scoreBreakdown = calculateScoreBreakdown(issues);

  const hasLocation = options.requireLocation ? !issues.some(i => i.id === "MD-005" && i.severity === "warning") : false;
  const hasPropertyType = options.requirePropertyType && !!options.propertyType ? !issues.some(i => i.id === "MD-006" && i.severity === "warning") : false;

  return finalize(
    normalizedDescription,
    descriptionLength,
    issues,
    passed,
    score,
    scoreBreakdown,
    hasLocation,
    hasPropertyType,
    found,
    missing,
    isDuplicate,
    duplicateEntries
  );
};

/* ----------------------------------------------------------------
 * Internals — each rule as a pure function
 * ---------------------------------------------------------------- */

const descriptionMissingIssue = (): SeoIssue => ({
  id: "MD-001",
  title: "Meta description is missing",
  description:
    "The `<meta name=\"description\">` tag is absent. Search engines use it as the default snippet in SERPs.",
  severity: "critical",
  category: "meta",
  recommendation: "Add a `<meta name=\"description\">` element with a compelling 140–160 character summary.",
  weight: 10,
});

const descriptionEmptyIssue = (): SeoIssue => ({
  id: "MD-002",
  title: "Meta description is empty",
  description:
    "The `<meta name=\"description\">` tag exists but contains only whitespace. It will be ignored by search engines.",
  severity: "critical",
  category: "meta",
  recommendation: "Populate the meta description with meaningful, keyword-rich content.",
  weight: 10,
});

const checkLength = (
  _description: string,
  len: number,
  opts: RequiredAnalyzerOptions
): SeoIssue => {
  const min = opts.minLength;
  const max = opts.maxLength;

  if (len < min) {
    return {
      id: "MD-003",
      title: "Meta description is too short",
      description: `The description is ${len} characters. Search engines often truncate or rewrite descriptions shorter than ${min} characters.`,
      severity: "warning",
      category: "meta",
      recommendation: `Aim for ${min}–${max} characters to maximize SERP visibility.`,
      currentValue: len,
      expectedValue: opts.idealLength,
      weight: 8,
    };
  }

  if (len > max) {
    return {
      id: "MD-003",
      title: "Meta description is too long",
      description: `The description is ${len} characters (max recommended: ${max}). Long descriptions are truncated in SERPs, hiding important information.`,
      severity: "warning",
      category: "meta",
      recommendation: `Shorten to ${min}–${max} characters while keeping key information at the start.`,
      currentValue: len,
      expectedValue: opts.idealLength,
      weight: 8,
    };
  }

  return {
    id: "MD-003",
    title: "Meta description length is optimal",
    description: `The description is ${len} characters, which falls inside the optimal range (${min}–${max} characters).`,
    severity: "success",
    category: "meta",
    weight: 0,
  };
};

interface KeywordResult {
  found: string[];
  missing: string[];
  keywordIssues: SeoIssue[];
}

const checkKeywords = (
  description: string,
  opts: RequiredAnalyzerOptions
): KeywordResult => {
  if (!opts.targetKeywords || opts.targetKeywords.length === 0) {
    return { found: [], missing: [], keywordIssues: [] };
  }

  const lowerDescription = description.toLowerCase();
  const found: string[] = [];
  const missing: string[] = [];
  const issues: SeoIssue[] = [];

  for (const kw of opts.targetKeywords) {
    if (kw.trim().length === 0) continue;
    const present = lowerDescription.includes(kw.trim().toLowerCase());
    if (present) {
      found.push(kw);
      issues.push({
        id: `md-keyword-${slugify(kw)}`,
        title: `Target keyword "${kw}" present in description`,
        description: `The keyword "${kw}" was found in the meta description.`,
        severity: "success",
        category: "meta",
        weight: 0,
      });
    } else {
      missing.push(kw);
      issues.push({
        id: `md-keyword-${slugify(kw)}-missing`,
        title: `Target keyword "${kw}" missing in description`,
        description: `The target keyword "${kw}" is not present in the meta description. Including it can improve SERP relevance.`,
        severity: "warning",
        category: "meta",
        recommendation: `Include "${kw}" in the meta description.`,
        weight: 6,
      });
    }
  }

  return { found, missing, keywordIssues: issues };
};

const checkLocation = (
  description: string,
  opts: RequiredAnalyzerOptions
): SeoIssue => {
  if (!opts.requireLocation) {
    return {
      id: "MD-005",
      title: "Location check disabled",
      description: "Location mention is not required for this analysis.",
      severity: "info",
      category: "meta",
      weight: 0,
    };
  }

  const lowerDescription = description.toLowerCase();
  const city = opts.city?.toLowerCase();
  const locality = opts.locality?.toLowerCase();

  const hasCity = city && city.length > 0 && lowerDescription.includes(city);
  const hasLocality = locality && locality.length > 0 && lowerDescription.includes(locality);

  if (hasCity || hasLocality) {
    return {
      id: "MD-005",
      title: "Location mentioned in description",
      description: `The description contains ${hasCity && hasLocality ? "both city and locality" : hasCity ? "city" : "locality"} reference.`,
      severity: "success",
      category: "meta",
      weight: 0,
    };
  }

  return {
    id: "MD-005",
    title: "Location not mentioned in description",
    description: "The description does not mention the city or locality. Location is a key ranking factor for real estate.",
    severity: "warning",
    category: "meta",
    recommendation: `Include "${opts.city || opts.locality || "location"}" in the meta description for local SEO.`,
    weight: 6,
  };
};

const checkPropertyType = (
  description: string,
  opts: RequiredAnalyzerOptions
): SeoIssue => {
  if (!opts.requirePropertyType || !opts.propertyType || opts.propertyType.trim().length === 0) {
    return {
      id: "MD-006",
      title: "Property type check disabled",
      description: "Property type mention is not required for this analysis.",
      severity: "info",
      category: "meta",
      weight: 0,
    };
  }

  const lowerDescription = description.toLowerCase();
  const propertyType = opts.propertyType.toLowerCase();

  if (lowerDescription.includes(propertyType)) {
    return {
      id: "MD-006",
      title: "Property type mentioned in description",
      description: `The property type "${opts.propertyType}" was found in the description.`,
      severity: "success",
      category: "meta",
      weight: 0,
    };
  }

  return {
    id: "MD-006",
    title: "Property type not mentioned in description",
    description: `The property type "${opts.propertyType}" is not present in the meta description.`,
    severity: "warning",
    category: "meta",
    recommendation: `Include "${opts.propertyType}" in the meta description to match user intent.`,
    weight: 6,
  };
};

const duplicateIssue = (isDuplicate: boolean, entries: DuplicateDescriptionEntry[]): SeoIssue => {
  if (isDuplicate) {
    const urls = entries.map(e => e.url).join(", ");
    return {
      id: "MD-007",
      title: "Duplicate meta description detected",
      description: `This description is also used by: ${urls}`,
      severity: "critical",
      category: "meta",
      recommendation: "Write a unique meta description for this property listing.",
      weight: 10,
    };
  }

  return {
    id: "MD-007",
    title: "Meta description is unique",
    description: "No duplicate descriptions detected.",
    severity: "success",
    category: "meta",
    weight: 0,
  };
};

const duplicateDetectionNotEnabledIssue = (): SeoIssue => ({
  id: "MD-007",
  title: "Duplicate detection not enabled",
  description: "No duplicate description store was provided. Duplicate detection is unavailable.",
  severity: "info",
  category: "meta",
  weight: 0,
});

const checkExcessivePunctuation = (description: string): SeoIssue => {
  const excessivePattern = /([!?.]){3,}/g;
  const matches = description.match(excessivePattern);

  if (matches && matches.length > 0) {
    return {
      id: "MD-008",
      title: "Excessive punctuation detected",
      description: `Found excessive punctuation: ${matches.join(", ")}. This appears spammy and unprofessional.`,
      severity: "warning",
      category: "meta",
      recommendation: "Remove excessive punctuation. Use standard sentence punctuation instead.",
      weight: 4,
    };
  }

  return {
    id: "MD-008",
    title: "No excessive punctuation",
    description: "The description uses appropriate punctuation.",
    severity: "success",
    category: "meta",
    weight: 0,
  };
};

const checkAllCaps = (description: string): SeoIssue => {
  const alphaChars = description.replace(/[^a-zA-Z]/g, "");
  
  if (alphaChars.length === 0) {
    return {
      id: "MD-009",
      title: "No alphabetic characters to check",
      description: "The description contains no alphabetic characters.",
      severity: "info",
      category: "meta",
      weight: 0,
    };
  }

  const hasLowercase = /[a-z]/.test(description);

  if (!hasLowercase) {
    return {
      id: "MD-009",
      title: "Description is ALL CAPS",
      description: "The entire description is written in uppercase, which appears unprofessional.",
      severity: "warning",
      category: "meta",
      recommendation: "Use sentence case or title case instead of ALL CAPS.",
      weight: 4,
    };
  }

  return {
    id: "MD-009",
    title: "Description uses mixed case",
    description: "The description uses appropriate letter casing.",
    severity: "success",
    category: "meta",
    weight: 0,
  };
};

const STOPWORDS = new Set([
  "the", "a", "an", "in", "at", "on", "for", "with", 
  "and", "or", "to", "of", "is", "are", "was", "were"
]);

const checkRepeatedWords = (description: string): SeoIssue => {
  const words = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 0 && !STOPWORDS.has(w));

  const wordCount = new Map<string, number>();
  for (const word of words) {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  }

  const repeatedWords: Array<{ word: string; count: number }> = [];
  for (const [word, count] of wordCount.entries()) {
    if (count > 3) {
      repeatedWords.push({ word, count });
    }
  }

  if (repeatedWords.length > 0) {
    const worst = repeatedWords.reduce((a, b) => a.count > b.count ? a : b);
    return {
      id: "MD-010",
      title: "Repeated words detected",
      description: `The word "${worst.word}" appears ${worst.count} times, which may indicate poor writing quality or keyword stuffing.`,
      severity: "info",
      category: "meta",
      recommendation: `Avoid repeating words. Use synonyms or rephrase.`,
      weight: 2,
    };
  }

  return {
    id: "MD-010",
    title: "No excessive word repetition",
    description: "The description does not repeat words excessively.",
    severity: "success",
    category: "meta",
    weight: 0,
  };
};

/* ----------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------- */

function mergeOptions(opts: MetaDescriptionAnalyzerOptions): RequiredAnalyzerOptions {
  return {
    minLength: opts.minLength ?? defaults.minLength,
    maxLength: opts.maxLength ?? defaults.maxLength,
    idealLength: opts.idealLength ?? defaults.idealLength,
    targetKeywords: opts.targetKeywords ?? [...defaults.targetKeywords],
    city: opts.city ?? defaults.city,
    locality: opts.locality ?? defaults.locality,
    propertyType: opts.propertyType ?? defaults.propertyType,
    requireLocation: opts.requireLocation ?? defaults.requireLocation,
    requirePropertyType: opts.requirePropertyType ?? defaults.requirePropertyType,
    duplicateDescriptionStore: opts.duplicateDescriptionStore ?? defaults.duplicateDescriptionStore,
  };
}

function finalize(
  description: string,
  length: number,
  issues: SeoIssue[],
  passed: boolean,
  score: number,
  scoreBreakdown: ScoreBreakdown | undefined,
  hasLocation: boolean,
  hasPropertyType: boolean,
  found: string[],
  missing: string[],
  isDuplicate: boolean,
  duplicateEntries: DuplicateDescriptionEntry[]
): MetaDescriptionAnalysis {
  return {
    description,
    descriptionLength: length,
    passed,
    score,
    scoreBreakdown,
    issues: dedupeSeverity(issues),
    hasLocation,
    hasPropertyType,
    foundKeywords: found,
    missingKeywords: missing,
    isDuplicate,
    duplicateEntries,
  };
}

/** If the same ID appears twice, keep the highest severity. */
function dedupeSeverity(issues: SeoIssue[]): SeoIssue[] {
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
    const severityOrder: Record<string, number> = {
      critical: 3,
      warning: 2,
      info: 1,
      success: 0,
    };
    const best = list.reduce((prev, curr) =>
      (severityOrder[curr.severity] ?? 0) > (severityOrder[prev.severity] ?? 0)
        ? curr
        : prev
    );
    result.push(best);
  }
  return result;
}

/**
 * Calculate numeric score (0-100) based on issues.
 */
function calculateScore(issues: SeoIssue[], passed: boolean): number {
  if (passed) return 100;

  const severityPenalty: Record<string, number> = {
    critical: 25,
    warning: 10,
    info: 2,
    success: 0,
  };

  let penalty = 0;
  for (const issue of issues) {
    penalty += severityPenalty[issue.severity] ?? 5;
  }

  return Math.max(0, 100 - penalty);
}

/**
 * Calculate score breakdown by category.
 */
function calculateScoreBreakdown(issues: SeoIssue[]): ScoreBreakdown {
  const categoryScores: Record<string, number> = {
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

  const severityPenalty: Record<string, number> = {
    critical: 25,
    warning: 10,
    info: 2,
    success: 0,
  };

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
    passed: issues.filter(i => i.severity === "success").length,
    failed: issues.filter(i => i.severity === "critical").length,
    warnings: issues.filter(i => i.severity === "warning").length,
    passedChecks: issues.length,
    totalChecks: issues.length,
  };
}

/**
 * Simple hash for duplicate detection (non-cryptographic).
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/* ----------------------------------------------------------------
 * Duplicate description detection — interface only
 * ---------------------------------------------------------------- */

export interface DuplicateDescriptionEntry {
  url: string;
  description: string;
  descriptionHash: string;
}

export interface DuplicateDescriptionStore {
  register(entry: DuplicateDescriptionEntry): DuplicateDescriptionEntry[];
  find(hash: string): DuplicateDescriptionEntry[];
  clear(): void;
}