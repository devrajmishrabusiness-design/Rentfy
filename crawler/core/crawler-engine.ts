/**
 * Crawler Engine — core breadth-first crawl orchestrator.
 *
 * Responsibilities:
 *   - Drive a BFS over internal links starting from a root URL.
 *   - De-duplicate via a `VisitedSet`.
 *   - Track depth, parent/child relationships, and discovery times.
 *   - Skip external domains and non-navigable hrefs.
 *   - Normalize URLs before storing.
 *   - Build a complete in-memory `SiteMap`.
 *   - Hand back a structured `CrawlResult`.
 *
 * Non-responsibilities (left to other engines / layers):
 *   - Page analysis / SEO scoring (SEO Engine).
 *   - Persistence to a database (storage abstraction only).
 *   - HTTP transport details (delegated to `PageFetcher`).
 *
 * The engine is framework-agnostic: no Next.js, React, or Supabase. The
 * `lib/crawler` adapter and `app/api/crawler` route are the only places
 * that know about HTTP/infra.
 */

import type {
  CrawlConfig,
  CrawlResult,
  CrawledPage,
  CrawlerRunOptions,
  PageType,
} from "../types";
import {
  isInternalHref,
  isNonNavigableHref,
  isSameOrigin,
  normalizeUrl,
  resolveUrl,
} from "../utils/url";
import { detectPageType } from "../utils/page-type";
import { CrawlQueue, type QueueItem } from "./queue";
import { VisitedSet } from "./visited-set";
import { buildSiteMap } from "./site-map";
import type { CrawlStorage } from "../storage";
import type { PageFetcher } from "../services";

export const CRAWLER_VERSION = "0.1.0-core";

import { SharedConfig, MemoryConfigProvider } from "@rentfy/engine-sdk";

const CRAWLER_DEFAULTS: Omit<CrawlConfig, "startUrl"> = {
  maxDepth: 3,
  maxPages: 200,
  sameOriginOnly: true,
  timeoutMs: 10_000,
  userAgent: "RentfyCrawler/0.1",
};

const crawlerConfig = new SharedConfig({ providers: [new MemoryConfigProvider()] });
crawlerConfig.register("maxDepth", { type: "number", defaultValue: CRAWLER_DEFAULTS.maxDepth });
crawlerConfig.register("maxPages", { type: "number", defaultValue: CRAWLER_DEFAULTS.maxPages });
crawlerConfig.register("sameOriginOnly", { type: "boolean", defaultValue: CRAWLER_DEFAULTS.sameOriginOnly });
crawlerConfig.register("timeoutMs", { type: "number", defaultValue: CRAWLER_DEFAULTS.timeoutMs });
crawlerConfig.register("userAgent", { type: "string", defaultValue: CRAWLER_DEFAULTS.userAgent });

export { crawlerConfig };

/**
 * Dependencies the engine needs. `fetcher` is required; `storage` is
 * optional (in-memory / future persistence).
 */
export interface CrawlerEngineDeps {
  fetcher: PageFetcher;
  storage?: CrawlStorage;
}

/**
 * Resolve caller options into a fully-populated `CrawlConfig`.
 */
export const resolveConfig = (
  startUrl: string,
  options: CrawlerRunOptions = {}
): CrawlConfig => ({
  startUrl: normalizeUrl(startUrl),
  maxDepth: options.maxDepth ?? (crawlerConfig.get("maxDepth") as number),
  maxPages: options.maxPages ?? (crawlerConfig.get("maxPages") as number),
  sameOriginOnly: options.sameOriginOnly ?? (crawlerConfig.get("sameOriginOnly") as boolean),
  timeoutMs: options.timeoutMs ?? (crawlerConfig.get("timeoutMs") as number),
  userAgent: options.userAgent ?? (crawlerConfig.get("userAgent") as string),
});

/**
 * Construct an initial `CrawledPage` record for a queued item (pre-fetch).
 */
const toPageRecord = (
  item: QueueItem,
  discoveredAt: string
): CrawledPage => ({
  url: item.url,
  parentUrl: item.parentUrl,
  depth: item.depth,
  pageType: detectPageType(item.url),
  discoveredAt,
  visited: false,
  status: null,
  internalLinks: [],
});

/**
 * The Crawler Engine.
 */
export class CrawlerEngine {
  readonly version = CRAWLER_VERSION;
  private readonly fetcher: PageFetcher;
  private readonly storage?: CrawlStorage;

  constructor(deps: CrawlerEngineDeps) {
    this.fetcher = deps.fetcher;
    this.storage = deps.storage;
  }

  /**
   * Run a breadth-first crawl from `startUrl`.
   *
   * @returns a structured `CrawlResult` with pages, site map, and stats.
   * @throws only for programming errors (e.g. invalid start URL that
   *         cannot be normalized); transport failures are isolated per
   *         page and recorded in the result rather than thrown.
   */
  async run(startUrl: string, options: CrawlerRunOptions = {}): Promise<CrawlResult> {
    const config = resolveConfig(startUrl, options);
    const startedAt = new Date().toISOString();
    const startedMs = Date.now();

    const queue = new CrawlQueue();
    const visited = new VisitedSet();
    const pages = new Map<string, CrawledPage>();

    // Seed the frontier with the normalized start URL.
    queue.enqueue({ url: config.startUrl, parentUrl: null, depth: 0 });
    visited.add(config.startUrl);

    let externalLinksFound = 0;
    let totalFailed = 0;
    let maxDepth = 0;

    while (!queue.isEmpty) {
      // Respect the page cap regardless of remaining depth.
      if (pages.size >= config.maxPages) break;

      const item = queue.dequeue() as QueueItem;
      maxDepth = Math.max(maxDepth, item.depth);

      const page = toPageRecord(item, startedAt);
      pages.set(item.url, page);

      // Fetch the page. Transport failures are isolated per page.
      let fetched;
      try {
        fetched = await this.fetcher.fetch(item.url, {
          timeoutMs: config.timeoutMs,
          userAgent: config.userAgent,
        });
      } catch {
        page.status = null;
        page.visited = false;
        totalFailed++;
        continue;
      }

      page.status = fetched.status;
      page.visited = fetched.ok;

      const internalTargets: string[] = [];
      let externalCount = 0;

      for (const link of fetched.links) {
        const href = link.href.trim();
        if (isNonNavigableHref(href)) continue;

        // External-domain rejection (or same-origin enforcement).
        const internal = isInternalHref(item.url, href);
        if (!internal || (config.sameOriginOnly && !isSameOrigin(item.url, href))) {
          externalLinksFound++;
          externalCount++;
          continue;
        }

        const resolved = normalizeUrl(resolveUrl(item.url, href));
        if (!resolved) continue;

        // De-duplicate: only enqueue URLs never seen before.
        if (!visited.has(resolved)) {
          visited.add(resolved);
          if (item.depth + 1 <= config.maxDepth) {
            queue.enqueue({
              url: resolved,
              parentUrl: item.url,
              depth: item.depth + 1,
            });
          }
        }
        internalTargets.push(resolved);
      }

      page.internalLinks = internalTargets;
      page.externalLinkCount = externalCount;
    }

    const crawledPages = [...pages.values()];
    const siteMap = buildSiteMap(crawledPages);
    const completedAt = new Date().toISOString();

    const result: CrawlResult = {
      startUrl: config.startUrl,
      engine: this.version,
      pages: crawledPages,
      siteMap,
      stats: {
        totalDiscovered: visited.size,
        totalVisited: crawledPages.length,
        totalFailed,
        // Discovered but never dequeued (depth/page cap).
        totalSkipped: visited.size - crawledPages.length,
        maxDepth,
        externalLinksFound,
        startedAt,
        completedAt,
        durationMs: Date.now() - startedMs,
      },
    };

    if (this.storage) {
      await this.storage.save(result);
    }

    return result;
  }
}

// Re-export the page-type union for convenience at the engine boundary.
export type { PageType };
