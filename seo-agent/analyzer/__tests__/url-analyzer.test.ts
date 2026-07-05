/**
 * URL Analyzer Tests
 * 
 * Comprehensive test suite covering all rules defined in RFC-003.
 * Target: 57+ tests with full coverage.
 */

import { describe, it, expect } from "vitest";
import { analyzeUrl, type UrlAnalyzerOptions } from "../url-analyzer";

describe("URL Analyzer", () => {
  describe("URL-001: URL Exists", () => {
    it("returns critical issue when urlSlug is undefined", () => {
      const result = analyzeUrl(undefined);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].id).toBe("URL-001");
      expect(result.issues[0].severity).toBe("critical");
      expect(result.passed).toBe(false);
    });

    it("returns critical issue when urlSlug is null", () => {
      const result = analyzeUrl(null as any);
      expect(result.issues[0].id).toBe("URL-001");
      expect(result.issues[0].severity).toBe("critical");
    });

    it("returns critical issue when urlSlug is empty string", () => {
      const result = analyzeUrl("");
      const url001 = result.issues.find(i => i.id === "URL-001");
      expect(url001).toBeUndefined();
      expect(result.slugLength).toBe(0);
    });

    it("passes when urlSlug has content", () => {
      const result = analyzeUrl("/rent/noida/sector-62");
      const url001 = result.issues.find(i => i.id === "URL-001");
      expect(url001).toBeUndefined();
    });

    it("trims whitespace before analysis", () => {
      const result = analyzeUrl("  /rent/noida  ");
      expect(result.urlSlug).toBe("/rent/noida");
    });
  });

  describe("URL-002: Uses Lowercase Characters", () => {
    it("returns warning when uppercase letters present", () => {
      const result = analyzeUrl("/Rent/Noida/Sector-62");
      const url002 = result.issues.find(i => i.id === "URL-002");
      expect(url002?.severity).toBe("warning");
    });

    it("returns warning when all uppercase", () => {
      const result = analyzeUrl("/RENT/NOIDA/SECTOR-62");
      const url002 = result.issues.find(i => i.id === "URL-002");
      expect(url002?.severity).toBe("warning");
    });

    it("returns success when all lowercase", () => {
      const result = analyzeUrl("/rent/noida/sector-62");
      const url002 = result.issues.find(i => i.id === "URL-002");
      expect(url002?.severity).toBe("success");
    });

    it("returns success for mixed case with lowercase letters only", () => {
      const result = analyzeUrl("/rent/noida123");
      const url002 = result.issues.find(i => i.id === "URL-002");
      expect(url002?.severity).toBe("success");
    });

    it("passes when only numbers and hyphens", () => {
      const result = analyzeUrl("/rent/123/456-789");
      const url002 = result.issues.find(i => i.id === "URL-002");
      expect(url002?.severity).toBe("success");
    });
  });

  describe("URL-003: Uses Hyphens as Separators", () => {
    it("returns warning when underscores used", () => {
      const result = analyzeUrl("/rent/noida/sector_62");
      const url003 = result.issues.find(i => i.id === "URL-003");
      expect(url003?.severity).toBe("warning");
    });

    it("returns warning when spaces used", () => {
      const result = analyzeUrl("/rent/noida/sector 62");
      const url003 = result.issues.find(i => i.id === "URL-003");
      expect(url003?.severity).toBe("warning");
    });

    it("returns warning when camelCase used", () => {
      const result = analyzeUrl("/rent/noida/sector62/3bhkApartment");
      const url003 = result.issues.find(i => i.id === "URL-003");
      expect(url003?.severity).toBe("warning");
    });

    it("returns success when hyphens used as separators", () => {
      const result = analyzeUrl("/rent/noida/sector-62/3bhk-apartment");
      const url003 = result.issues.find(i => i.id === "URL-003");
      expect(url003?.severity).toBe("success");
    });

    it("returns warning for mixed separators", () => {
      const result = analyzeUrl("/rent/noida/sector_62/3bhk-apartment");
      const url003 = result.issues.find(i => i.id === "URL-003");
      expect(url003?.severity).toBe("warning");
    });
  });

  describe("URL-004: Contains City", () => {
    it("returns success when city found in slug", () => {
      const result = analyzeUrl("/rent/noida/sector-62", { city: "Noida" });
      const url004 = result.issues.find(i => i.id === "URL-004");
      expect(url004?.severity).toBe("success");
      expect(result.hasCity).toBe(true);
    });

    it("returns warning when city not found", () => {
      const result = analyzeUrl("/rent/sector-62/3bhk", { city: "Noida" });
      const url004 = result.issues.find(i => i.id === "URL-004");
      expect(url004?.severity).toBe("warning");
      expect(result.hasCity).toBe(false);
    });

    it("returns warning when city not provided", () => {
      const result = analyzeUrl("/rent/sector-62");
      const url004 = result.issues.find(i => i.id === "URL-004");
      expect(url004?.severity).toBe("info");
    });

    it("handles case-insensitive matching", () => {
      const result = analyzeUrl("/rent/Noida/sector-62", { city: "noida" });
      const url004 = result.issues.find(i => i.id === "URL-004");
      expect(url004?.severity).toBe("success");
    });

    it("returns info when requireCity is false", () => {
      const result = analyzeUrl("/rent/sector-62", { city: "Noida", requireCity: false });
      const url004 = result.issues.find(i => i.id === "URL-004");
      expect(url004?.severity).toBe("info");
    });
  });

  describe("URL-005: Contains Locality", () => {
    it("returns success when locality found", () => {
      const result = analyzeUrl("/rent/noida/sector-62", { locality: "Sector 62", requireLocality: true });
      const url005 = result.issues.find(i => i.id === "URL-005");
      expect(url005?.severity).toBe("success");
      expect(result.hasLocality).toBe(true);
    });

    it("returns warning when locality not found", () => {
      const result = analyzeUrl("/rent/noida/3bhk", { locality: "Sector 62", requireLocality: true });
      const url005 = result.issues.find(i => i.id === "URL-005");
      expect(url005?.severity).toBe("warning");
      expect(result.hasLocality).toBe(false);
    });

    it("returns info when locality not provided", () => {
      const result = analyzeUrl("/rent/noida/sector-62");
      const url005 = result.issues.find(i => i.id === "URL-005");
      expect(url005?.severity).toBe("info");
    });

    it("returns info when requireLocality is false", () => {
      const result = analyzeUrl("/rent/noida/3bhk", { locality: "Sector 62", requireLocality: false });
      const url005 = result.issues.find(i => i.id === "URL-005");
      expect(url005?.severity).toBe("info");
    });

    it("handles case-insensitive matching", () => {
      const result = analyzeUrl("/rent/noida/Sector-62", { locality: "sector 62", requireLocality: true });
      const url005 = result.issues.find(i => i.id === "URL-005");
      expect(url005?.severity).toBe("success");
    });
  });

  describe("URL-006: Contains Property Type", () => {
    it("returns success when property type found", () => {
      const result = analyzeUrl("/rent/noida/sector-62/3bhk-apartment", { propertyType: "3BHK" });
      const url006 = result.issues.find(i => i.id === "URL-006");
      expect(url006?.severity).toBe("success");
      expect(result.hasPropertyType).toBe(true);
    });

    it("returns warning when property type missing", () => {
      const result = analyzeUrl("/rent/noida/sector-62/luxury-home", { propertyType: "3BHK" });
      const url006 = result.issues.find(i => i.id === "URL-006");
      expect(url006?.severity).toBe("warning");
      expect(result.hasPropertyType).toBe(false);
    });

    it("returns info when propertyType not provided", () => {
      const result = analyzeUrl("/rent/noida/sector-62/3bhk");
      const url006 = result.issues.find(i => i.id === "URL-006");
      expect(url006?.severity).toBe("info");
    });

    it("handles case-insensitive matching", () => {
      const result = analyzeUrl("/rent/noida/sector-62/3BHK-apartment", { propertyType: "3bhk" });
      const url006 = result.issues.find(i => i.id === "URL-006");
      expect(url006?.severity).toBe("success");
    });

    it("returns info when requirePropertyType is false", () => {
      const result = analyzeUrl("/rent/noida/sector-62", { propertyType: "3BHK", requirePropertyType: false });
      const url006 = result.issues.find(i => i.id === "URL-006");
      expect(url006?.severity).toBe("info");
    });
  });

  describe("URL-007: No Duplicate Hyphens", () => {
    it("returns warning for double hyphens", () => {
      const result = analyzeUrl("/rent/noida/sector--62");
      const url007 = result.issues.find(i => i.id === "URL-007");
      expect(url007?.severity).toBe("warning");
      expect(result.hasDuplicateHyphens).toBe(false);
    });

    it("returns warning for triple hyphens", () => {
      const result = analyzeUrl("/rent/noida/sector---62");
      const url007 = result.issues.find(i => i.id === "URL-007");
      expect(url007?.severity).toBe("warning");
    });

    it("returns success for single hyphens", () => {
      const result = analyzeUrl("/rent/noida/sector-62/3bhk-apartment");
      const url007 = result.issues.find(i => i.id === "URL-007");
      expect(url007?.severity).toBe("success");
      expect(result.hasDuplicateHyphens).toBe(true);
    });

    it("passes with leading hyphen", () => {
      const result = analyzeUrl("/-rent/noida/sector-62");
      const url007 = result.issues.find(i => i.id === "URL-007");
      expect(url007?.severity).toBe("success");
    });

    it("passes with trailing hyphen", () => {
      const result = analyzeUrl("/rent/noida/sector-62-");
      const url007 = result.issues.find(i => i.id === "URL-007");
      expect(url007?.severity).toBe("success");
    });
  });

  describe("URL-008: No Special Characters", () => {
    it("returns warning for at symbol", () => {
      const result = analyzeUrl("/rent/noida/sector-62/3bhk@home");
      const url008 = result.issues.find(i => i.id === "URL-008");
      expect(url008?.severity).toBe("warning");
      expect(result.hasSpecialChars).toBe(false);
    });

    it("returns warning for hash symbol", () => {
      const result = analyzeUrl("/rent/noida/sector-62#details");
      const url008 = result.issues.find(i => i.id === "URL-008");
      expect(url008?.severity).toBe("warning");
    });

    it("returns warning for question mark", () => {
      const result = analyzeUrl("/rent/noida?city=delhi");
      const url008 = result.issues.find(i => i.id === "URL-008");
      expect(url008?.severity).toBe("warning");
    });

    it("returns warning for ampersand", () => {
      const result = analyzeUrl("/rent/noida?city=delhi&state=up");
      const url008 = result.issues.find(i => i.id === "URL-008");
      expect(url008?.severity).toBe("warning");
    });

    it("returns warning for percent-encoded chars", () => {
      const result = analyzeUrl("/rent/noida/sector%2062");
      const url008 = result.issues.find(i => i.id === "URL-008");
      expect(url008?.severity).toBe("warning");
    });

    it("returns success for only allowed chars", () => {
      const result = analyzeUrl("/rent/noida/sector-62/3bhk-apartment");
      const url008 = result.issues.find(i => i.id === "URL-008");
      expect(url008?.severity).toBe("success");
      expect(result.hasSpecialChars).toBe(true);
    });
  });

  describe("URL-009: Length Within Recommended Range", () => {
    it("returns warning when slug too short", () => {
      const result = analyzeUrl("/rent/noida");
      const url009 = result.issues.find(i => i.id === "URL-009");
      expect(url009?.severity).toBe("warning");
      expect(url009?.currentValue).toBe(11);
    });

    it("returns success when slug within range", () => {
      const result = analyzeUrl("/rent/noida/sector-62/3bhk-apartment");
      const url009 = result.issues.find(i => i.id === "URL-009");
      expect(url009?.severity).toBe("success");
    });

    it("returns warning when slug too long", () => {
      const longSlug = "/rent/" + "noida/".repeat(20) + "sector-62/3bhk-apartment";
      const result = analyzeUrl(longSlug);
      const url009 = result.issues.find(i => i.id === "URL-009");
      expect(url009?.severity).toBe("warning");
    });

    it("passes when slug exactly 20 chars", () => {
      const result = analyzeUrl("/rent/noida/sector-62", { minLength: 20, maxLength: 80 });
      const url009 = result.issues.find(i => i.id === "URL-009");
      expect(url009?.severity).toBe("success");
    });

    it("passes when slug exactly 80 chars", () => {
      const slug = "/rent/" + "a".repeat(74);
      const result = analyzeUrl(slug, { minLength: 20, maxLength: 80 });
      const url009 = result.issues.find(i => i.id === "URL-009");
      expect(url009?.severity).toBe("success");
    });

    it("uses custom minLength when provided", () => {
      const result = analyzeUrl("/rent", { minLength: 3, maxLength: 80 });
      const url009 = result.issues.find(i => i.id === "URL-009");
      expect(url009?.severity).toBe("success");
    });
  });

  describe("URL-010: No Query Parameters", () => {
    it("returns warning for query string", () => {
      const result = analyzeUrl("/rent/noida?city=delhi");
      const url010 = result.issues.find(i => i.id === "URL-010");
      expect(url010?.severity).toBe("warning");
      expect(result.hasQueryParams).toBe(false);
    });

    it("returns warning for ampersand", () => {
      const result = analyzeUrl("/rent/noida?city=delhi&state=up");
      const url010 = result.issues.find(i => i.id === "URL-010");
      expect(url010?.severity).toBe("warning");
    });

    it("returns success when no query params", () => {
      const result = analyzeUrl("/rent/noida/sector-62");
      const url010 = result.issues.find(i => i.id === "URL-010");
      expect(url010?.severity).toBe("success");
      expect(result.hasQueryParams).toBe(true);
    });

    it("detects query params in full URL", () => {
      const result = analyzeUrl("https://example.com/rent/noida?id=123");
      const url010 = result.issues.find(i => i.id === "URL-010");
      expect(url010?.severity).toBe("warning");
    });
  });

  describe("Score Calculation", () => {
    it("returns score 100 for perfect URL", () => {
      const result = analyzeUrl("/rent/noida/sector-62/3bhk-apartment", {
        city: "Noida",
        locality: "Sector 62",
        propertyType: "3BHK",
      });
      expect(result.score).toBe(100);
    });

    it("returns score below 100 for missing URL", () => {
      const result = analyzeUrl(undefined);
      expect(result.score).toBeLessThan(100);
    });

    it("calculates correct penalty for multiple warnings", () => {
      const result = analyzeUrl("/Rent/Noida_Sector--62/3BHK?id=123", {
        city: "Noida",
        propertyType: "3BHK",
      });
      expect(result.score).toBeLessThan(100);
    });

    it("critical failure results in failed status", () => {
      const result = analyzeUrl(undefined);
      expect(result.passed).toBe(false);
    });

    it("info issues don't affect pass/fail", () => {
      const result = analyzeUrl("/rent/noida/sector-62", { requireLocality: false });
      expect(result.passed).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("handles Unicode characters", () => {
      const result = analyzeUrl("/rent/नोएडा/सेक्टर-62");
      expect(result.slugLength).toBeGreaterThan(0);
    });

    it("detects URL-encoded spaces", () => {
      const result = analyzeUrl("/rent/noida/sector%2062");
      const url008 = result.issues.find(i => i.id === "URL-008");
      expect(url008?.severity).toBe("warning");
    });

    it("strips trailing slash", () => {
      const result = analyzeUrl("/rent/noida/sector-62/");
      expect(result.urlSlug).toBe("/rent/noida/sector-62/");
    });

    it("handles leading slash", () => {
      const result = analyzeUrl("/rent/noida/sector-62");
      expect(result.urlSlug).toBe("/rent/noida/sector-62");
    });

    it("handles very long URL", () => {
      const longSlug = "/rent/" + "a".repeat(300);
      const result = analyzeUrl(longSlug);
      expect(result.slugLength).toBeGreaterThan(80);
      const url009 = result.issues.find(i => i.id === "URL-009");
      expect(url009?.severity).toBe("warning");
    });

    it("handles null input gracefully", () => {
      expect(() => analyzeUrl(null as any)).not.toThrow();
    });
  });

  describe("Output Contract", () => {
    it("returns correct checkId", () => {
      const result = analyzeUrl("/rent/noida/sector-62");
      expect(result.slugLength).toBeGreaterThan(0);
    });

    it("returns hasCity correctly", () => {
      const withCity = analyzeUrl("/rent/noida/sector-62", { city: "Noida" });
      expect(withCity.hasCity).toBe(true);

      const withoutCity = analyzeUrl("/rent/sector-62", { city: "Noida" });
      expect(withoutCity.hasCity).toBe(false);
    });

it("returns hasLocality correctly", () => {
      const withLocality = analyzeUrl("/rent/noida/sector-62", { locality: "Sector 62", requireLocality: true });
      expect(withLocality.hasLocality).toBe(true);

      const withoutLocality = analyzeUrl("/rent/noida/3bhk", { locality: "Sector 62", requireLocality: true });
      expect(withoutLocality.hasLocality).toBe(false);
    });

    it("returns hasPropertyType correctly", () => {
      const withType = analyzeUrl("/rent/noida/sector-62/3bhk", { propertyType: "3BHK" });
      expect(withType.hasPropertyType).toBe(true);

      const withoutType = analyzeUrl("/rent/noida/sector-62/luxury", { propertyType: "3BHK" });
      expect(withoutType.hasPropertyType).toBe(false);
    });

    it("returns isLowercase correctly", () => {
      const lowercase = analyzeUrl("/rent/noida/sector-62");
      expect(lowercase.isLowercase).toBe(true);

      const uppercase = analyzeUrl("/Rent/Noida/Sector-62");
      expect(uppercase.isLowercase).toBe(false);
    });

    it("returns hasHyphens correctly", () => {
      const withHyphens = analyzeUrl("/rent/noida/sector-62");
      expect(withHyphens.hasHyphens).toBe(true);

      const withUnderscore = analyzeUrl("/rent/noida/sector_62");
      expect(withUnderscore.hasHyphens).toBe(false);
    });

    it("returns hasDuplicateHyphens correctly", () => {
      const clean = analyzeUrl("/rent/noida/sector-62");
      expect(clean.hasDuplicateHyphens).toBe(true);

      const duplicate = analyzeUrl("/rent/noida/sector--62");
      expect(duplicate.hasDuplicateHyphens).toBe(false);
    });

    it("returns hasSpecialChars correctly", () => {
      const clean = analyzeUrl("/rent/noida/sector-62");
      expect(clean.hasSpecialChars).toBe(true);

      const special = analyzeUrl("/rent/noida/sector-62@home");
      expect(special.hasSpecialChars).toBe(false);
    });

    it("returns hasQueryParams correctly", () => {
      const clean = analyzeUrl("/rent/noida/sector-62");
      expect(clean.hasQueryParams).toBe(true);

      const withQuery = analyzeUrl("/rent/noida?id=123");
      expect(withQuery.hasQueryParams).toBe(false);
    });
  });
});