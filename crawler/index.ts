/**
 * Crawler Engine public API.
 *
 * This single entry point provides the contract for consuming code (e.g.
 * SEO Engine, Website Graph, Internal Linking, etc.). It exports the pure
 * core logic (queue, visited set, site map helpers) and the orchestrator
 * (`CrawlerEngine`). It also re-exports all types. The adapter layer and
 * API route are kept in `lib/crawler` and `app/api/crawler` respectively
 * to avoid mixing framework-specific imports.
 */

// Types
export type {
  PageDiscoveryStatus,
  PageType,
  CrawlerLink,
  CrawledPage,
  CrawlStats,
  SiteMap,
  CrawlResult,
  CrawlerRunOptions,
  CrawlConfig,
} from "./types";

// Utils
export {
  isSameOrigin,
  isInternalHref,
  isNonNavigableHref,
} from "./utils/url";

export { detectPageType } from "./utils/page-type";

// Services types - import for local use and re-export
import type { PageFetcher, FetchOptions, FetchedPage } from "./services/page-fetcher";
import { extractLinks } from "./services/link-extractor";
import { HttpPageFetcher } from "./services/page-fetcher";
export type { FetchOptions, FetchedPage, ExtractedLink, PageFetcher } from "./services";
export { HttpPageFetcher } from "./services/page-fetcher";

/**
 * Simple in-memory fetcher that returns static HTML with extracted links.
 * Useful for tests or when the caller wants to avoid network calls.
 */
export class MemoryPageFetcher implements PageFetcher {
  private readonly pages: Map<string, string>;

  constructor(pages: Record<string, string> = {}) {
    this.pages = new Map(Object.entries(pages));
  }

  async fetch(url: string, options?: FetchOptions): Promise<FetchedPage> {
    void options;
    const html = this.pages.get(url) ?? "";
    const links = extractLinks(html);
    return { url, status: 200, ok: true, html, links };
  }
}

// Core primitives (engines, storage, etc.)
import { CrawlerEngine } from "./core";
import { MemoryCrawlStorage } from "./storage";
export { CrawlQueue, type QueueItem } from "./core";
export { VisitedSet } from "./core";
export { buildSiteMap } from "./core";

export {
  CrawlerEngine,
  resolveConfig,
  CRAWLER_VERSION,
  type CrawlerEngineDeps,
} from "./core";

export { MemoryCrawlStorage, type CrawlStorage } from "./storage";

// Factories (for convenience)
export const createDefaultFetcher = () => new HttpPageFetcher();
export const createDefaultStorage = () => new MemoryCrawlStorage();
export const createDefaultEngine = () =>
  new CrawlerEngine({
    fetcher: createDefaultFetcher(),
    storage: createDefaultStorage(),
  });
