/**
 * Page fetching service.
 *
 * Abstraction over "fetch a URL and return its HTML + extracted links".
 * The default `HttpPageFetcher` uses the platform `fetch`, but the
 * `PageFetcher` interface lets tests and future engines inject a stub
 * (file system, recorded fixture, headless browser, etc.).
 */

import { extractLinks, type ExtractedLink } from "./link-extractor";
import type { SharedConfig } from "@rentfy/engine-sdk";

/**
 * Result of fetching a single page.
 */
export interface FetchedPage {
  /** The URL that was requested (already normalized by the caller). */
  url: string;
  /** HTTP status code (only meaningful when `ok` is true). */
  status: number;
  /** Whether a response was received (status < 400). */
  ok: boolean;
  /** Response body as text. */
  html: string;
  /** Links extracted from the HTML. */
  links: ExtractedLink[];
}

/**
 * Per-fetch options.
 */
export interface FetchOptions {
  timeoutMs?: number;
  userAgent?: string;
}

/**
 * The single seam the crawler uses to retrieve pages. Implement this to
 * swap the transport (HTTP, filesystem, headless, mocked).
 */
export interface PageFetcher {
  fetch(url: string, options?: FetchOptions): Promise<FetchedPage>;
}

export interface HttpPageFetcherOptions {
  config?: SharedConfig;
}

/**
 * Default `PageFetcher` backed by the platform `fetch` (Node 18+ /
 * Edge runtime). Honors a per-request timeout via `AbortController`.
 */
export class HttpPageFetcher implements PageFetcher {
  private readonly config?: SharedConfig;

  constructor(options: HttpPageFetcherOptions = {}) {
    this.config = options.config;
  }

  async fetch(url: string, options: FetchOptions = {}): Promise<FetchedPage> {
    const timeoutMs = options.timeoutMs ?? (this.config?.get("timeoutMs") as number | undefined) ?? 10_000;
    const userAgent = options.userAgent ?? (this.config?.get("userAgent") as string | undefined) ?? "RentfyCrawler/0.1";

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": userAgent },
      });

      const status = response.status;
      const html = await response.text();
      const links = extractLinks(html);

      return {
        url,
        status,
        ok: response.ok,
        html,
        links,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

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
