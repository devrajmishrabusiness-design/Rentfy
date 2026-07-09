import { describe, it, expect } from "vitest";
import { CrawlerEngine, HttpPageFetcher } from "@/crawler/core/crawler-engine";
import type { FetchedPage } from "@/crawler/services/page-fetcher";

class TestFetcher implements HttpPageFetcher {
  private readonly pages: Record<string, FetchedPage>;

  constructor(pages: Record<string, FetchedPage>) {
    this.pages = pages;
  }

  async fetch(url: string): Promise<FetchedPage> {
    return this.pages[url] ?? {
      url,
      status: 404,
      ok: false,
      html: "",
      links: [],
    };
  }
}

describe("CrawlerEngine", () => {
  it("returns the start URL when it has no internal links", async () => {
    const fetcher = new TestFetcher({
      "https://example.com/": {
        url: "https://example.com/",
        status: 200,
        ok: true,
        html: "<html><body>No links</body></html>",
        links: [],
      },
    });

    const engine = new CrawlerEngine({ fetcher });
    const result = await engine.run("https://example.com", { maxPages: 1 });

    expect(result.startUrl).toBe("https://example.com/");
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].url).toBe("https://example.com/");
    expect(result.pages[0].depth).toBe(0);
    expect(result.pages[0].parentUrl).toBeNull();
    expect(result.stats.totalVisited).toBe(1);
    expect(result.stats.totalDiscovered).toBe(1);
  });

  it("discovers and visits linked pages", async () => {
    const fetcher = new TestFetcher({
      "https://example.com/": {
        url: "https://example.com/",
        status: 200,
        ok: true,
        html: '<html><body><a href="/about">About</a></body></html>',
        links: [{ href: "/about", anchor: "About" }],
      },
      "https://example.com/about": {
        url: "https://example.com/about",
        status: 200,
        ok: true,
        html: "<html><body>About page</body></html>",
        links: [],
      },
    });

    const engine = new CrawlerEngine({ fetcher });
    const result = await engine.run("https://example.com", { maxPages: 10 });

    expect(result.pages).toHaveLength(2);
    const urls = result.pages.map((p) => p.url).sort();
    expect(urls).toEqual(["https://example.com/", "https://example.com/about"]);
    expect(result.stats.totalVisited).toBe(2);
    expect(result.stats.totalDiscovered).toBe(2);
  });

  it("skips external links when sameOriginOnly is true", async () => {
    const fetcher = new TestFetcher({
      "https://example.com/": {
        url: "https://example.com/",
        status: 200,
        ok: true,
        html: '<html><body><a href="https://external.com">External</a><a href="/internal">Internal</a></body></html>',
        links: [
          { href: "https://external.com", anchor: "External" },
          { href: "/internal", anchor: "Internal" },
        ],
      },
      "https://example.com/internal": {
        url: "https://example.com/internal",
        status: 200,
        ok: true,
        html: "<html><body>Internal</body></html>",
        links: [],
      },
    });

    const engine = new CrawlerEngine({ fetcher });
    const result = await engine.run("https://example.com", {
      sameOriginOnly: true,
      maxPages: 10,
    });

    expect(result.pages).toHaveLength(2);
    const urls = result.pages.map((p) => p.url).sort();
    expect(urls).toEqual(["https://example.com/", "https://example.com/internal"]);
    expect(result.stats.externalLinksFound).toBe(1);
  });

  it("respects maxDepth", async () => {
    const fetcher = new TestFetcher({
      "https://example.com/": {
        url: "https://example.com/",
        status: 200,
        ok: true,
        html: '<html><body><a href="/level1">L1</a></body></html>',
        links: [{ href: "/level1", anchor: "L1" }],
      },
      "https://example.com/level1": {
        url: "https://example.com/level1",
        status: 200,
        ok: true,
        html: '<html><body><a href="/level2">L2</a></body></html>',
        links: [{ href: "/level2", anchor: "L2" }],
      },
      "https://example.com/level2": {
        url: "https://example.com/level2",
        status: 200,
        ok: true,
        html: "<html><body>Level 2</body></html>",
        links: [],
      },
    });

    const engine = new CrawlerEngine({ fetcher });
    const result = await engine.run("https://example.com", { maxDepth: 1, maxPages: 10 });

    // Depth 0: start URL
    // Depth 1: /level1
    // Depth 2: /level2 should be skipped because maxDepth=1
    expect(result.pages).toHaveLength(2);
    const urls = result.pages.map((p) => p.url).sort();
    expect(urls).toEqual(["https://example.com/", "https://example.com/level1"]);
  });
});