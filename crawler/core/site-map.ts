/**
 * Site map construction.
 *
 * Pure transform from a flat list of `CrawledPage` records into a
 * `SiteMap` with parent/child adjacency maps. Kept separate from the
 * engine so it can be unit-tested and reused by future engines (Website
 * Graph, Internal Linking) without re-crawling.
 */

import type { CrawledPage, SiteMap } from "../types";

/**
 * Build a `SiteMap` from crawled pages.
 *
 * `childrenOf[parent]` lists every child URL discovered from `parent`.
 * `parentOf[url]` points back to the single discoverer (BFS keeps the
 * shallowest parent). Both maps are complete over the page set.
 */
export const buildSiteMap = (pages: CrawledPage[]): SiteMap => {
  const childrenOf: Record<string, string[]> = {};
  const parentOf: Record<string, string | null> = {};

  for (const page of pages) {
    parentOf[page.url] = page.parentUrl;
    if (page.parentUrl) {
      const siblings = childrenOf[page.parentUrl] ?? [];
      siblings.push(page.url);
      childrenOf[page.parentUrl] = siblings;
    }
  }

  return { pages: [...pages], childrenOf, parentOf };
};
