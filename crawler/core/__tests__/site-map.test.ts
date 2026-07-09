import { describe, it, expect } from "vitest";
import { buildSiteMap } from "@/crawler/core/site-map";
import type { CrawledPage } from "@/crawler/types";

describe("buildSiteMap", () => {
  it("builds empty maps for an empty page list", () => {
    const map = buildSiteMap([]);
    expect(map.pages).toEqual([]);
    expect(map.childrenOf).toEqual({});
    expect(map.parentOf).toEqual({});
  });

  it("builds parent/child adjacency from pages", () => {
    const pages: CrawledPage[] = [
      {
        url: "https://example.com",
        parentUrl: null,
        depth: 0,
        pageType: "root",
        discoveredAt: "2024-01-01T00:00:00.000Z",
        visited: true,
        status: 200,
        internalLinks: ["https://example.com/about"],
      },
      {
        url: "https://example.com/about",
        parentUrl: "https://example.com",
        depth: 1,
        pageType: "page",
        discoveredAt: "2024-01-01T00:00:00.000Z",
        visited: true,
        status: 200,
        internalLinks: [],
      },
    ];
    const map = buildSiteMap(pages);
    expect(map.parentOf["https://example.com"]).toBeNull();
    expect(map.parentOf["https://example.com/about"]).toBe("https://example.com");
    expect(map.childrenOf["https://example.com"]).toEqual(["https://example.com/about"]);
  });

  it("is a pure function (does not mutate input)", () => {
    const pages: CrawledPage[] = [
      {
        url: "https://example.com",
        parentUrl: null,
        depth: 0,
        pageType: "root",
        discoveredAt: "2024-01-01T00:00:00.000Z",
        visited: true,
        status: 200,
        internalLinks: [],
      },
    ];
    const map = buildSiteMap(pages);
    expect(map.pages).not.toBe(pages);
  });
});