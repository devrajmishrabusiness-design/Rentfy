/**
 * Unit tests for keyword-analyzer.ts
 */

import { describe, it, expect } from "vitest";
import { analyzeKeywords } from "../keyword-analyzer";

describe("Core Functionality", () => {
  it("returns critical when content is undefined", () => {
    const result = analyzeKeywords(undefined);
    expect(result.passed).toBe(false);
    expect(result.issues.some((i) => i.id === "KW-001")).toBe(true);
  });

  it("returns critical when content is empty", () => {
    const result = analyzeKeywords("");
    expect(result.issues.some((i) => i.id === "KW-001")).toBe(true);
  });

  it("passes KW-001 with valid content and keyword", () => {
    const result = analyzeKeywords("Test content", { primaryKeyword: "test" });
    const kw001 = result.issues.find((i) => i.id === "KW-001" && i.title.includes("defined"));
    expect(kw001?.severity).toBe("success");
  });

  it("returns critical when primaryKeyword is empty", () => {
    const result = analyzeKeywords("Test", { primaryKeyword: "" });
    const kw001 = result.issues.find((i) => i.id === "KW-001" && i.title.includes("missing"));
    expect(kw001?.severity).toBe("critical");
  });
});

describe("KW-002: Keyword in Title", () => {
  it("returns success when keyword in title", () => {
    const result = analyzeKeywords("Test", { primaryKeyword: "test", title: "Test Title" });
    expect(result.inTitle).toBe(true);
  });

  it("returns warning when keyword missing from title", () => {
    const result = analyzeKeywords("Test", { primaryKeyword: "keyword", title: "Title" });
    expect(result.inTitle).toBe(false);
  });

  it("uses case-insensitive matching", () => {
    const result = analyzeKeywords("Test", { primaryKeyword: "TEST", title: "test title" });
    expect(result.inTitle).toBe(true);
  });
});

describe("KW-003: Keyword in H1", () => {
  it("returns success when keyword in H1", () => {
    const result = analyzeKeywords("Test", { primaryKeyword: "test", headings: [{ level: 1, text: "Test Heading" }] });
    expect(result.inH1).toBe(true);
  });

  it("returns warning when keyword missing from H1", () => {
    const result = analyzeKeywords("Test", { primaryKeyword: "keyword", headings: [{ level: 1, text: "Heading" }] });
    expect(result.inH1).toBe(false);
  });

  it("checks multiple H1s", () => {
    const result = analyzeKeywords("Test", {
      primaryKeyword: "second",
      headings: [{ level: 1, text: "First" }, { level: 1, text: "Second" }],
    });
    expect(result.inH1).toBe(true);
  });
});

describe("KW-004: Keyword in Meta Description", () => {
  it("returns success when keyword in meta", () => {
    const result = analyzeKeywords("Test", { primaryKeyword: "test", metaDescription: "Test description" });
    expect(result.inMetaDescription).toBe(true);
  });

  it("returns warning when keyword missing from meta", () => {
    const result = analyzeKeywords("Test", { primaryKeyword: "keyword", metaDescription: "Description" });
    expect(result.inMetaDescription).toBe(false);
  });
});

describe("KW-005: Keyword in URL", () => {
  it("returns success when keyword in URL", () => {
    const result = analyzeKeywords("Test", { primaryKeyword: "test", urlSlug: "/test-page" });
    expect(result.inUrl).toBe(true);
  });

  it("returns warning when keyword missing from URL", () => {
    const result = analyzeKeywords("Test", { primaryKeyword: "keyword", urlSlug: "/page" });
    expect(result.inUrl).toBe(false);
  });
});

describe("KW-006: Keyword Density", () => {
  it("returns success for optimal density", () => {
    const words = Array(200).fill("word");
    words[0] = "keyword";
    words[50] = "keyword";
    words[100] = "keyword";
    const result = analyzeKeywords(words.join(" "), { primaryKeyword: "keyword", minDensity: 0.5, maxDensity: 2.5 });
    const kw006 = result.issues.find((i) => i.id === "KW-006");
    expect(kw006?.severity).toBe("success");
  });

  it("returns warning for low density", () => {
    const result = analyzeKeywords(Array(200).fill("word").join(" "), { primaryKeyword: "keyword", minDensity: 0.5 });
    expect(result.densityStatus).toBe("too-low");
  });

  it("returns warning for high density", () => {
    const result = analyzeKeywords(Array(50).fill("keyword").join(" "), { primaryKeyword: "keyword", maxDensity: 2.5 });
    expect(result.densityStatus).toBe("too-high");
  });

  it("calculates zero occurrences as 0%", () => {
    const result = analyzeKeywords("No matches here", { primaryKeyword: "keyword" });
    expect(result.keywordDensity).toBe(0);
  });
});

describe("KW-007: Keyword Stuffing", () => {
  it("returns success when no paragraph exceeds max", () => {
    const content = "Keyword here.\n\nKeyword there.\n\nKeyword everywhere.";
    const result = analyzeKeywords(content, { primaryKeyword: "keyword", maxOccurrencesPerParagraph: 3 });
    const kw007 = result.issues.find((i) => i.id === "KW-007");
    expect(kw007?.severity).toBe("success");
  });

  it("returns warning when paragraph exceeds max", () => {
    const content = "Keyword keyword keyword keyword.\n\nNormal.";
    const result = analyzeKeywords(content, { primaryKeyword: "keyword", maxOccurrencesPerParagraph: 3 });
    const kw007 = result.issues.find((i) => i.id === "KW-007");
    expect(kw007?.severity).toBe("warning");
  });
});

describe("KW-008: Related Keywords", () => {
  it("returns success when minimum related found", () => {
    const result = analyzeKeywords("Test with apartment and rent", {
      primaryKeyword: "test",
      secondaryKeywords: ["apartment", "rent"],
      requireRelatedKeywords: true,
      minRelatedKeywordCount: 2,
    });
    const kw008 = result.issues.find((i) => i.id === "KW-008");
    expect(kw008?.severity).toBe("success");
  });

  it("returns info when below minimum", () => {
    const result = analyzeKeywords("Test with apartment", {
      primaryKeyword: "test",
      secondaryKeywords: ["apartment", "rent"],
      requireRelatedKeywords: true,
      minRelatedKeywordCount: 2,
    });
    const kw008 = result.issues.find((i) => i.id === "KW-008");
    expect(kw008?.severity).toBe("info");
  });

  it("skips when requireRelatedKeywords is false", () => {
    const result = analyzeKeywords("Test", { primaryKeyword: "test", secondaryKeywords: ["apt"], requireRelatedKeywords: false });
    const kw008 = result.issues.find((i) => i.id === "KW-008");
    expect(kw008).toBeUndefined();
  });
});

describe("KW-009: Keyword Distribution", () => {
  it("returns success with even distribution", () => {
    const content = "Keyword here.\n\nMore keyword.\n\nAnother keyword.";
    const result = analyzeKeywords(content, { primaryKeyword: "keyword" });
    const kw009 = result.issues.find((i) => i.id === "KW-009");
    expect(kw009?.severity).toBe("success");
  });

  it("returns info with clustered keywords", () => {
    const content = "Keyword keyword keyword.\n\nNone here.\n\nNone here either.";
    const result = analyzeKeywords(content, { primaryKeyword: "keyword" });
    const kw009 = result.issues.find((i) => i.id === "KW-009");
    expect(kw009?.severity).toBe("info");
  });
});

describe("KW-010: Duplicate Phrases", () => {
  it("returns success with no duplicate phrases", () => {
    const result = analyzeKeywords("Test apartment content. The unit is nice.", { primaryKeyword: "test apartment" });
    const kw010 = result.issues.find((i) => i.id === "KW-010");
    expect(kw010?.severity).toBe("success");
  });

  it("returns info with duplicate phrase within 100 words", () => {
    const result = analyzeKeywords("Test apartment here. More text. Test apartment there.", { primaryKeyword: "test apartment" });
    const kw010 = result.issues.find((i) => i.id === "KW-010");
    expect(kw010?.severity).toBe("info");
  });

  it("skips single-word keywords", () => {
    const result = analyzeKeywords("Test test test", { primaryKeyword: "test" });
    const kw010 = result.issues.find((i) => i.id === "KW-010");
    expect(kw010?.severity).toBe("success");
  });
});

describe("Scoring", () => {
  it("returns 100 for perfect usage", () => {
    const result = analyzeKeywords("Test keyword content. More content here. Additional information about the topic. The word appears naturally in this text. Some more content for good measure.", {
      primaryKeyword: "keyword",
      title: "Keyword Title",
      headings: [{ level: 1, text: "Keyword" }],
      metaDescription: "Keyword desc",
      urlSlug: "/keyword",
      minDensity: 0.5,
      maxDensity: 10,
      minContentLength: 10,
    });
    expect(result.score).toBe(100);
  });

  it("returns below 100 when keyword missing", () => {
    const result = analyzeKeywords("Content", { primaryKeyword: "keyword" });
    expect(result.score).toBeLessThan(100);
  });

  it("critical failure results in failed status", () => {
    const result = analyzeKeywords("Content", { primaryKeyword: "" });
    expect(result.passed).toBe(false);
  });

  it("info issues do not affect pass/fail", () => {
    const result = analyzeKeywords("Test keyword content here. Some more content about the topic. The word appears naturally in this text. Additional content for length purposes.", {
      primaryKeyword: "keyword",
      title: "Keyword Test Title",
      headings: [{ level: 1, text: "Keyword" }],
      metaDescription: "Keyword meta description",
      urlSlug: "/keyword",
      minDensity: 0.5,
      maxDensity: 10,
      minContentLength: 10,
      requireRelatedKeywords: true,
      secondaryKeywords: ["missing"],
    });
    expect(result.passed).toBe(true);
  });
});

describe("Edge Cases", () => {
  it("handles Unicode keywords", () => {
    const result = analyzeKeywords("测试内容有关键字", { primaryKeyword: "关键字" });
    expect(result.keywordOccurrences).toBe(1);
  });

  it("strips HTML tags", () => {
    const result = analyzeKeywords("<p>Test keyword</p>", { primaryKeyword: "keyword" });
    expect(result.keywordOccurrences).toBe(1);
  });

  it("handles very short content", () => {
    const result = analyzeKeywords("Keyword test", { primaryKeyword: "keyword" });
    expect(result.keywordDensity).toBeGreaterThan(0);
  });

  it("handles very long content", () => {
    const words = Array(5000).fill("word");
    for (let i = 0; i < 75; i++) words[i * 50] = "keyword";
    const result = analyzeKeywords(words.join(" "), { primaryKeyword: "keyword" });
    expect(result.keywordDensity).toBeCloseTo(1.5, 1);
  });

  it("matches numbers as keywords", () => {
    const result = analyzeKeywords("Test 3BHK content", { primaryKeyword: "3BHK" });
    expect(result.keywordOccurrences).toBe(1);
  });
});

describe("Output Contract", () => {
  it("returns all required fields", () => {
    const result = analyzeKeywords("Test keyword", { primaryKeyword: "keyword" });
    expect(result).toHaveProperty("primaryKeyword");
    expect(result).toHaveProperty("keywordOccurrences");
    expect(result).toHaveProperty("keywordDensity");
    expect(result).toHaveProperty("densityStatus");
    expect(result).toHaveProperty("inTitle");
    expect(result).toHaveProperty("inH1");
    expect(result).toHaveProperty("inMetaDescription");
    expect(result).toHaveProperty("inUrl");
    expect(result).toHaveProperty("relatedKeywordsFound");
    expect(result).toHaveProperty("relatedKeywordsMissing");
    expect(result).toHaveProperty("totalWords");
    expect(result).toHaveProperty("uniqueWords");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("issues");
  });

  it("returns correct densityStatus", () => {
    const low = analyzeKeywords("Test", { primaryKeyword: "keyword", minDensity: 0.5 });
    expect(low.densityStatus).toBe("too-low");

    const high = analyzeKeywords("Keyword keyword keyword", { primaryKeyword: "keyword", maxDensity: 10 });
    expect(high.densityStatus).toBe("too-high");
  });

  it("returns correct boolean flags", () => {
    const result = analyzeKeywords("Test keyword", {
      primaryKeyword: "keyword",
      title: "Keyword",
      headings: [{ level: 1, text: "Keyword" }],
      metaDescription: "Keyword",
      urlSlug: "/keyword",
    });
    expect(result.inTitle).toBe(true);
    expect(result.inH1).toBe(true);
    expect(result.inMetaDescription).toBe(true);
    expect(result.inUrl).toBe(true);
  });
});