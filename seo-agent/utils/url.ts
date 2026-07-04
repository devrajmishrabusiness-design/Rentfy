/**
 * URL helpers — pure, no fetch required.
 * Used by crawlers and analyzers for parsing/building URLs.
 */

export const isAbsoluteUrl = (url: string): boolean => {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
};

export const isInternalLink = (
  base: string,
  candidate: string
): boolean => {
  if (!candidate) return false;
  if (candidate.startsWith("#") || candidate.startsWith("mailto:"))
    return false;
  if (candidate.startsWith("/")) return true;
  try {
    const a = new URL(candidate);
    const b = new URL(base);
    return a.host === b.host;
  } catch {
    return false;
  }
};

/**
 * Normalize a URL by:
 *   - removing fragments
 *   - removing trailing slash (except root)
 *   - sorting query params
 */
export const normalizeUrl = (url: string): string => {
  try {
    const u = new URL(url);
    u.hash = "";
    const params = [...u.searchParams.entries()].sort(([a], [b]) =>
      a.localeCompare(b)
    );
    u.search = "";
    for (const [k, v] of params) u.searchParams.append(k, v);
    let normalized = u.toString();
    if (u.pathname === "/") return normalized;
    if (normalized.endsWith("/")) normalized = normalized.slice(0, -1);
    return normalized;
  } catch {
    return url;
  }
};

/**
 * Resolve a relative URL to absolute against a base.
 */
export const resolveUrl = (base: string, relative: string): string => {
  try {
    return new URL(relative, base).toString();
  } catch {
    return "";
  }
};

/**
 * Hostname only — useful for grouping pages by host.
 */
export const hostnameOf = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
};

/**
 * Pathname only — useful for grouping pages.
 */
export const pathnameOf = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
};
