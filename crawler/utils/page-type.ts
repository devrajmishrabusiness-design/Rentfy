/**
 * Page-type detection.
 *
 * Best-effort classification of a page from its URL path. Pure and
 * dependency-free so it can run during crawl without fetching content.
 * The resulting `PageType` is part of `CrawledPage` and is intended to
 * help future engines (Website Graph, Internal Linking) bucket pages.
 */

import type { PageType } from "../types";
import { pathnameOf } from "./url";

/** First-path-segment -> page type. Order does not matter. */
const SEGMENT_TYPE_MAP: Record<string, PageType> = {
  rent: "listing",
  rents: "listing",
  properties: "listing",
  property: "property",
  listings: "listing",
  blog: "article",
  article: "article",
  articles: "article",
  news: "article",
  category: "category",
  categories: "category",
  tag: "tag",
  tags: "tag",
  author: "author",
  authors: "author",
  search: "search",
};

/** File extensions that indicate a static asset rather than a page. */
const ASSET_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".css",
  ".js",
  ".json",
  ".xml",
  ".txt",
  ".zip",
  ".mp4",
  ".webm",
  ".woff",
  ".woff2",
  ".ttf",
]);

const hasAssetExtension = (pathname: string): boolean => {
  const lastSegment = pathname.split("/").pop() ?? "";
  const dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex <= 0) return false;
  return ASSET_EXTENSIONS.has(lastSegment.slice(dotIndex).toLowerCase());
};

/**
 * Classify a URL into a `PageType`.
 *
 * Resolution order:
 *   1. root (`/`) -> "root"
 *   2. asset extension -> "asset"
 *   3. known first-segment mapping
 *   4. otherwise -> "page"
 */
export const detectPageType = (url: string): PageType => {
  let pathname: string;
  try {
    pathname = pathnameOf(url);
    if (!pathname) pathname = new URL(url).pathname;
  } catch {
    return "unknown";
  }

  if (pathname === "/" || pathname === "") return "root";
  if (hasAssetExtension(pathname)) return "asset";

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "root";

  const mapped = SEGMENT_TYPE_MAP[segments[0].toLowerCase()];
  return mapped ?? "page";
};
