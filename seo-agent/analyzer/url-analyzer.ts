/**
 * URL Analyzer â€” pure rules.
 *
 * Every function in this file is stateless, side-effect-free, and
 * deterministic. They are designed to be unit-testable without any
 * knowledge of the plugin system, Next.js, or DOM.
 *
 * The rules object returned by `analyzeUrl` is what the plugin adapter
 * (`url-plugin.ts`) converts into a `SeoCheckResult`.
 */

import type { SeoIssue, ScoreBreakdown } from "../types";
import {
  dedupeSeverity,
  calculateScore,
  calculateScoreBreakdown,
  mergeAnalyzerOptions,
} from "../utils/analyzer-helpers";

/* ----------------------------------------------------------------
 * Configuration
 * ---------------------------------------------------------------- */

export interface UrlAnalyzerOptions {
  /** Minimum acceptable length. Default: 20. */
  minLength?: number;
  /** Maximum acceptable length. Default: 80. */
  maxLength?: number;
  /** Ideal target length. Default: 50. */
  idealLength?: number;
  /** City name for location check. */
  city?: string;
  /** Locality/neighborhood name for location check. */
  locality?: string;
  /** Property type (e.g., "3BHK", "Apartment"). */
  propertyType?: string;
  /** Whether city mention is required. Default: true. */
  requireCity?: boolean;
  /** Whether locality mention is required. Default: false. */
  requireLocality?: boolean;
  /** Whether property type mention is required. Default: true. */
  requirePropertyType?: boolean;
  /** Additional allowed special characters. Default: none. */
  allowedSpecialChars?: string;
}

type RequiredAnalyzerOptions = Omit<
  Required<UrlAnalyzerOptions>,
  "city" | "locality" | "propertyType"
> & {
  city?: string;
  locality?: string;
  propertyType?: string;
};

const defaults: RequiredAnalyzerOptions = {
  minLength: 20,
  maxLength: 80,
  idealLength: 50,
  city: undefined,
  locality: undefined,
  propertyType: undefined,
  requireCity: true,
  requireLocality: false,
  requirePropertyType: true,
  allowedSpecialChars: "",
};

/* ----------------------------------------------------------------
 * Public API â€” analyze a single URL slug string
 * ---------------------------------------------------------------- */

export interface UrlAnalysis {
  urlSlug: string;
  slugLength: number;
  /** true only when slug is non-empty and no rule flagged it as critical/warning. */
  passed: boolean;
  /** Numeric score 0-100. */
  score: number;
  /** Breakdown by category. */
  scoreBreakdown?: ScoreBreakdown;
  issues: SeoIssue[];
  /** Whether city was found in slug. */
  hasCity: boolean;
  /** Whether locality was found in slug. */
  hasLocality: boolean;
  /** Whether property type was found in slug. */
  hasPropertyType: boolean;
  /** Whether all alphabetic chars are lowercase. */
  isLowercase: boolean;
  /** Whether hyphens are used as separators. */
  hasHyphens: boolean;
  /** Whether duplicate hyphens exist. */
  hasDuplicateHyphens: boolean;
  /** Whether invalid special chars exist. */
  hasSpecialChars: boolean;
  /** Whether query parameters exist. */
  hasQueryParams: boolean;
}

/**
 * Analyze one URL slug against configurable SEO rules.
 */
export const analyzeUrl = (
  urlSlug: string | undefined,
  opts: UrlAnalyzerOptions = {}
): UrlAnalysis => {
  const options = mergeOptions(opts);
  const normalizedSlug = (urlSlug ?? "").trim();
  const slugLength = normalizedSlug.length;

  const issues: SeoIssue[] = [];

  // URL-001: Missing
  if (urlSlug === undefined || urlSlug === null) {
    issues.push(urlMissingIssue());
    return finalize(
      "",
      0,
      issues,
      false,
      0,
      undefined,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false
    );
  }

  // URL-002: Lowercase check
  const lowercaseCheck = checkLowercase(normalizedSlug);
  issues.push(lowercaseCheck);

  // URL-003: Hyphen separators
  const hyphenCheck = checkHyphenSeparators(normalizedSlug);
  issues.push(hyphenCheck);

  // URL-004: City presence
  const cityCheck = checkCityPresence(normalizedSlug, options);
  issues.push(cityCheck);

  // URL-005: Locality presence
  const localityCheck = checkLocalityPresence(normalizedSlug, options);
  issues.push(localityCheck);

  // URL-006: Property type presence
  const propertyTypeCheck = checkPropertyTypePresence(normalizedSlug, options);
  issues.push(propertyTypeCheck);

  // URL-007: Duplicate hyphens
  const duplicateHyphensCheck = checkDuplicateHyphens(normalizedSlug);
  issues.push(duplicateHyphensCheck);

  // URL-008: Special characters
  const specialCharsCheck = checkSpecialCharacters(
    normalizedSlug,
    options.allowedSpecialChars
  );
  issues.push(specialCharsCheck);

  // URL-009: Length check
  const lengthCheck = checkLength(normalizedSlug, slugLength, options);
  issues.push(lengthCheck);

  // URL-010: Query parameters
  const queryParamsCheck = checkQueryParams(normalizedSlug);
  issues.push(queryParamsCheck);

  // Passed = no issues with severity > "info"
  const passed = !issues.some(
    (i) => i.severity === "critical" || i.severity === "warning"
  );

  // Calculate numeric score
  const score = calculateScore(issues, passed);

  // Calculate score breakdown
  const scoreBreakdown = calculateScoreBreakdown(issues);

  const hasCity = !issues.some((i) => i.id === "URL-004" && i.severity === "warning");
  const hasLocality = !issues.some((i) => i.id === "URL-005" && i.severity === "warning");
  const hasPropertyType = !issues.some((i) => i.id === "URL-006" && i.severity === "warning");
  const isLowercase = !issues.some((i) => i.id === "URL-002" && i.severity === "warning");
  const hasHyphens = !issues.some((i) => i.id === "URL-003" && i.severity === "warning");
  const hasDuplicateHyphens = !issues.some((i) => i.id === "URL-007" && i.severity === "warning");
  const hasSpecialChars = !issues.some((i) => i.id === "URL-008" && i.severity === "warning");
  const hasQueryParams = !issues.some((i) => i.id === "URL-010" && i.severity === "warning");

  return finalize(
    normalizedSlug,
    slugLength,
    issues,
    passed,
    score,
    scoreBreakdown,
    hasCity,
    hasLocality,
    hasPropertyType,
    isLowercase,
    hasHyphens,
    hasDuplicateHyphens,
    hasSpecialChars,
    hasQueryParams
  );
};

/* ----------------------------------------------------------------
 * Internals â€” each rule as a pure function
 * ---------------------------------------------------------------- */

const urlMissingIssue = (): SeoIssue => ({
  id: "URL-001",
  title: "URL slug is missing",
  description:
    "The URL slug is not provided. Every property listing must have a URL for search engines to index.",
  severity: "critical",
  category: "technical",
  recommendation:
    "Generate a URL slug for this property listing. Use format: /rent/{city}/{locality}/{property-type}-{id}",
  weight: 10,
});

const checkLowercase = (slug: string): SeoIssue => {
  const hasUppercase = /[A-Z]/.test(slug);

  if (hasUppercase) {
    return {
      id: "URL-002",
      title: "URL contains uppercase characters",
      description:
        "URLs are case-sensitive on many servers. Mixed case can cause duplicate content issues and 404 errors.",
      severity: "warning",
      category: "technical",
      recommendation:
        "Convert URL to lowercase. Example: '/rent/noida/sector-62' instead of '/Rent/Noida/Sector-62'",
      weight: 6,
    };
  }

  return {
    id: "URL-002",
    title: "URL uses lowercase characters",
    description: "All alphabetic characters in the URL are lowercase.",
    severity: "success",
    category: "technical",
    weight: 0,
  };
};

const checkHyphenSeparators = (slug: string): SeoIssue => {
  const hasUnderscore = /_/.test(slug);
  const hasSpace = /\s/.test(slug);
  const hasCamelCase = /[a-z][A-Z]/.test(slug);
  const hasHyphen = /-/.test(slug);

  if (hasUnderscore || hasSpace || hasCamelCase) {
    let issue = "underscores";
    if (hasSpace) issue = "spaces";
    else if (hasCamelCase) issue = "camelCase";

    return {
      id: "URL-003",
      title: "URL does not use hyphens as separators",
      description:
        `Search engines treat hyphens as word separators. ${issue} reduce keyword recognition.`,
      severity: "warning",
      category: "technical",
      recommendation:
        "Use hyphens to separate words. Example: '3bhk-apartment' instead of '3bhk_apartment' or '3bhkApartment'",
      weight: 6,
    };
  }

  return {
    id: "URL-003",
    title: "URL uses hyphens as separators",
    description: "Word boundaries in the URL use hyphens correctly.",
    severity: "success",
    category: "technical",
    weight: 0,
  };
};

const checkCityPresence = (slug: string, opts: RequiredAnalyzerOptions): SeoIssue => {
  if (!opts.requireCity || !opts.city || opts.city.trim().length === 0) {
    return {
      id: "URL-004",
      title: "City check disabled",
      description: "City mention is not required for this analysis.",
      severity: "info",
      category: "technical",
      weight: 0,
    };
  }

  const lowerSlug = slug.toLowerCase();
  const city = opts.city.toLowerCase();

  if (lowerSlug.includes(city)) {
    return {
      id: "URL-004",
      title: "City name present in URL",
      description: `The city "${opts.city}" was found in the URL slug.`,
      severity: "success",
      category: "technical",
      weight: 0,
    };
  }

  return {
    id: "URL-004",
    title: "City name missing from URL",
    description:
      `The city "${opts.city}" is not present in the URL slug. City keywords are strong local SEO signals.`,
    severity: "warning",
    category: "technical",
    recommendation: `Include the city name in the URL. Example: '/rent/{city}/...'`,
    weight: 6,
  };
};

const checkLocalityPresence = (slug: string, opts: RequiredAnalyzerOptions): SeoIssue => {
  if (!opts.locality || opts.locality.trim().length === 0) {
    return {
      id: "URL-005",
      title: "Locality check disabled",
      description: "Locality is not provided for this analysis.",
      severity: "info",
      category: "technical",
      weight: 0,
    };
  }

  if (!opts.requireLocality) {
    return {
      id: "URL-005",
      title: "Locality check optional",
      description: "Locality mention is optional for this analysis.",
      severity: "info",
      category: "technical",
      weight: 0,
    };
  }

  const lowerSlug = slug.toLowerCase();
  // Normalize both slug and locality: replace hyphens with spaces for matching
  const normalizedSlug = lowerSlug.replace(/-/g, " ");
  const normalizedLocality = opts.locality.toLowerCase().replace(/-/g, " ");

  if (normalizedSlug.includes(normalizedLocality) || lowerSlug.includes(normalizedLocality.replace(/\s/g, "-"))) {
    return {
      id: "URL-005",
      title: "Locality present in URL",
      description: `The locality "${opts.locality}" was found in the URL slug.`,
      severity: "success",
      category: "technical",
      weight: 0,
    };
  }

  return {
    id: "URL-005",
    title: "Locality missing from URL",
    description:
      `The locality "${opts.locality}" is not present in the URL slug. Locality keywords provide granular local SEO signals.`,
    severity: "warning",
    category: "technical",
    recommendation: `Include the locality name in the URL. Example: '/rent/noida/{sector-62}/...'`,
    weight: 6,
  };
};

const checkPropertyTypePresence = (slug: string, opts: RequiredAnalyzerOptions): SeoIssue => {
  if (!opts.requirePropertyType || !opts.propertyType || opts.propertyType.trim().length === 0) {
    return {
      id: "URL-006",
      title: "Property type check disabled",
      description: "Property type is not provided for this analysis.",
      severity: "info",
      category: "technical",
      weight: 0,
    };
  }

  const lowerSlug = slug.toLowerCase();
  const propertyType = opts.propertyType.toLowerCase();

  if (lowerSlug.includes(propertyType)) {
    return {
      id: "URL-006",
      title: "Property type present in URL",
      description: `The property type "${opts.propertyType}" was found in the URL slug.`,
      severity: "success",
      category: "technical",
      weight: 0,
    };
  }

  return {
    id: "URL-006",
    title: "Property type missing from URL",
    description:
      `The property type "${opts.propertyType}" is not present in the URL slug. Property type is a key user intent signal.`,
    severity: "warning",
    category: "technical",
    recommendation: `Include the property type in the URL. Example: '/rent/noida/sector-62/{3bhk-apartment}'`,
    weight: 6,
  };
};

const checkDuplicateHyphens = (slug: string): SeoIssue => {
  const hasDuplicateHyphens = /--/.test(slug);

  if (hasDuplicateHyphens) {
    return {
      id: "URL-007",
      title: "URL contains duplicate hyphens",
      description:
        "Multiple consecutive hyphens appear unprofessional and may indicate formatting errors.",
      severity: "warning",
      category: "technical",
      recommendation: "Remove duplicate hyphens. Use single hyphens between words only.",
      weight: 4,
    };
  }

  return {
    id: "URL-007",
    title: "URL has no duplicate hyphens",
    description: "The URL does not contain consecutive hyphens.",
    severity: "success",
    category: "technical",
    weight: 0,
  };
};

const checkSpecialCharacters = (slug: string, allowedSpecialChars: string): SeoIssue => {
  // Allowed: a-z, 0-9, hyphen, forward slash, and any user-specified allowed chars
  const allowedPattern = new RegExp(`^[a-z0-9\\-/ ${escapeRegExp(allowedSpecialChars)}]*$`);
  
  if (!allowedPattern.test(slug)) {
    const invalidChars = slug.match(/[^a-z0-9\-/\s]/gi) || [];
    const uniqueInvalidChars = [...new Set(invalidChars)].join(", ");
    
    return {
      id: "URL-008",
      title: "URL contains special characters",
      description:
        `Special characters (${uniqueInvalidChars}) must be URL-encoded, making URLs unreadable.`,
      severity: "warning",
      category: "technical",
      recommendation: "Remove special characters. Use only lowercase letters, numbers, and hyphens.",
      weight: 6,
    };
  }

  return {
    id: "URL-008",
    title: "URL has no special characters",
    description: "The URL contains only valid characters (a-z, 0-9, hyphens, slashes).",
    severity: "success",
    category: "technical",
    weight: 0,
  };
};

const checkLength = (slug: string, len: number, opts: RequiredAnalyzerOptions): SeoIssue => {
  const min = opts.minLength;
  const max = opts.maxLength;

  if (len < min) {
    return {
      id: "URL-009",
      title: "URL slug is too short",
      description:
        `The URL slug is ${len} characters. URLs shorter than ${min} characters may lack descriptive keywords.`,
      severity: "warning",
      category: "technical",
      recommendation: `Aim for ${min}-${max} characters. Include key descriptors while avoiding unnecessary words.`,
      currentValue: len,
      expectedValue: opts.idealLength,
      weight: 8,
    };
  }

  if (len > max) {
    return {
      id: "URL-009",
      title: "URL slug is too long",
      description:
        `The URL slug is ${len} characters (max recommended: ${max}). Long URLs are truncated in SERPs.`,
      severity: "warning",
      category: "technical",
      recommendation: `Shorten to ${min}-${max} characters. Remove unnecessary words while keeping key descriptors.`,
      currentValue: len,
      expectedValue: opts.idealLength,
      weight: 8,
    };
  }

  return {
    id: "URL-009",
    title: "URL slug length is optimal",
    description: `The URL slug is ${len} characters, which falls inside the optimal range (${min}-${max} characters).`,
    severity: "success",
    category: "technical",
    weight: 0,
  };
};

const checkQueryParams = (slug: string): SeoIssue => {
  const hasQueryParams = /[?&]/.test(slug);

  if (hasQueryParams) {
    return {
      id: "URL-010",
      title: "URL contains query parameters",
      description:
        "Query parameters in canonical URLs can cause duplicate content issues. Clean URLs are preferred for indexing.",
      severity: "warning",
      category: "technical",
      recommendation: "Remove query parameters from the canonical URL. Use clean path-based URLs for indexing.",
      weight: 6,
    };
  }

  return {
    id: "URL-010",
    title: "URL has no query parameters",
    description: "The URL does not contain query parameters.",
    severity: "success",
    category: "technical",
    weight: 0,
  };
};

/* ----------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------- */

function mergeOptions(opts: UrlAnalyzerOptions): RequiredAnalyzerOptions {
  return mergeAnalyzerOptions(opts, defaults);
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function finalize(
  urlSlug: string,
  slugLength: number,
  issues: SeoIssue[],
  passed: boolean,
  score: number,
  scoreBreakdown: ScoreBreakdown | undefined,
  hasCity: boolean,
  hasLocality: boolean,
  hasPropertyType: boolean,
  isLowercase: boolean,
  hasHyphens: boolean,
  hasDuplicateHyphens: boolean,
  hasSpecialChars: boolean,
  hasQueryParams: boolean
): UrlAnalysis {
  return {
    urlSlug,
    slugLength,
    passed,
    score,
    scoreBreakdown,
    issues: dedupeSeverity(issues),
    hasCity,
    hasLocality,
    hasPropertyType,
    isLowercase,
    hasHyphens,
    hasDuplicateHyphens,
    hasSpecialChars,
    hasQueryParams,
  };
}
