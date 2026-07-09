/**
 * Title Analyzer — pure rules.
 *
 * Every function in this file is stateless, side-effect-free, and
 * deterministic. They are designed to be unit-testable without any
 * knowledge of the plugin system, Next.js, or DOM.
 *
 * The rules object returned by `analyzeTitle` is what the plugin adapter
 * (`title-plugin.ts`) converts into a `SeoCheckResult`.
 */

import type { SeoIssue, ScoreBreakdown } from "../types";
import {
  dedupeSeverity,
  calculateScore,
  calculateScoreBreakdown,
  simpleHash,
  mergeAnalyzerOptions,
} from "../utils/analyzer-helpers";

/* ----------------------------------------------------------------
 * Configuration
 * ---------------------------------------------------------------- */

export interface TitleAnalyzerOptions {
  /** How many characters the title should be (ideal). Default: 55. */
  idealLength?: number;
  /** How far ± from ideal is acceptable (e.g. 5). Default: 5. */
  lenTolerance?: number;
  /** Minimum length before flagged "too short". Default: 30. */
  minLength?: number;
  /** Maximum length before flagged "too long". Default: 70. */
  maxLength?: number;
  /** Keywords that must (or should) appear in the title. */
  targetKeywords?: string[];
  /** Brand string to detect at the end (e.g. " | RenterEasy"). */
  brandSuffix?: string;
  /** Whether brand presence is required (recommended for production sites). Default: false. */
  enforceBrand?: boolean;
  /** Optional store for duplicate title detection (future-proof). */
  duplicateTitleStore?: DuplicateTitleStore;
}

// Exclude duplicateTitleStore from Required since it's optional
type RequiredAnalyzerOptions = Omit<Required<TitleAnalyzerOptions>, "duplicateTitleStore"> & {
  duplicateTitleStore?: DuplicateTitleStore;
};

const defaults: RequiredAnalyzerOptions = {
  idealLength: 55,
  lenTolerance: 5,
  minLength: 30,
  maxLength: 70,
  targetKeywords: [],
  brandSuffix: "",
  enforceBrand: false,
  duplicateTitleStore: undefined,
};

/* ----------------------------------------------------------------
 * Public API — analyze a single title string
 * ---------------------------------------------------------------- */

export interface TitleAnalysis {
  title: string;
  titleLength: number;
  /** true only when title is non-empty and no rule flagged it. */
  passed: boolean;
  /** Numeric score 0-100 (for future weighted scoring). */
  score: number;
  /** Breakdown by category (for detailed reporting). */
  scoreBreakdown?: ScoreBreakdown;
  issues: SeoIssue[];
  /** Detected brand presence (empty if no brand configured). */
  hasBrandSuffix: boolean;
  /** Which target keywords were found. */
  foundKeywords: string[];
  /** Which target keywords were missing. */
  missingKeywords: string[];
  /** Duplicate title detection results (future-proof). */
  duplicateTitle?: {
    isDuplicate: boolean;
    duplicateEntries: DuplicateTitleEntry[];
    hash: string;
  };
}

/**
 * Analyze one title against configurable SEO rules.
 */
export const analyzeTitle = (
  title: string | undefined,
  opts: TitleAnalyzerOptions = {}
): TitleAnalysis => {
  const options = mergeOptions(opts);
  const normalizedTitle = (title ?? "").trim();
  const titleLength = normalizedTitle.length;

  const issues: SeoIssue[] = [];

  // 1. Missing / empty
  if (titleLength === 0) {
    issues.push(missingOrEmptyIssue(title));
    return finalize(title ?? "", 0, issues, false, 0, undefined, [], [], undefined);
  }

  // 2. Length checks
  const lenCheck = checkLength(normalizedTitle, titleLength, options);
  issues.push(lenCheck);

  // 3. Brand suffix
  const brandCheck = checkBrandSuffix(normalizedTitle, options);
  if (brandCheck) issues.push(brandCheck);

  // 4. Keyword presence
  const { found, missing, keywordIssues } = checkKeywords(
    normalizedTitle,
    options
  );
  issues.push(...keywordIssues);

  // 5. Duplicate title detection (future-proof placeholder)
  let duplicateResult: TitleAnalysis["duplicateTitle"] = undefined;
  if (options.duplicateTitleStore) {
    const hash = simpleHash(normalizedTitle);
    const entries = options.duplicateTitleStore.find(hash);
    const isDuplicate = entries.length > 0;
    duplicateResult = {
      isDuplicate,
      duplicateEntries: entries,
      hash,
    };
  }

  // Passed = no issues with severity > "info"
  const passed = !issues.some(
    (i) => i.severity === "critical" || i.severity === "warning"
  );

  // Calculate numeric score (0-100)
  const score = calculateScore(issues, passed);

  // Calculate score breakdown
  const scoreBreakdown = calculateScoreBreakdown(issues);

  return finalize(
    normalizedTitle,
    titleLength,
    issues,
    passed,
    score,
    scoreBreakdown,
    found,
    missing,
    duplicateResult
  );
};

/* ----------------------------------------------------------------
 * Internals — each rule as a pure function
 * ---------------------------------------------------------------- */

const missingOrEmptyIssue = (rawTitle: string | undefined): SeoIssue =>
  rawTitle === undefined
    ? {
        id: "title-missing",
        title: "Page title is missing",
        description:
          "The `<title>` tag is absent. Search engines use it as the clickable headline in SERPs.",
        severity: "critical",
        category: "meta",
        recommendation: "Add a `<title>` element to the `<head>` section.",
        weight: 10,
      }
    : {
        id: "title-empty",
        title: "Page title is empty",
        description:
          "The `<title>` tag exists but contains only whitespace. It will be ignored by search engines.",
        severity: "critical",
        category: "meta",
        recommendation: "Populate the `<title>` with a meaningful, keyword-rich string.",
        weight: 10,
      };

const checkLength = (
  _title: string,
  len: number,
  opts: RequiredAnalyzerOptions
): SeoIssue => {
  const ideal = opts.idealLength;
  const min = opts.minLength;
  const max = opts.maxLength;
  const tolerance = opts.lenTolerance;

  if (len < min) {
    return {
      id: "title-too-short",
      title: "Title is too short",
      description: `The title is ${len} characters. Search engines often truncate or rewrite titles shorter than ${min} characters.`,
      severity: "warning",
      category: "meta",
      recommendation: `Aim for ${ideal}±${tolerance} characters (ideal: ${ideal}).`,
      currentValue: len,
      expectedValue: ideal,
      weight: 5,
    };
  }

  if (len > max) {
    return {
      id: "title-too-long",
      title: "Title is too long",
      description: `The title is ${len} characters (max recommended: ${max}). Long titles are truncated in SERPs, hiding the most important words.`,
      severity: "warning",
      category: "meta",
      recommendation: `Shorten to ${ideal}±${tolerance} characters while keeping keywords at the start.`,
      currentValue: len,
      expectedValue: ideal,
      weight: 4,
    };
  }

  if (len >= ideal - tolerance && len <= ideal + tolerance) {
    return {
      id: "title-ideal-length",
      title: "Title length is ideal",
      description: `The title is ${len} characters, which falls inside the ideal range (${ideal - tolerance}–${ideal + tolerance} characters).`,
      severity: "success",
      category: "meta",
      weight: 0,
    };
  }

  return {
    id: "title-length-acceptable",
    title: "Title length is acceptable",
    description: `The title is ${len} characters — within limits but not in the ideal range (${ideal - tolerance}–${ideal + tolerance}).`,
    severity: "info",
    category: "meta",
    recommendation: `Consider tightening to ${ideal}±${tolerance} characters.`,
    currentValue: len,
    expectedValue: ideal,
    weight: 1,
  };
};

const checkBrandSuffix = (
  title: string,
  opts: RequiredAnalyzerOptions
): SeoIssue | null => {
  if (!opts.brandSuffix || opts.brandSuffix.trim().length === 0) return null;

  const hasBrand = title.endsWith(opts.brandSuffix);
  if (!hasBrand && opts.enforceBrand) {
    return {
      id: "title-brand-missing",
      title: "Brand suffix missing",
      description: `The brand suffix "${opts.brandSuffix}" was not found at the end of the title.`,
      severity: "warning",
      category: "meta",
      recommendation: `Append "${opts.brandSuffix}" to the title end for brand consistency.`,
      weight: 3,
    };
  }

  if (hasBrand) {
    return {
      id: "title-brand-present",
      title: "Brand suffix present",
      description: `The brand suffix "${opts.brandSuffix}" is present.`,
      severity: "success",
      category: "meta",
      weight: 0,
    };
  }

  return null;
};

interface KeywordResult {
  found: string[];
  missing: string[];
  keywordIssues: SeoIssue[];
}

const checkKeywords = (
  title: string,
  opts: RequiredAnalyzerOptions
): KeywordResult => {
  if (!opts.targetKeywords || opts.targetKeywords.length === 0) {
    return { found: [], missing: [], keywordIssues: [] };
  }

  const lowerTitle = title.toLowerCase();
  const found: string[] = [];
  const missing: string[] = [];
  const issues: SeoIssue[] = [];

  for (const kw of opts.targetKeywords) {
    if (kw.trim().length === 0) continue;
    const present = lowerTitle.includes(kw.trim().toLowerCase());
    if (present) {
      found.push(kw);
      issues.push({
        id: `title-keyword-${slugify(kw)}`,
        title: `Target keyword "${kw}" present in title`,
        description: `The keyword "${kw}" was found in the page title.`,
        severity: "success",
        category: "keywords",
        weight: 0,
      });
    } else {
      missing.push(kw);
      issues.push({
        id: `title-keyword-${slugify(kw)}-missing`,
        title: `Target keyword "${kw}" missing in title`,
        description: `The target keyword "${kw}" is not present in the page title. Including it near the start of the title can improve click-through rate.`,
        severity: "warning",
        category: "keywords",
        recommendation: `Include "${kw}" near the beginning of the title.`,
        weight: 5,
      });
    }
  }

  return { found, missing, keywordIssues: issues };
};

/* ----------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------- */

function mergeOptions(opts: TitleAnalyzerOptions): RequiredAnalyzerOptions {
  return mergeAnalyzerOptions(opts, defaults);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function finalize(
  title: string,
  length: number,
  issues: SeoIssue[],
  passed: boolean,
  score: number,
  scoreBreakdown: ScoreBreakdown | undefined,
  found: string[],
  missing: string[],
  duplicateTitle: TitleAnalysis["duplicateTitle"]
): TitleAnalysis {
  return {
    title,
    titleLength: length,
    passed,
    score,
    scoreBreakdown,
    issues: dedupeSeverity(issues),
    hasBrandSuffix: issues.some(
      (i) => i.id === "title-brand-present" || i.id === "title-brand-missing"
    ),
    foundKeywords: found,
    missingKeywords: missing,
    duplicateTitle,
  };
}

/* ----------------------------------------------------------------
 * Duplicate title detection — interface only (as requested)
 * ---------------------------------------------------------------- */

/**
 * Hash representation of a title for deduplication.
 * In a real crawl this would be a SHA-256 or similar.
 */
export interface DuplicateTitleEntry {
  url: string;
  title: string;
  titleHash: string; // consumer decides hash algo
}

/**
 * Interface for a future duplicate-title store.
 * Not implemented yet — provided so the analyzer returns a
 * `duplicateTitle` field callers can check later.
 */
export interface DuplicateTitleStore {
  /** Register a title for a URL. Returns previous entries with the same hash. */
  register(entry: DuplicateTitleEntry): DuplicateTitleEntry[];
  /** Find all URLs that share the same title hash. */
  find(hash: string): DuplicateTitleEntry[];
  /** Reset the store. */
  clear(): void;
}
