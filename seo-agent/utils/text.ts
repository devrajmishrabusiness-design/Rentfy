/**
 * String / text utilities used across the SEO Agent.
 * These are written from scratch to avoid pulling in new dependencies.
 */

/**
 * Strip HTML tags from a string while keeping their inner text.
 * Good enough for word counting and readability checks.
 */
export const stripHtml = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]+>/g, " ");
};

/**
 * Collapse whitespace and lowercase for keyword / slug comparison.
 * Handles Unicode characters properly.
 */
export const normalize = (text: string): string =>
  (text || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/**
 * Convert a string to a URL-safe slug.
 */
export const slugify = (text: string): string =>
  normalize(text)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Truncate a string to a max length, prefixing with ellipsis if needed.
 */
export const truncate = (text: string, max: number): string => {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + "\u2026";
};

/**
 * Count words in a string. Words are whitespace-separated tokens.
 */
export const countWords = (text: string): number => {
  const cleaned = stripHtml(text).trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
};

/**
 * Compute keyword density as a percentage of total words.
 * Returns 0 if text is empty or keyword not found.
 */
export const keywordDensity = (text: string, keyword: string): number => {
  const words = countWords(text);
  if (words === 0 || !keyword) return 0;
  const target = normalize(keyword);
  const allText = normalize(stripHtml(text));
  const matches = allText.split(/\s+/).filter((w) => w === target).length;
  return (matches / words) * 100;
};

/**
 * Compute a simple Flesch reading ease score approximation.
 * Range 0 (hard) – 100 (easy). Returns null if input is too short.
 */
export const fleschReadingEase = (text: string): number | null => {
  const sentences = (stripHtml(text).match(/[.!?]+/g) || []).length || 1;
  const words = countWords(text);
  if (words < 10) return null;
  const syllables = stripHtml(text)
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .reduce((acc, word) => acc + countSyllables(word), 0);
  const score =
    206.835 -
    1.015 * (words / sentences) -
    84.6 * (syllables / words);
  return Math.max(0, Math.min(100, Number(score.toFixed(1))));
};

const countSyllables = (word: string): number => {
  if (!word) return 0;
  const trimmed = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  const matches = trimmed.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
};

/**
 * Find all occurrences of a substring, case-insensitive.
 */
export const findOccurrences = (haystack: string, needle: string): number => {
  if (!haystack || !needle) return 0;
  const hay = haystack.toLowerCase();
  const ndl = needle.toLowerCase();
  let count = 0;
  let idx = hay.indexOf(ndl);
  while (idx !== -1) {
    count++;
    idx = hay.indexOf(ndl, idx + ndl.length);
  }
  return count;
};
