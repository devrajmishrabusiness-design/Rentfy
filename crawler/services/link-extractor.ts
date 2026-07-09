/**
 * HTML link extraction.
 *
 * Pure, dependency-free parsing of anchor tags from raw HTML. Intentionally
 * avoids a full DOM parser so the crawler can run in any JS runtime and
 * stay testable without a browser. The extractor only pulls href + anchor
 * text; origin classification happens in the engine via the URL utils.
 */

import { stripHtml } from "@/seo-agent";

/**
 * A link as found in the source HTML (target may be relative).
 */
export interface ExtractedLink {
  /** Raw href attribute (may be relative or non-navigable). */
  href: string;
  /** Inner text of the anchor, with HTML stripped. */
  anchor: string;
}

// Captures <a ... href="..." ...>inner</a>. The href is matched anywhere
// in the tag attributes, and the inner content up to the closing tag.
const ANCHOR_RE =
  /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Extract all anchor links from an HTML string.
 *
 * - Returns an empty array for empty input (no throw).
 * - De-duplicates by raw href within a single document.
 * - Anchor text is HTML-stripped and trimmed.
 */
export const extractLinks = (html: string): ExtractedLink[] => {
  if (!html) return [];
  const links: ExtractedLink[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  ANCHOR_RE.lastIndex = 0;
  while ((match = ANCHOR_RE.exec(html)) !== null) {
    const href = match[1].trim();
    if (!href || seen.has(href)) continue;
    seen.add(href);
    links.push({ href, anchor: stripHtml(match[2]).trim() });
  }
  return links;
};
