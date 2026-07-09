/**
 * Crawler Engine — Public Type Contracts
 *
 * Framework-agnostic types consumed by the crawler core, services,
 * storage, and any future engine (SEO, Website Graph, Performance,
 * Internal Linking, Automation, Knowledge Base) that needs crawl data.
 *
 * These types describe the *structure of a crawl*, not page analysis.
 * Analysis-oriented contracts (scores, issues, signals) live in the SEO
 * Engine. Keeping them separate preserves engine independence while
 * letting future engines build on top of `CrawlResult`.
 */

/**
 * Lifecycle status of a discovered URL within a single crawl run.
 * - `pending`: discovered but not yet dequeued
 * - `visited`: an HTTP response was received
 * - `failed`:  the fetch threw (network error / timeout)
 * - `skipped`: discovered but never crawled (depth or page cap reached)
 */
export type PageDiscoveryStatus =
  | "pending"
  | "visited"
  | "failed"
  | "skipped";

/**
 * Best-effort classification of a page from its URL. Designed to be
 * extended without breaking consumers — new enum members can be added
 * as new engines need finer granularity.
 */
export type PageType =
  | "root"
  | "page"
  | "listing"
  | "property"
  | "article"
  | "category"
  | "tag"
  | "author"
  | "search"
  | "asset"
  | "external"
  | "unknown";

/**
 * A raw link discovered while parsing a page. Internal vs external is
 * resolved relative to the crawl origin at extraction time.
 */
export interface CrawlerLink {
  /** URL the link was found on. */
  sourceUrl: string;
  /** Target as discovered (may be relative). */
  targetUrl: string;
  /** Link anchor text, if present. */
  anchor?: string;
  /** Whether the target shares origin with the crawl scope. */
  isInternal: boolean;
}

/**
 * A single discovered page in the site map.
 */
export interface CrawledPage {
  /** Normalized, canonical URL. Unique within a crawl. */
  url: string;
  /** Parent URL that linked to this page (`null` for the start URL). */
  parentUrl: string | null;
  /** Breadth-first depth from the start URL (start = 0). */
  depth: number;
  /** Best-effort page classification. */
  pageType: PageType;
  /** ISO timestamp the page was first discovered. */
  discoveredAt: string;
  /** Whether an HTTP response was received for this URL. */
  visited: boolean;
  /** HTTP status code, or `null` if the fetch failed before responding. */
  status: number | null;
  /** Normalized internal link targets found on this page. */
  internalLinks: string[];
  /**
   * Number of external links found on this page. Useful for the
   * future Internal Linking / Trust engines. Optional to keep the
   * contract light when not needed.
   */
  externalLinkCount?: number;
}

/**
 * Aggregate crawl statistics. Surfaced directly by the API.
 */
export interface CrawlStats {
  /** Unique URLs discovered (enqueued or skipped). */
  totalDiscovered: number;
  /** Pages for which an HTTP response was received. */
  totalVisited: number;
  /** Pages whose fetch threw. */
  totalFailed: number;
  /** Discovered URLs never crawled (depth/page cap). */
  totalSkipped: number;
  /** Maximum breadth-first depth reached. */
  maxDepth: number;
  /** Total external links encountered across all pages. */
  externalLinksFound: number;
  /** ISO timestamp the crawl started. */
  startedAt: string;
  /** ISO timestamp the crawl finished. */
  completedAt: string;
  /** Wall-clock duration in milliseconds. */
  durationMs: number;
}

/**
 * The complete in-memory site map: a flat page list plus parent/child
 * adjacency maps for O(1) graph traversal by future engines.
 */
export interface SiteMap {
  pages: CrawledPage[];
  /** `parentUrl -> [childUrl, ...]`. */
  childrenOf: Record<string, string[]>;
  /** `url -> parentUrl | null`. */
  parentOf: Record<string, string | null>;
}

/**
 * Full structured result of a crawl run.
 */
export interface CrawlResult {
  /** Normalized crawl origin. */
  startUrl: string;
  /** Crawler engine version that produced this result. */
  engine: string;
  /** All discovered pages. */
  pages: CrawledPage[];
  /** Built site map with adjacency maps. */
  siteMap: SiteMap;
  /** Aggregate statistics. */
  stats: CrawlStats;
}

/**
 * Default + caller-overridable crawl options.
 */
export interface CrawlerRunOptions {
  /** Maximum breadth-first depth (start URL is depth 0). */
  maxDepth?: number;
  /** Hard cap on number of pages fetched in one run. */
  maxPages?: number;
  /** Only follow links on the same origin as the start URL. */
  sameOriginOnly?: boolean;
  /** Per-fetch timeout in milliseconds. */
  timeoutMs?: number;
  /** User-Agent header sent with fetch requests. */
  userAgent?: string;
}

/**
 * Fully-resolved crawl configuration used internally by the engine.
 */
export interface CrawlConfig {
  startUrl: string;
  maxDepth: number;
  maxPages: number;
  sameOriginOnly: boolean;
  timeoutMs: number;
  userAgent: string;
}
