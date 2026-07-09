import { describe, it, expect } from "vitest";
import { VisitedSet } from "@/crawler/core/visited-set";

describe("VisitedSet", () => {
  it("starts empty", () => {
    const v = new VisitedSet();
    expect(v.size).toBe(0);
    expect(v.has("https://example.com")).toBe(false);
  });

  it("adds and reports presence", () => {
    const v = new VisitedSet();
    v.add("https://example.com/page");
    expect(v.has("https://example.com/page")).toBe(true);
    expect(v.size).toBe(1);
  });

  it("de-duplicates URLs", () => {
    const v = new VisitedSet();
    v.add("https://example.com/page");
    v.add("https://example.com/page");
    expect(v.size).toBe(1);
  });

  it("values returns all added URLs", () => {
    const v = new VisitedSet();
    v.add("https://example.com/a");
    v.add("https://example.com/b");
    const vals = v.values();
    expect(vals).toHaveLength(2);
    expect(vals).toContain("https://example.com/a");
    expect(vals).toContain("https://example.com/b");
  });
});