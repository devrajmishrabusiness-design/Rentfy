/**
 * URL utilities for the Crawler Engine.
 *
 * The crawler depends ONLY on the generic, framework-agnostic URL
 * helpers already shipped by the SEO Agent (`normalizeUrl`,
 * `resolveUrl`, `isInternalLink`, `hostnameOf`, `pathnameOf`,
 * `isAbsoluteUrl`). Re-exporting them here gives the crawler a stable,
 * self-documented surface while keeping a single source of truth — no
 * logic is duplicated.
 *
 * Crawler-specific helpers that are NOT already covered by the SEO
 * Agent are implemented below.
 */

export {
  isAbsoluteUrl,
  isInternalLink,
  normalizeUrl,
  resolveUrl,
  hostnameOf,
  pathnameOf,
} from "@/seo-agent";

import { isInternalLink } from "@/seo-agent";

/**
 * True when `candidate` resolves to the same origin as `base`.
 * Origin = scheme + host + port.
 */
export const isSameOrigin = (base: string, candidate: string): boolean => {
  try {
    return new URL(candidate, base).origin === new URL(base).origin;
  } catch {
    return false;
  }
};

/**
 * Convenience alias matching the crawler vocabulary. A href is
 * internal with respect to `base` when it is same-origin or
 * site-relative and not a mailto/tel/# link.
 */
export const isInternalHref = (base: string, href: string): boolean =>
  isInternalLink(base, href);

/**
 * Hrefs that should never be queued regardless of origin.
 * mailto:, tel:, javascript:, data:, and fragment-only links.
 */
export const isNonNavigableHref = (href: string): boolean => {
  if (!href) return true;
  const lower = href.trim().toLowerCase();
  return (
    lower.startsWith("#") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:") ||
    lower.startsWith("javascript:") ||
    lower.startsWith("data:")
  );
};
