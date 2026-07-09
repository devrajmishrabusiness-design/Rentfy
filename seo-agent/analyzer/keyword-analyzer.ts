/**
 * Keyword Analyzer â€” pure rules.
 *
 * Every function in this file is stateless, side-effect-free, and
 * deterministic. They are designed to be unit-testable without any
 * knowledge of the plugin system, Next.js, or DOM.
 *
 * The rules object returned by `analyzeKeywords` is what the plugin adapter
 * (`keyword-plugin.ts`) converts into a `SeoCheckResult`.
 */

import type { SeoIssue, ScoreBreakdown } from "../types";
import { normalize, stripHtml, countWords } from "../utils/text";
import {
  dedupeSeverity,
  calculateScore,
  calculateScoreBreakdown,
  mergeAnalyzerOptions,
} from "../utils/analyzer-helpers";

/* ----------------------------------------------------------------
 * Configuration
 * ---------------------------------------------------------------- */

export interface KeywordAnalyzerOptions {
  /** Primary keyword to analyze */
  primaryKeyword?: string;
  /** Secondary/related keywords */
  secondaryKeywords?: string[];
  /** Minimum acceptable density percentage. Default: 0.5 */
  minDensity?: number;
  /** Maximum acceptable density percentage. Default: 2.5 */
  maxDensity?: number;
  /** Ideal density percentage. Default: 1.5 */
  idealDensity?: number;
  /** Minimum keyword occurrences. Default: 1 */
  minOccurrences?: number;
  /** Maximum occurrences per paragraph. Default: 3 */
  maxOccurrencesPerParagraph?: number;
  /** Require keyword in title. Default: true */
  requireInTitle?: boolean;
  /** Require keyword in H1. Default: true */
  requireInH1?: boolean;
  /** Require keyword in meta description. Default: true */
  requireInMeta?: boolean;
  /** Require keyword in URL. Default: true */
  requireInUrl?: boolean;
  /** Require related keywords. Default: false */
  requireRelatedKeywords?: boolean;
  /** Minimum related keyword count. Default: 2 */
  minRelatedKeywordCount?: number;
  /** Stopwords to exclude from analysis */
  stopwords?: string[];
  /** Minimum content length for reliable analysis. Default: 100 */
  minContentLength?: number;
}

type RequiredAnalyzerOptions = Required<KeywordAnalyzerOptions>;

const defaults: RequiredAnalyzerOptions = {
  primaryKeyword: "",
  secondaryKeywords: [],
  minDensity: 0.5,
  maxDensity: 2.5,
  idealDensity: 1.5,
  minOccurrences: 1,
  maxOccurrencesPerParagraph: 3,
  requireInTitle: true,
  requireInH1: true,
  requireInMeta: true,
  requireInUrl: true,
  requireRelatedKeywords: false,
  minRelatedKeywordCount: 2,
  stopwords: [],
  minContentLength: 100,
};

const DEFAULT_STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
  "be", "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need", "dare", "ought",
  "used", "it", "its", "this", "that", "these", "those", "i", "you", "he",
  "she", "we", "they", "what", "which", "who", "whom", "whose", "where",
  "when", "why", "how", "all", "each", "every", "both", "few", "more",
  "most", "other", "some", "such", "no", "nor", "not", "only", "own",
  "same", "so", "than", "too", "very", "just", "also", "now", "here",
  "there", "then", "once", "if", "because", "until", "while", "about",
  "against", "between", "into", "through", "during", "before", "after",
  "above", "below", "up", "down", "out", "off", "over", "under", "again",
  "further", "any", "your", "our", "their", "my", "his", "her",
]);

/* ----------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------- */

export interface KeywordAnalysis {
  content: string | undefined;
  primaryKeyword: string | undefined;
  keywordOccurrences: number;
  keywordDensity: number;
  idealDensity: number;
  densityStatus: "too-low" | "optimal" | "too-high";
  inTitle: boolean;
  inH1: boolean;
  inMetaDescription: boolean;
  inUrl: boolean;
  relatedKeywordsFound: string[];
  relatedKeywordsMissing: string[];
  averageOccurrencesPerParagraph: number;
  firstKeywordPosition: number;
  lastKeywordPosition: number;
  totalWords: number;
  uniqueWords: number;
  passed: boolean;
  score: number;
  scoreBreakdown?: ScoreBreakdown;
  issues: SeoIssue[];
}

/* ----------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------- */

/**
 * Split content into paragraphs (handles both HTML and plain text)
 */
const splitIntoParagraphs = (content: string): string[] => {
  const stripped = stripHtml(content);
  // Split by double newlines or more
  const paragraphs = stripped.split(/\n\s*\n+/).filter((p) => p.trim().length > 0);
  return paragraphs.length > 0 ? paragraphs : [stripped];
};

/**
 * Count keyword occurrences in text (case-insensitive, word boundary aware)
 */
const countKeywordOccurrences = (text: string, keyword: string): number => {
  if (!text || !keyword) return 0;
  const stripped = stripHtml(text);
  const normalizedText = normalize(stripped);
  const normalizedKeyword = normalize(keyword);
  
  // For non-Latin scripts (Chinese, Japanese, etc.), use simple substring matching
  const isNonLatin = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(normalizedKeyword);
  
  if (isNonLatin) {
    // Simple substring counting for CJK characters
    let count = 0;
    let idx = 0;
    while (true) {
      const found = normalizedText.indexOf(normalizedKeyword, idx);
      if (found === -1) break;
      count++;
      idx = found + normalizedKeyword.length;
    }
    return count;
  }
  
  // Use word boundary matching for Latin scripts
  const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escapedKeyword}\\b`, "g");
  const matches = normalizedText.match(regex);
  return matches ? matches.length : 0;
};

/**
 * Find first occurrence position of keyword (word index)
 */
const findFirstKeywordPosition = (text: string, keyword: string): number => {
  if (!text || !keyword) return -1;
  const stripped = stripHtml(text);
  const normalizedText = normalize(stripped);
  const normalizedKeyword = normalize(keyword);
  const words = normalizedText.split(/\s+/);
  
  if (normalizedKeyword.includes(" ")) {
    const fullText = normalizedText;
    const idx = fullText.indexOf(normalizedKeyword);
    if (idx === -1) return -1;
    // Count words before this position
    const beforeText = fullText.substring(0, idx);
    return beforeText.split(/\s+/).filter(w => w.length > 0).length;
  } else {
    for (let i = 0; i < words.length; i++) {
      if (words[i] === normalizedKeyword) {
        return i;
      }
    }
  }
  return -1;
};

/**
 * Find last occurrence position of keyword (word index)
 */
const findLastKeywordPosition = (text: string, keyword: string): number => {
  if (!text || !keyword) return -1;
  const stripped = stripHtml(text);
  const normalizedText = normalize(stripped);
  const normalizedKeyword = normalize(keyword);
  const words = normalizedText.split(/\s+/);
  
  if (normalizedKeyword.includes(" ")) {
    const fullText = normalizedText;
    let lastIdx = -1;
    let searchIdx = 0;
    while (true) {
      const idx = fullText.indexOf(normalizedKeyword, searchIdx);
      if (idx === -1) break;
      lastIdx = idx;
      searchIdx = idx + 1;
    }
    if (lastIdx === -1) return -1;
    const beforeText = fullText.substring(0, lastIdx);
    return beforeText.split(/\s+/).filter(w => w.length > 0).length;
  } else {
    let lastPos = -1;
    for (let i = words.length - 1; i >= 0; i--) {
      if (words[i] === normalizedKeyword) {
        lastPos = i;
        break;
      }
    }
    return lastPos;
  }
};

/**
 * Get unique words from text
 */
const getUniqueWords = (text: string): Set<string> => {
  const normalizedText = normalize(text);
  const words = normalizedText.split(/\s+/).filter(w => w.length > 0);
  return new Set(words);
};

/**
 * Check if keyword exists in text (case-insensitive, handles URLs with hyphens)
 */
const keywordExistsInText = (text: string | undefined, keyword: string): boolean => {
  if (!text || !keyword) return false;
  const normalizedText = normalize(text);
  const normalizedKeyword = normalize(keyword);
  
  // For URLs, also check with hyphens replaced by spaces
  const textWithSpaces = normalizedText.replace(/-/g, " ");
  
  if (normalizedKeyword.includes(" ")) {
    return normalizedText.includes(normalizedKeyword) || textWithSpaces.includes(normalizedKeyword);
  } else {
    const words = normalizedText.split(/[\s/-]+/);
    const wordsWithSpaces = textWithSpaces.split(/\s+/);
    return words.some(w => w === normalizedKeyword) || wordsWithSpaces.some(w => w === normalizedKeyword);
  }
};

/**
 * Calculate standard deviation of an array of numbers
 */
const calculateStdDev = (values: number[]): number => {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

/* ----------------------------------------------------------------
 * Public API â€” analyze keywords
 * ---------------------------------------------------------------- */

export const analyzeKeywords = (
  content: string | undefined,
  opts: KeywordAnalyzerOptions & {
    title?: string;
    metaDescription?: string;
    urlSlug?: string;
    headings?: Array<{ level: number; text: string }>;
    targetKeywords?: string[];
  } = {}
): KeywordAnalysis => {
  const options = mergeOptions(opts);
  
  // Get primary keyword from targetKeywords or primaryKeyword option
  const primaryKeyword = opts.primaryKeyword || (opts.targetKeywords && opts.targetKeywords[0]) || "";
  const allKeywords = [primaryKeyword, ...(opts.secondaryKeywords || [])].filter(k => k && k.trim().length > 0);
  const secondaryKeywords = opts.secondaryKeywords || [];
  
  const issues: SeoIssue[] = [];
  
  // Handle missing/empty content
  if (!content || content.trim().length === 0) {
    issues.push(noContentIssue());
    const score = calculateScore(issues, false);
    const scoreBreakdown = calculateScoreBreakdown(issues);
    return finalize(
      content,
      primaryKeyword || undefined,
      0,
      0,
      options.idealDensity,
      "too-low",
      false,
      false,
      false,
      false,
      [],
      secondaryKeywords.filter(k => !keywordExistsInText(content, k)),
      0,
      -1,
      -1,
      0,
      0,
      issues,
      false,
      score,
      scoreBreakdown
    );
  }
  
  const totalWords = countWords(content);
  const uniqueWords = getUniqueWords(content).size;
  
  // KW-001: Primary Keyword Exists
  if (!primaryKeyword || primaryKeyword.trim().length === 0) {
    issues.push(noPrimaryKeywordIssue());
  } else {
    issues.push(primaryKeywordExistsIssue());
  }
  
  // Count keyword occurrences in content
  const keywordOccurrences = primaryKeyword ? countKeywordOccurrences(content, primaryKeyword) : 0;
  const keywordDensity = totalWords > 0 ? (keywordOccurrences / totalWords) * 100 : 0;
  
  // Determine density status
  let densityStatus: "too-low" | "optimal" | "too-high" = "optimal";
  if (keywordDensity < options.minDensity) {
    densityStatus = "too-low";
  } else if (keywordDensity > options.maxDensity) {
    densityStatus = "too-high";
  }
  
  // Find positions
  const firstKeywordPosition = primaryKeyword ? findFirstKeywordPosition(content, primaryKeyword) : -1;
  const lastKeywordPosition = primaryKeyword ? findLastKeywordPosition(content, primaryKeyword) : -1;
  
  // Check content length
  if (totalWords < options.minContentLength) {
    issues.push({
      id: "KW-CONTENT-SHORT",
      title: "Content is too short for reliable analysis",
      description: `Content has ${totalWords} words. Minimum recommended: ${options.minContentLength} words.`,
      severity: "info",
      category: "keywords",
      weight: 0,
    });
  }
  
  // KW-002: Primary Keyword in Title
  if (options.requireInTitle && primaryKeyword) {
    if (keywordExistsInText(opts.title, primaryKeyword)) {
      issues.push(keywordInTitleIssue(primaryKeyword));
    } else {
      issues.push(keywordMissingInTitleIssue(primaryKeyword));
    }
  }
  
  // KW-003: Primary Keyword in H1
  if (options.requireInH1 && primaryKeyword) {
    const h1Headings = opts.headings?.filter(h => h.level === 1) || [];
    const h1Text = h1Headings.map(h => h.text).join(" ");
    
    if (keywordExistsInText(h1Text, primaryKeyword)) {
      issues.push(keywordInH1Issue(primaryKeyword));
    } else {
      issues.push(keywordMissingInH1Issue(primaryKeyword));
    }
  }
  
  // KW-004: Primary Keyword in Meta Description
  if (options.requireInMeta && primaryKeyword) {
    if (keywordExistsInText(opts.metaDescription, primaryKeyword)) {
      issues.push(keywordInMetaIssue(primaryKeyword));
    } else {
      issues.push(keywordMissingInMetaIssue(primaryKeyword));
    }
  }
  
  // KW-005: Primary Keyword in URL
  if (options.requireInUrl && primaryKeyword) {
    if (keywordExistsInText(opts.urlSlug, primaryKeyword)) {
      issues.push(keywordInUrlIssue(primaryKeyword));
    } else {
      issues.push(keywordMissingInUrlIssue(primaryKeyword));
    }
  }
  
  // KW-006: Keyword Density
  if (primaryKeyword) {
    // Density is always calculated as (occurrences / totalWords) * 100
    // If keyword doesn't appear, density is 0%
    const density = keywordDensity;
    
    if (density < options.minDensity) {
      densityStatus = "too-low";
    } else if (density > options.maxDensity) {
      densityStatus = "too-high";
    }
    
    if (densityStatus === "too-low") {
      issues.push({
        id: "KW-006",
        title: "Keyword density is too low",
        description: `Keyword density is ${density.toFixed(2)}%. Recommended minimum: ${options.minDensity}%.`,
        severity: "warning",
        category: "keywords",
        recommendation: `Increase keyword usage to achieve at least ${options.minDensity}% density.`,
        currentValue: density,
        expectedValue: options.minDensity,
        weight: 8,
      });
    } else if (densityStatus === "too-high") {
      issues.push({
        id: "KW-006",
        title: "Keyword density is too high",
        description: `Keyword density is ${density.toFixed(2)}%. Recommended maximum: ${options.maxDensity}%.`,
        severity: "warning",
        category: "keywords",
        recommendation: `Reduce keyword usage to avoid keyword stuffing penalties.`,
        currentValue: density,
        expectedValue: options.maxDensity,
        weight: 8,
      });
    } else {
      issues.push({
        id: "KW-006",
        title: "Keyword density is optimal",
        description: `Keyword density is ${density.toFixed(2)}%, within the optimal range (${options.minDensity}%-${options.maxDensity}%).`,
        severity: "success",
        category: "keywords",
        weight: 0,
      });
    }
  }
  
  // KW-007: No Keyword Stuffing
  if (primaryKeyword) {
    const paragraphs = splitIntoParagraphs(content);
    const paragraphCounts = paragraphs.map(p => countKeywordOccurrences(p, primaryKeyword));
    const maxInParagraph = paragraphCounts.length > 0 ? Math.max(...paragraphCounts, 0) : 0;
    const avgInParagraph = paragraphCounts.length > 0 
      ? paragraphCounts.reduce((a, b) => a + b, 0) / paragraphCounts.length 
      : 0;
    
    if (maxInParagraph > options.maxOccurrencesPerParagraph) {
      issues.push({
        id: "KW-007",
        title: "Potential keyword stuffing detected",
        description: `One paragraph contains ${maxInParagraph} occurrences of "${primaryKeyword}". Maximum recommended: ${options.maxOccurrencesPerParagraph}.`,
        severity: "warning",
        category: "keywords",
        recommendation: "Reduce keyword repetition. Use synonyms and related terms instead.",
        currentValue: maxInParagraph,
        expectedValue: options.maxOccurrencesPerParagraph,
        weight: 8,
      });
    } else {
      issues.push({
        id: "KW-007",
        title: "No keyword stuffing detected",
        description: `Maximum ${maxInParagraph} occurrences per paragraph, within the limit of ${options.maxOccurrencesPerParagraph}.`,
        severity: "success",
        category: "keywords",
        weight: 0,
      });
    }
  }
  
  // KW-008: Related Keywords Present
  if (options.requireRelatedKeywords && secondaryKeywords.length > 0) {
    const foundRelated = secondaryKeywords.filter(k => keywordExistsInText(content, k));
    const missingRelated = secondaryKeywords.filter(k => !keywordExistsInText(content, k));
    
    if (foundRelated.length >= options.minRelatedKeywordCount) {
      issues.push({
        id: "KW-008",
        title: "Related keywords present",
        description: `Found ${foundRelated.length} related keywords: ${foundRelated.slice(0, 5).join(", ")}.`,
        severity: "success",
        category: "keywords",
        weight: 0,
      });
    } else {
      issues.push({
        id: "KW-008",
        title: "Insufficient related keywords",
        description: `Found ${foundRelated.length} related keywords. Minimum recommended: ${options.minRelatedKeywordCount}.`,
        severity: "info",
        category: "keywords",
        recommendation: "Include more related terms and synonyms to enrich content.",
        currentValue: foundRelated.length,
        expectedValue: options.minRelatedKeywordCount,
        weight: 4,
      });
    }
  }
  
  // KW-009: Keywords Naturally Distributed
  if (primaryKeyword) {
    const paragraphs = splitIntoParagraphs(content);
    const paragraphCounts = paragraphs.map(p => countKeywordOccurrences(p, primaryKeyword));
    const stddev = calculateStdDev(paragraphCounts);
    const mean = paragraphCounts.length > 0 
      ? paragraphCounts.reduce((a, b) => a + b, 0) / paragraphCounts.length 
      : 0;
    
    // Use coefficient of variation (stddev/mean) if mean > 0, otherwise use raw stddev
    // Only flag as uneven if variation is high AND there are keywords to distribute
    const distributionMetric = mean > 0 ? stddev / mean : stddev;
    const hasAnyKeywords = paragraphCounts.some(c => c > 0);
    
    // Only warn if there's high variation AND keywords exist (not evenly distributed)
    if (hasAnyKeywords && (distributionMetric > 1.5 || (paragraphCounts.some(c => c === 0) && paragraphCounts.some(c => c > 0) && paragraphCounts.length > 2))) {
      issues.push({
        id: "KW-009",
        title: "Keyword distribution is uneven",
        description: "Keywords are clustered in certain sections rather than evenly distributed.",
        severity: "info",
        category: "keywords",
        recommendation: "Distribute keywords more evenly throughout the content.",
        weight: 4,
      });
    } else {
      issues.push({
        id: "KW-009",
        title: "Keywords are naturally distributed",
        description: "Keywords are spread evenly throughout the content.",
        severity: "success",
        category: "keywords",
        weight: 0,
      });
    }
  }
  
  // KW-010: No Duplicate Keyword Phrases
  if (primaryKeyword) {
    const words = normalize(content).split(/\s+/);
    const hasDuplicatePhrases = checkDuplicatePhrases(content, primaryKeyword);
    
    if (hasDuplicatePhrases) {
      issues.push({
        id: "KW-010",
        title: "Duplicate keyword phrases detected",
        description: `The exact phrase "${primaryKeyword}" is repeated verbatim within close proximity.`,
        severity: "info",
        category: "keywords",
        recommendation: "Vary your keyword phrasing. Use synonyms and related terms.",
        weight: 4,
      });
    } else {
      issues.push({
        id: "KW-010",
        title: "No duplicate keyword phrases",
        description: "Keyword phrasing is varied and natural.",
        severity: "success",
        category: "keywords",
        weight: 0,
      });
    }
  }
  
  // Calculate metadata
  const inTitle = primaryKeyword ? keywordExistsInText(opts.title, primaryKeyword) : false;
  const inH1 = primaryKeyword ? keywordExistsInText(opts.headings?.filter(h => h.level === 1).map(h => h.text).join(" "), primaryKeyword) : false;
  const inMetaDescription = primaryKeyword ? keywordExistsInText(opts.metaDescription, primaryKeyword) : false;
  const inUrl = primaryKeyword ? keywordExistsInText(opts.urlSlug, primaryKeyword) : false;
  
  const relatedKeywordsFound = secondaryKeywords.filter(k => keywordExistsInText(content, k));
  const relatedKeywordsMissing = secondaryKeywords.filter(k => !keywordExistsInText(content, k));
  
  const paragraphs = splitIntoParagraphs(content);
  const paragraphCounts = paragraphs.map(p => countKeywordOccurrences(p, primaryKeyword || ""));
  const averageOccurrencesPerParagraph = paragraphCounts.length > 0
    ? paragraphCounts.reduce((a, b) => a + b, 0) / paragraphCounts.length
    : 0;
  
  // Determine pass/fail
  const passed = !issues.some(i => i.severity === "critical" || i.severity === "warning");
  
  // Calculate score
  const score = calculateScore(issues, passed);
  const scoreBreakdown = calculateScoreBreakdown(issues);
  
  return finalize(
    content,
    primaryKeyword || undefined,
    keywordOccurrences,
    keywordDensity,
    options.idealDensity,
    densityStatus,
    inTitle,
    inH1,
    inMetaDescription,
    inUrl,
    relatedKeywordsFound,
    relatedKeywordsMissing,
    averageOccurrencesPerParagraph,
    firstKeywordPosition,
    lastKeywordPosition,
    totalWords,
    uniqueWords,
    issues,
    passed,
    score,
    scoreBreakdown
  );
};

/* ----------------------------------------------------------------
 * Rule Issue Creators
 * ---------------------------------------------------------------- */

const noContentIssue = (): SeoIssue => ({
  id: "KW-001",
  title: "No content to analyze",
  description: "Content is empty or missing. Keyword analysis cannot be performed.",
  severity: "critical",
  category: "keywords",
  recommendation: "Add content to the page before analyzing keywords.",
  weight: 10,
});

const noPrimaryKeywordIssue = (): SeoIssue => ({
  id: "KW-001",
  title: "Primary keyword is missing",
  description: "No primary keyword was provided for analysis.",
  severity: "critical",
  category: "keywords",
  recommendation: "Define at least one primary keyword for this property listing.",
  weight: 10,
});

const primaryKeywordExistsIssue = (): SeoIssue => ({
  id: "KW-001",
  title: "Primary keyword is defined",
  description: "A primary keyword has been configured for analysis.",
  severity: "success",
  category: "keywords",
  weight: 0,
});

const keywordInTitleIssue = (keyword: string): SeoIssue => ({
  id: "KW-002",
  title: "Primary keyword found in title",
  description: `The keyword "${keyword}" appears in the page title.`,
  severity: "success",
  category: "keywords",
  weight: 0,
});

const keywordMissingInTitleIssue = (keyword: string): SeoIssue => ({
  id: "KW-002",
  title: "Primary keyword missing in title",
  description: `The keyword "${keyword}" does not appear in the page title.`,
  severity: "warning",
  category: "keywords",
  recommendation: "Include your primary keyword near the beginning of the page title.",
  weight: 8,
});

const keywordInH1Issue = (keyword: string): SeoIssue => ({
  id: "KW-003",
  title: "Primary keyword found in H1",
  description: `The keyword "${keyword}" appears in the H1 heading.`,
  severity: "success",
  category: "keywords",
  weight: 0,
});

const keywordMissingInH1Issue = (keyword: string): SeoIssue => ({
  id: "KW-003",
  title: "Primary keyword missing in H1",
  description: `The keyword "${keyword}" does not appear in the H1 heading.`,
  severity: "warning",
  category: "keywords",
  recommendation: "Include your primary keyword in the main H1 heading.",
  weight: 6,
});

const keywordInMetaIssue = (keyword: string): SeoIssue => ({
  id: "KW-004",
  title: "Primary keyword found in meta description",
  description: `The keyword "${keyword}" appears in the meta description.`,
  severity: "success",
  category: "keywords",
  weight: 0,
});

const keywordMissingInMetaIssue = (keyword: string): SeoIssue => ({
  id: "KW-004",
  title: "Primary keyword missing in meta description",
  description: `The keyword "${keyword}" does not appear in the meta description.`,
  severity: "warning",
  category: "keywords",
  recommendation: "Include your primary keyword naturally in the meta description.",
  weight: 6,
});

const keywordInUrlIssue = (keyword: string): SeoIssue => ({
  id: "KW-005",
  title: "Primary keyword found in URL",
  description: `The keyword "${keyword}" appears in the URL slug.`,
  severity: "success",
  category: "keywords",
  weight: 0,
});

const keywordMissingInUrlIssue = (keyword: string): SeoIssue => ({
  id: "KW-005",
  title: "Primary keyword missing in URL",
  description: `The keyword "${keyword}" does not appear in the URL slug.`,
  severity: "warning",
  category: "keywords",
  recommendation: "Include your primary keyword in the URL slug.",
  weight: 6,
});

/**
 * Check for duplicate keyword phrases within 100-word window
 */
const checkDuplicatePhrases = (content: string, keyword: string): boolean => {
  const normalizedContent = normalize(content);
  const normalizedKeyword = normalize(keyword);
  
  if (!normalizedKeyword.includes(" ")) {
    return false; // Single words don't count as phrases
  }
  
  // Find all positions of the keyword
  const positions: number[] = [];
  let searchIdx = 0;
  while (true) {
    const idx = normalizedContent.indexOf(normalizedKeyword, searchIdx);
    if (idx === -1) break;
    positions.push(idx);
    searchIdx = idx + 1;
  }
  
  if (positions.length < 2) return false;
  
  // Check if any two occurrences are within 100 words
  for (let i = 0; i < positions.length - 1; i++) {
    const textBetween = normalizedContent.substring(positions[i], positions[i + 1]);
    const wordsBetween = textBetween.split(/\s+/).filter(w => w.length > 0).length;
    if (wordsBetween <= 100) {
      return true;
    }
  }
  
  return false;
};

/* ----------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------- */

function mergeOptions(opts: KeywordAnalyzerOptions & {
  title?: string;
  metaDescription?: string;
  urlSlug?: string;
  headings?: Array<{ level: number; text: string }>;
  targetKeywords?: string[];
}): RequiredAnalyzerOptions {
  return mergeAnalyzerOptions(opts, defaults);
}

function finalize(
  content: string | undefined,
  primaryKeyword: string | undefined,
  keywordOccurrences: number,
  keywordDensity: number,
  idealDensity: number,
  densityStatus: "too-low" | "optimal" | "too-high",
  inTitle: boolean,
  inH1: boolean,
  inMetaDescription: boolean,
  inUrl: boolean,
  relatedKeywordsFound: string[],
  relatedKeywordsMissing: string[],
  averageOccurrencesPerParagraph: number,
  firstKeywordPosition: number,
  lastKeywordPosition: number,
  totalWords: number,
  uniqueWords: number,
  issues: SeoIssue[],
  passed: boolean,
  score: number,
  scoreBreakdown: ScoreBreakdown | undefined
): KeywordAnalysis {
  return {
    content,
    primaryKeyword,
    keywordOccurrences,
    keywordDensity,
    idealDensity,
    densityStatus,
    inTitle,
    inH1,
    inMetaDescription,
    inUrl,
    relatedKeywordsFound,
    relatedKeywordsMissing,
    averageOccurrencesPerParagraph,
    firstKeywordPosition,
    lastKeywordPosition,
    totalWords,
    uniqueWords,
    passed,
    score,
    scoreBreakdown,
    issues: dedupeSeverity(issues),
  };
}
