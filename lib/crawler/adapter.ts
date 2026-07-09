/**
 * Crawler Integration Adapter
 *
 * Bridges generic HTTP requests and the framework-agnostic Crawler Engine.
 * Responsibilities:
 *   - Validate input shape
 *   - Construct the engine with a real fetcher
 *   - Run the crawl and return structured results
 *   - Optionally map to SEO Engine's CrawlResult for future compatibility
 *
 * Non-responsibilities:
 *   - Persisting results (future: database, file, cache)
 *   - URL discovery beyond what the engine provides
 *   - Page analysis (delegated to SEO Engine)
 */

import { CrawlerEngine, HttpPageFetcher, type CrawlResult, type CrawlerRunOptions } from "@/crawler";
import type { CrawlerEngineDeps } from "@/crawler/core";
import type { CrawledPage, CrawlLink } from "@/seo-agent/types";

export interface CrawlerRunInput {
  /** The starting URL for the crawl. Required. */
  url: string;
  /** Maximum breadth-first depth (default: 3). */
  maxDepth?: number;
  /** Maximum pages to fetch (default: 200). */
  maxPages?: number;
  /** Only follow same-origin links (default: true). */
  sameOriginOnly?: boolean;
  /** Per-request timeout in ms (default: 10000). */
  timeoutMs?: number;
  /** Request User-Agent header. */
  userAgent?: string;
}

export interface CrawlerRunResult {
  ok: boolean;
  result?: CrawlResult;
  error?: { message: string };
}

/**
 * Validate the crawler input shape. Returns an error message string on
 * failure, or `null` on success. Never throws.
 */
export const validateCrawlerInput = (input: unknown): string | null => {
  if (input === null || typeof input !== "object") {
    return "Request body must be a JSON object.";
  }
  const obj = input as Record<string, unknown>;
  if (typeof obj.url !== "string" || obj.url.trim() === "") {
    return "Field `url` is required and must be a non-empty string.";
  }
  if (obj.maxDepth !== undefined && typeof obj.maxDepth !== "number") {
    return "Field `maxDepth` must be a number.";
  }
  if (obj.maxPages !== undefined && typeof obj.maxPages !== "number") {
    return "Field `maxPages` must be a number.";
  }
  if (obj.sameOriginOnly !== undefined && typeof obj.sameOriginOnly !== "boolean") {
    return "Field `sameOriginOnly` must be a boolean.";
  }
  if (obj.timeoutMs !== undefined && typeof obj.timeoutMs !== "number") {
    return "Field `timeoutMs` must be a number.";
  }
  return null;
};

/**
 * Run a crawl from the given URL.
 *
 * The adapter owns engine construction so the API route stays thin.
 * It never throws — failures are returned as `{ ok: false, error: ... }`.
 */
export const runCrawl = async (
  input: unknown,
  options?: { fetcher?: NonNullable<CrawlerEngineDeps["fetcher"]> }
): Promise<CrawlerRunResult> => {
  const validationError = validateCrawlerInput(input);
  if (validationError) {
    return { ok: false, error: { message: validationError } };
  }

  const { url, maxDepth, maxPages, sameOriginOnly, timeoutMs, userAgent } =
    input as CrawlerRunInput;

  const runOptions: CrawlerRunOptions = {
    maxDepth,
    maxPages,
    sameOriginOnly,
    timeoutMs,
    userAgent,
  };

  const engine = new CrawlerEngine({
    fetcher: options?.fetcher ?? new HttpPageFetcher(),
  });

  try {
    const result = await engine.run(url, runOptions);
    return { ok: true, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: { message } };
  }
};

/**
 * Map a `CrawlResult` to the SEO Engine's `CrawlResult` contract.
 *
 * This adapter enables future engines (SEO, Internal Linking, etc.)
 * to consume crawler data without knowing the crawler implementation.
 * It is intentionally kept lightweight — no analysis, just structure.
 */
export const mapToSeoCrawlResult = (crawl: CrawlResult): {
  startUrl: string;
  completedAt: string;
  pages: CrawledPage[];
  brokenLinks: CrawlLink[];
  totalPages: number;
  totalBroken: number;
} => {
  const brokenLinks: CrawlLink[] = crawl.pages
    .flatMap((p) => p.internalLinks.map((target) => ({
      sourceUrl: p.url,
      targetUrl: target,
      isInternal: true,
      isBroken: false, // Filled by later analysis
    })));

  return {
    startUrl: crawl.startUrl,
    completedAt: crawl.stats.completedAt,
    pages: crawl.pages.map((p) => ({
      url: p.url,
      status: p.status ?? 0,
      title: undefined,
      metaDescription: undefined,
      h1: undefined,
      wordCount: undefined,
      outgoingLinks: [],
      imagesTotal: undefined,
      imagesWithoutAlt: undefined,
      loadTimeMs: undefined,
      sizeKb: undefined,
      discoveredAt: p.discoveredAt,
      depth: p.depth,
      fromUrl: p.parentUrl,
    })) as CrawledPage[],
    brokenLinks,
    totalPages: crawl.stats.totalDiscovered,
    totalBroken: 0,
  };
};

// Re-export types for convenience
export type { CrawlResult, CrawlerRunOptions } from "@/crawler";
export type { CrawlerEngineDeps } from "@/crawler/core";