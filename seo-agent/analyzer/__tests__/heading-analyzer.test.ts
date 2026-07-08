/**
 * Unit tests for heading-analyzer.ts
 *
 * Pure function tests using Vitest.
 * Run with: npx vitest run seo-agent/analyzer/__tests__/heading-analyzer.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  analyzeHeadings,
  type HeadingAnalysis,
  type HeadingAnalyzerOptions,
  type Heading,
} from "../heading-analyzer";

/* ----------------------------------------------------------------
 * Helper to create headings
 * ---------------------------------------------------------------- */

const h = (level: number, text: string): Heading => ({
  level: level as 1 | 2 | 3 | 4 | 5 | 6,
  text,
});

/* ----------------------------------------------------------------
 * 1. Core Functionality
 * ---------------------------------------------------------------- */

describe("Core Functionality", () => {
  it("returns missing H1 issue when headings is undefined", () => {
    const result = analyzeHeadings(undefined);
    expect(result.passed).toBe(false);
    expect(result.hasH1).toBe(false);
    expect(result.issues.some((i) => i.id === "HDG-001")).toBe(true);
    expect(result.issues.find((i) => i.id === "HDG-001")?.severity).toBe(
      "critical"
    );
  });

  it("returns missing H1 issue when headings is empty array", () => {
    const result = analyzeHeadings([]);
    expect(result.issues.some((i) => i.id === "HDG-001")).toBe(true);
    expect(result.issues.find((i) => i.id === "HDG-001")?.severity).toBe(
      "critical"
    );
  });

  it("treats null as undefined", () => {
    const result = analyzeHeadings(null as any);
    expect(result.issues.some((i) => i.id === "HDG-001")).toBe(true);
  });

  it("passes HDG-001 with valid array containing one H1", () => {
    const result = analyzeHeadings([h(1, "Title"), h(2, "Section")]);
    const hdg001 = result.issues.find((i) => i.id === "HDG-001");
    expect(hdg001?.severity).toBe("success");
  });

  it("fails HDG-001 with multiple H1s", () => {
    const result = analyzeHeadings([
      h(1, "Title 1"),
      h(1, "Title 2"),
      h(2, "Section"),
    ]);
    const hdg001 = result.issues.find((i) => i.id === "HDG-001");
    expect(hdg001?.severity).toBe("critical");
  });

  it("fails HDG-001 with no H1", () => {
    const result = analyzeHeadings([h(2, "Section"), h(3, "Subsection")]);
    const hdg001 = result.issues.find((i) => i.id === "HDG-001");
    expect(hdg001?.severity).toBe("critical");
  });
});

/* ----------------------------------------------------------------
 * 2. H1 Existence (HDG-001)
 * ---------------------------------------------------------------- */

describe("HDG-001: Exactly One H1 Exists", () => {
  it("returns success for exactly one H1", () => {
    const result = analyzeHeadings([h(1, "Title")]);
    const hdg001 = result.issues.find((i) => i.id === "HDG-001");
    expect(hdg001?.severity).toBe("success");
  });

  it("returns critical for zero H1s", () => {
    const result = analyzeHeadings([h(2, "Section")]);
    const hdg001 = result.issues.find((i) => i.id === "HDG-001");
    expect(hdg001?.severity).toBe("critical");
  });

  it("returns critical for two H1s", () => {
    const result = analyzeHeadings([h(1, "Title 1"), h(1, "Title 2")]);
    const hdg001 = result.issues.find((i) => i.id === "HDG-001");
    expect(hdg001?.severity).toBe("critical");
  });

  it("returns critical for three+ H1s", () => {
    const result = analyzeHeadings([
      h(1, "Title 1"),
      h(1, "Title 2"),
      h(1, "Title 3"),
    ]);
    const hdg001 = result.issues.find((i) => i.id === "HDG-001");
    expect(hdg001?.severity).toBe("critical");
  });

  it("reports H1 count correctly in metadata", () => {
    const result = analyzeHeadings([
      h(1, "Title"),
      h(2, "S1"),
      h(2, "S2"),
      h(3, "S3"),
    ]);
    expect(result.h1Count).toBe(1);
    expect(result.h2Count).toBe(2);
    expect(result.h3Count).toBe(1);
    expect(result.totalHeadings).toBe(4);
  });
});

/* ----------------------------------------------------------------
 * 3. H1 Empty (HDG-002)
 * ---------------------------------------------------------------- */

describe("HDG-002: H1 Is Not Empty", () => {
  it("passes with non-empty H1 text", () => {
    const result = analyzeHeadings([h(1, "Luxury Apartment")]);
    const hdg002 = result.issues.find((i) => i.id === "HDG-002");
    expect(hdg002?.severity).toBe("success");
  });

  it("fails with empty string H1", () => {
    const result = analyzeHeadings([h(1, "")]);
    const hdg002 = result.issues.find((i) => i.id === "HDG-002");
    expect(hdg002?.severity).toBe("critical");
  });

  it("fails with whitespace-only H1", () => {
    const result = analyzeHeadings([h(1, "   \t\n  ")]);
    const hdg002 = result.issues.find((i) => i.id === "HDG-002");
    expect(hdg002?.severity).toBe("critical");
  });

  it("passes with HTML entities in H1", () => {
    const result = analyzeHeadings([h(1, "Luxury & Modern Apartment")]);
    const hdg002 = result.issues.find((i) => i.id === "HDG-002");
    expect(hdg002?.severity).toBe("success");
  });

  it("passes with emoji in H1", () => {
    const result = analyzeHeadings([h(1, "🏠 Luxury Apartment")]);
    const hdg002 = result.issues.find((i) => i.id === "HDG-002");
    expect(hdg002?.severity).toBe("success");
  });
});

/* ----------------------------------------------------------------
 * 4. H1 Length (HDG-003)
 * ---------------------------------------------------------------- */

describe("HDG-003: H1 Length Is Within Recommended Range", () => {
  it("returns warning for H1 < 20 chars", () => {
    const result = analyzeHeadings([h(1, "Short")]);
    const hdg003 = result.issues.find((i) => i.id === "HDG-003");
    expect(hdg003?.severity).toBe("warning");
  });

  it("returns success for H1 20-70 chars", () => {
    const result = analyzeHeadings([h(1, "A".repeat(45))]);
    const hdg003 = result.issues.find((i) => i.id === "HDG-003");
    expect(hdg003?.severity).toBe("success");
  });

  it("returns warning for H1 > 70 chars", () => {
    const result = analyzeHeadings([h(1, "A".repeat(100))]);
    const hdg003 = result.issues.find((i) => i.id === "HDG-003");
    expect(hdg003?.severity).toBe("warning");
  });

  it("passes with exactly 20 chars", () => {
    const result = analyzeHeadings([h(1, "A".repeat(20))]);
    const hdg003 = result.issues.find((i) => i.id === "HDG-003");
    expect(hdg003?.severity).toBe("success");
  });

  it("passes with exactly 70 chars", () => {
    const result = analyzeHeadings([h(1, "A".repeat(70))]);
    const hdg003 = result.issues.find((i) => i.id === "HDG-003");
    expect(hdg003?.severity).toBe("success");
  });

  it("respects custom minH1Length", () => {
    const result = analyzeHeadings([h(1, "Short")], { minH1Length: 3 });
    const hdg003 = result.issues.find((i) => i.id === "HDG-003");
    expect(hdg003?.severity).toBe("success");
  });

  it("respects custom maxH1Length", () => {
    const result = analyzeHeadings([h(1, "A".repeat(50))], { maxH1Length: 40 });
    const hdg003 = result.issues.find((i) => i.id === "HDG-003");
    expect(hdg003?.severity).toBe("warning");
  });
});

/* ----------------------------------------------------------------
 * 5. H1 Keywords (HDG-004)
 * ---------------------------------------------------------------- */

describe("HDG-004: Primary Keyword Appears in H1", () => {
  it("returns success when target keyword found in H1", () => {
    const result = analyzeHeadings([h(1, "3BHK Apartment in Noida")], {
      targetKeywords: ["3BHK"],
    });
    const hdg004 = result.issues.find((i) => i.id === "HDG-004");
    expect(hdg004?.severity).toBe("success");
  });

  it("returns warning when target keyword missing from H1", () => {
    const result = analyzeHeadings([h(1, "Luxury Property")], {
      targetKeywords: ["3BHK"],
    });
    const hdg004 = result.issues.find((i) => i.id === "HDG-004");
    expect(hdg004?.severity).toBe("warning");
  });

  it("returns success with partial keyword match", () => {
    const result = analyzeHeadings([h(1, "3BHK Apartment in Noida")], {
      targetKeywords: ["3BHK", "Noida", "Apartment"],
    });
    const hdg004 = result.issues.find((i) => i.id === "HDG-004");
    expect(hdg004?.severity).toBe("success");
  });

  it("uses case-insensitive keyword matching", () => {
    const result = analyzeHeadings([h(1, "3BHK APARTMENT IN NOIDA")], {
      targetKeywords: ["3bhk"],
    });
    const hdg004 = result.issues.find((i) => i.id === "HDG-004");
    expect(hdg004?.severity).toBe("success");
  });

  it("skips check when keywords array is empty", () => {
    const result = analyzeHeadings([h(1, "Title")], {
      targetKeywords: [],
    });
    const hdg004 = result.issues.find((i) => i.id === "HDG-004");
    expect(hdg004?.severity).toBe("info");
  });

  it("skips check when requireKeywordInH1 is false", () => {
    const result = analyzeHeadings([h(1, "Title")], {
      targetKeywords: ["keyword"],
      requireKeywordInH1: false,
    });
    const hdg004 = result.issues.find((i) => i.id === "HDG-004");
    expect(hdg004?.severity).toBe("info");
  });
});

/* ----------------------------------------------------------------
 * 6. Heading Hierarchy (HDG-005)
 * ---------------------------------------------------------------- */

describe("HDG-005: Heading Hierarchy Is Valid", () => {
  it("passes with H1 → H2 → H3", () => {
    const result = analyzeHeadings([h(1, "H1"), h(2, "H2"), h(3, "H3")]);
    const hdg005 = result.issues.find((i) => i.id === "HDG-005");
    expect(hdg005?.severity).toBe("success");
  });

  it("fails when first heading is not H1", () => {
    const result = analyzeHeadings([h(2, "H2"), h(3, "H3")]);
    const hdg005 = result.issues.find((i) => i.id === "HDG-005");
    expect(hdg005?.severity).toBe("warning");
  });

  it("passes with proper nested structure", () => {
    const result = analyzeHeadings([
      h(1, "H1"),
      h(2, "H2a"),
      h(2, "H2b"),
      h(3, "H3"),
      h(2, "H2c"),
    ]);
    const hdg005 = result.issues.find((i) => i.id === "HDG-005");
    expect(hdg005?.severity).toBe("success");
  });

  it("passes with flat structure and correct order", () => {
    const result = analyzeHeadings([
      h(1, "H1"),
      h(2, "H2"),
      h(2, "H2"),
      h(2, "H2"),
    ]);
    const hdg005 = result.issues.find((i) => i.id === "HDG-005");
    expect(hdg005?.severity).toBe("success");
  });
});

/* ----------------------------------------------------------------
 * 7. Skipped Levels (HDG-006)
 * ---------------------------------------------------------------- */

describe("HDG-006: No Skipped Heading Levels", () => {
  it("passes with consecutive +1 level transitions", () => {
    const result = analyzeHeadings([h(1, "H1"), h(2, "H2"), h(3, "H3"), h(4, "H4")]);
    const hdg006 = result.issues.find((i) => i.id === "HDG-006");
    expect(hdg006?.severity).toBe("success");
  });

  it("fails with +2 level transition (H1 → H3)", () => {
    const result = analyzeHeadings([h(1, "H1"), h(3, "H3")]);
    const hdg006 = result.issues.find((i) => i.id === "HDG-006");
    expect(hdg006?.severity).toBe("warning");
  });

  it("fails with +3 level transition (H1 → H4)", () => {
    const result = analyzeHeadings([h(1, "H1"), h(4, "H4")]);
    const hdg006 = result.issues.find((i) => i.id === "HDG-006");
    expect(hdg006?.severity).toBe("warning");
  });

  it("passes with same level consecutive", () => {
    const result = analyzeHeadings([h(2, "H2"), h(2, "H2"), h(2, "H2")]);
    const hdg006 = result.issues.find((i) => i.id === "HDG-006");
    expect(hdg006?.severity).toBe("success");
  });

  it("passes with -1 level (going back)", () => {
    const result = analyzeHeadings([h(1, "H1"), h(2, "H2"), h(1, "H1")]);
    const hdg006 = result.issues.find((i) => i.id === "HDG-006");
    expect(hdg006?.severity).toBe("success");
  });

  it("reports skipped levels in metadata", () => {
    const result = analyzeHeadings([h(1, "H1"), h(3, "H3"), h(5, "H5")]);
    expect(result.skippedLevels).toContain(2);
    expect(result.skippedLevels).toContain(4);
  });
});

/* ----------------------------------------------------------------
 * 8. Duplicate Headings (HDG-007)
 * ---------------------------------------------------------------- */

describe("HDG-007: No Duplicate Headings", () => {
  it("returns success when all headings are unique", () => {
    const result = analyzeHeadings([
      h(1, "Title"),
      h(2, "Section 1"),
      h(2, "Section 2"),
    ]);
    const hdg007 = result.issues.find((i) => i.id === "HDG-007");
    expect(hdg007?.severity).toBe("success");
  });

  it("returns info when two headings are identical", () => {
    const result = analyzeHeadings([
      h(2, "Details"),
      h(2, "Details"),
    ]);
    const hdg007 = result.issues.find((i) => i.id === "HDG-007");
    expect(hdg007?.severity).toBe("info");
  });

  it("returns info when multiple duplicate pairs exist", () => {
    const result = analyzeHeadings([
      h(2, "Details"),
      h(2, "Details"),
      h(3, "Info"),
      h(3, "Info"),
    ]);
    const hdg007 = result.issues.find((i) => i.id === "HDG-007");
    expect(hdg007?.severity).toBe("info");
  });

  it("uses case-insensitive duplicate detection", () => {
    const result = analyzeHeadings([
      h(2, "Details"),
      h(2, "DETAILS"),
    ]);
    const hdg007 = result.issues.find((i) => i.id === "HDG-007");
    expect(hdg007?.severity).toBe("info");
  });

  it("skips check when allowDuplicateHeadings is true", () => {
    const result = analyzeHeadings([
      h(2, "Details"),
      h(2, "Details"),
    ], { allowDuplicateHeadings: true });
    const hdg007 = result.issues.find((i) => i.id === "HDG-007");
    expect(hdg007?.severity).toBe("info");
    expect(hdg007?.title).toContain("disabled");
  });

  it("reports duplicate heading texts in metadata", () => {
    const result = analyzeHeadings([
      h(2, "Details"),
      h(2, "Details"),
      h(3, "Info"),
    ]);
    expect(result.hasDuplicateHeadings).toBe(true);
    expect(result.duplicateHeadingTexts).toContain("details");
  });
});

/* ----------------------------------------------------------------
 * 9. Meaningful Text (HDG-008)
 * ---------------------------------------------------------------- */

describe("HDG-008: Heading Text Is Meaningful", () => {
  it("passes with descriptive headings", () => {
    const result = analyzeHeadings([
      h(2, "Property Amenities"),
      h(3, "Location Highlights"),
    ]);
    const hdg008 = result.issues.find((i) => i.id === "HDG-008");
    expect(hdg008?.severity).toBe("success");
  });

  it("fails with generic 'Section'", () => {
    const result = analyzeHeadings([h(2, "Section")]);
    const hdg008 = result.issues.find((i) => i.id === "HDG-008");
    expect(hdg008?.severity).toBe("info");
  });

  it("fails with generic 'Info'", () => {
    const result = analyzeHeadings([h(2, "Info")]);
    const hdg008 = result.issues.find((i) => i.id === "HDG-008");
    expect(hdg008?.severity).toBe("info");
  });

  it("fails with heading < 5 chars", () => {
    const result = analyzeHeadings([h(2, "ABC")]);
    const hdg008 = result.issues.find((i) => i.id === "HDG-008");
    expect(hdg008?.severity).toBe("info");
  });

  it("respects custom minHeadingLength", () => {
    const result = analyzeHeadings([h(2, "AB")], { minHeadingLength: 2 });
    const hdg008 = result.issues.find((i) => i.id === "HDG-008");
    expect(hdg008?.severity).toBe("success");
  });
});

/* ----------------------------------------------------------------
 * 10. H2 Count (HDG-009)
 * ---------------------------------------------------------------- */

describe("HDG-009: Recommended Number of H2 Headings", () => {
  it("returns success with 5+ H2s", () => {
    const headings = [h(1, "H1"), ...Array(5).fill(null).map((_, i) => h(2, `H2-${i}`))];
    const result = analyzeHeadings(headings);
    const hdg009 = result.issues.find((i) => i.id === "HDG-009");
    expect(hdg009?.severity).toBe("success");
  });

  it("returns info with 2-4 H2s (below recommended)", () => {
    const headings = [h(1, "H1"), h(2, "H2a"), h(2, "H2b"), h(2, "H2c")];
    const result = analyzeHeadings(headings);
    const hdg009 = result.issues.find((i) => i.id === "HDG-009");
    expect(hdg009?.severity).toBe("info");
  });

  it("returns info with 0-1 H2s (below minimum)", () => {
    const headings = [h(1, "H1"), h(3, "H3")];
    const result = analyzeHeadings(headings);
    const hdg009 = result.issues.find((i) => i.id === "HDG-009");
    expect(hdg009?.severity).toBe("info");
  });

  it("respects custom minH2Count", () => {
    const headings = [h(1, "H1"), h(2, "H2")];
    const result = analyzeHeadings(headings, { minH2Count: 1, recommendedH2Count: 1 });
    const hdg009 = result.issues.find((i) => i.id === "HDG-009");
    expect(hdg009?.severity).toBe("success");
  });

  it("respects custom recommendedH2Count", () => {
    const headings = [h(1, "H1"), ...Array(3).fill(null).map((_, i) => h(2, `H2-${i}`))];
    const result = analyzeHeadings(headings, { recommendedH2Count: 3 });
    const hdg009 = result.issues.find((i) => i.id === "HDG-009");
    expect(hdg009?.severity).toBe("success");
  });
});

/* ----------------------------------------------------------------
 * 11. Empty Headings (HDG-010)
 * ---------------------------------------------------------------- */

describe("HDG-010: No Empty Headings", () => {
  it("passes with no empty headings", () => {
    const result = analyzeHeadings([
      h(1, "Title"),
      h(2, "Section"),
      h(3, "Subsection"),
    ]);
    const hdg010 = result.issues.find((i) => i.id === "HDG-010");
    expect(hdg010?.severity).toBe("success");
  });

  it("fails with empty H2", () => {
    const result = analyzeHeadings([h(1, "Title"), h(2, "")]);
    const hdg010 = result.issues.find((i) => i.id === "HDG-010");
    expect(hdg010?.severity).toBe("warning");
  });

  it("fails with empty H3", () => {
    const result = analyzeHeadings([h(1, "Title"), h(3, "")]);
    const hdg010 = result.issues.find((i) => i.id === "HDG-010");
    expect(hdg010?.severity).toBe("warning");
  });

  it("fails with whitespace-only heading", () => {
    const result = analyzeHeadings([h(1, "Title"), h(2, "   \t\n  ")]);
    const hdg010 = result.issues.find((i) => i.id === "HDG-010");
    expect(hdg010?.severity).toBe("warning");
  });

  it("flags multiple empty headings", () => {
    const result = analyzeHeadings([
      h(1, "Title"),
      h(2, ""),
      h(3, ""),
      h(2, "   "),
    ]);
    const hdg010 = result.issues.find((i) => i.id === "HDG-010");
    expect(hdg010?.severity).toBe("warning");
    expect(result.emptyHeadings).toBe(3);
  });
});

/* ----------------------------------------------------------------
 * 12. Scoring
 * ---------------------------------------------------------------- */

describe("Scoring", () => {
  it("returns score 100 for perfect headings", () => {
    const headings = [
      h(1, "Modern 3BHK Apartment in Noida Sector 62"),
      ...Array(5).fill(null).map((_, i) => h(2, `Section ${i + 1}`)),
    ];
    const result = analyzeHeadings(headings, {
      targetKeywords: ["3BHK"],
      minH2Count: 2,
      recommendedH2Count: 5,
    });
    expect(result.score).toBe(100);
  });

  it("returns score below 100 for missing H1", () => {
    const result = analyzeHeadings([h(2, "Section")]);
    expect(result.score).toBeLessThan(100);
  });

  it("calculates correct penalty for multiple warnings", () => {
    const result = analyzeHeadings([
      h(2, "Section"),
      h(2, "Section"),
      h(2, "A"),
    ]);
    expect(result.score).toBeLessThan(100);
  });

  it("critical failure results in failed status", () => {
    const result = analyzeHeadings([]);
    expect(result.passed).toBe(false);
  });

  it("info issues don't affect pass/fail threshold", () => {
    const result = analyzeHeadings([
      h(1, "Good Title Here With Keywords"),
      h(2, "Details"),
      h(2, "Details"),
    ], { targetKeywords: ["Keywords"] });
    // Has duplicate (info) but should still pass
    expect(result.passed).toBe(true);
  });

  it("score is capped at 0 minimum", () => {
    // Create many issues to try to go below 0
    const headings = Array(20).fill(null).map((_, i) => h(2, ""));
    const result = analyzeHeadings([h(1, "A"), ...headings]);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

/* ----------------------------------------------------------------
 * 13. Edge Cases
 * ---------------------------------------------------------------- */

describe("Edge Cases", () => {
  it("handles Unicode headings correctly", () => {
    const result = analyzeHeadings([
      h(1, "测试属性"),
      h(2, "Недвижимость"),
    ]);
    expect(result.totalHeadings).toBe(2);
  });

  it("handles emoji headings", () => {
    const result = analyzeHeadings([
      h(1, "🏠🏡 Luxury Apartments"),
    ]);
    expect(result.h1Text).toContain("🏠");
  });

  it("handles HTML entities as-is", () => {
    const result = analyzeHeadings([
      h(1, "Luxury & Modern Apartment"),
    ]);
    expect(result.h1Length).toBeGreaterThan(0);
  });

  it("handles very long headings", () => {
    const result = analyzeHeadings([h(1, "A".repeat(500))]);
    expect(result.h1Length).toBe(500);
    const hdg003 = result.issues.find((i) => i.id === "HDG-003");
    expect(hdg003?.severity).toBe("warning");
  });

  it("handles very short headings", () => {
    const result = analyzeHeadings([h(1, "A")]);
    expect(result.h1Length).toBe(1);
  });

  it("handles mixed language headings", () => {
    const result = analyzeHeadings([
      h(1, "Title"),
      h(2, "测试"),
      h(2, "Тест"),
      h(2, "اختبار"),
    ]);
    expect(result.totalHeadings).toBe(4);
  });
});

/* ----------------------------------------------------------------
 * 14. Output Contract
 * ---------------------------------------------------------------- */

describe("Output Contract", () => {
  it("returns all required fields in HeadingAnalysis", () => {
    const result = analyzeHeadings(undefined);
    expect(result).toHaveProperty("headings");
    expect(result).toHaveProperty("totalHeadings");
    expect(result).toHaveProperty("h1Count");
    expect(result).toHaveProperty("h2Count");
    expect(result).toHaveProperty("h3Count");
    expect(result).toHaveProperty("h4Count");
    expect(result).toHaveProperty("h5Count");
    expect(result).toHaveProperty("h6Count");
    expect(result).toHaveProperty("hasH1");
    expect(result).toHaveProperty("h1Text");
    expect(result).toHaveProperty("h1Length");
    expect(result).toHaveProperty("hasKeywordInH1");
    expect(result).toHaveProperty("hasDuplicateHeadings");
    expect(result).toHaveProperty("duplicateHeadingTexts");
    expect(result).toHaveProperty("skippedLevels");
    expect(result).toHaveProperty("emptyHeadings");
    expect(result).toHaveProperty("averageHeadingLength");
    expect(result).toHaveProperty("passed");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("issues");
  });

  it("returns hasH1 correctly", () => {
    const withH1 = analyzeHeadings([h(1, "Title")]);
    expect(withH1.hasH1).toBe(true);

    const withoutH1 = analyzeHeadings([h(2, "Section")]);
    expect(withoutH1.hasH1).toBe(false);
  });

  it("returns h1Text correctly", () => {
    const result = analyzeHeadings([h(1, "Test Title"), h(2, "Section")]);
    expect(result.h1Text).toBe("Test Title");
  });

  it("returns h1Length correctly", () => {
    const result = analyzeHeadings([h(1, "Test")]);
    expect(result.h1Length).toBe(4);
  });

  it("returns skippedLevels array", () => {
    const result = analyzeHeadings([h(1, "H1"), h(3, "H3"), h(5, "H5")]);
    expect(result.skippedLevels).toContain(2);
    expect(result.skippedLevels).toContain(4);
  });

  it("returns averageHeadingLength correctly", () => {
    const result = analyzeHeadings([
      h(1, "ABCD"), // 4
      h(2, "ABC"),  // 3
      h(2, "ABCDE"), // 5
    ]);
    // Average: (4 + 3 + 5) / 3 = 4
    expect(result.averageHeadingLength).toBe(4);
  });

  it("returns hasKeywordInH1 correctly", () => {
    const withKeyword = analyzeHeadings([h(1, "3BHK Apartment")], {
      targetKeywords: ["3BHK"],
    });
    expect(withKeyword.hasKeywordInH1).toBe(true);

    const withoutKeyword = analyzeHeadings([h(1, "Apartment")], {
      targetKeywords: ["3BHK"],
    });
    expect(withoutKeyword.hasKeywordInH1).toBe(false);
  });
});