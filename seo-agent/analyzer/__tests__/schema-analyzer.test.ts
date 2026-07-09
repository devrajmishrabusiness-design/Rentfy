/**
 * Unit tests for schema-analyzer.ts
 *
 * Pure function tests using Vitest.
 * Run with: npx vitest run seo-agent/analyzer/__tests__/schema-analyzer.test.ts
 */

import { describe, it, expect } from "vitest";
import { analyzeSchema } from "../schema-analyzer";

/* ----------------------------------------------------------------
 * 1. Core Functionality - Schema Exists
 * ---------------------------------------------------------------- */

describe("Core Functionality", () => {
  it("returns missing issue when schema is undefined", () => {
    const result = analyzeSchema(undefined);
    expect(result.passed).toBe(false);
    expect(result.schemaFound).toBe(false);
    expect(result.issues.some((i) => i.id === "SCH-001")).toBe(true);
    expect(result.issues.find((i) => i.id === "SCH-001")?.severity).toBe(
      "critical"
    );
  });

  it("returns missing issue when schema is null", () => {
    const result = analyzeSchema(null as unknown as object);
    expect(result.issues.some((i) => i.id === "SCH-001")).toBe(true);
    expect(result.issues.find((i) => i.id === "SCH-001")?.severity).toBe(
      "critical"
    );
  });

  it("returns success when schema is valid JSON-LD string", () => {
    const schema = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
    });
    const result = analyzeSchema(schema);
    expect(result.schemaFound).toBe(true);
    expect(result.issues.some((i) => i.id === "SCH-001")).toBe(false);
  });

  it("accepts object input", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
    };
    const result = analyzeSchema(schema);
    expect(result.schemaFound).toBe(true);
  });
});

/* ----------------------------------------------------------------
 * 2. JSON Validation - SCH-002
 * ---------------------------------------------------------------- */

describe("SCH-002: Valid JSON", () => {
  it("returns critical error for invalid JSON", () => {
    const result = analyzeSchema("{ invalid json }");
    expect(result.issues.some((i) => i.id === "SCH-002")).toBe(true);
    expect(result.issues.find((i) => i.id === "SCH-002")?.severity).toBe(
      "critical"
    );
    expect(result.errorCount).toBe(1);
  });

  it("detects malformed brackets", () => {
    const result = analyzeSchema('{"@context": "https://schema.org"');
    expect(result.issues.some((i) => i.id === "SCH-002")).toBe(true);
  });

  it("detects unclosed strings", () => {
    const result = analyzeSchema('{"@context": "https://schema.org');
    expect(result.issues.some((i) => i.id === "SCH-002")).toBe(true);
  });

  it("passes for valid JSON with null values", () => {
    const schema = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: null,
    });
    const result = analyzeSchema(schema);
    const sch002 = result.issues.find((i) => i.id === "SCH-002");
    expect(sch002?.severity).toBe("success");
  });
});

/* ----------------------------------------------------------------
 * 3. Context Validation - SCH-003
 * ---------------------------------------------------------------- */

describe("SCH-003: Valid @context", () => {
  it("passes with correct @context", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
    };
    const result = analyzeSchema(schema);
    const sch003 = result.issues.find((i) => i.id === "SCH-003");
    expect(sch003?.severity).toBe("success");
  });

  it("fails with missing @context", () => {
    const schema = {
      "@type": "RealEstateListing",
    };
    const result = analyzeSchema(schema);
    const sch003 = result.issues.find((i) => i.id === "SCH-003");
    expect(sch003?.severity).toBe("critical");
  });

  it("fails with wrong @context URL", () => {
    const schema = {
      "@context": "https://wrong-context.org",
      "@type": "RealEstateListing",
    };
    const result = analyzeSchema(schema);
    const sch003 = result.issues.find((i) => i.id === "SCH-003");
    expect(sch003?.severity).toBe("critical");
  });

  it("passes with http://schema.org (alternative)", () => {
    const schema = {
      "@context": "http://schema.org",
      "@type": "RealEstateListing",
    };
    const result = analyzeSchema(schema);
    const sch003 = result.issues.find((i) => i.id === "SCH-003");
    expect(sch003?.severity).toBe("success");
  });
});

/* ----------------------------------------------------------------
 * 4. Schema Type Validation - SCH-004
 * ---------------------------------------------------------------- */

describe("SCH-004: Valid Schema Type", () => {
  it("passes with RealEstateListing type", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
    };
    const result = analyzeSchema(schema);
    const sch004 = result.issues.find((i) => i.id === "SCH-004");
    expect(sch004?.severity).toBe("success");
  });

  it("passes with Product type", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
    };
    const result = analyzeSchema(schema);
    const sch004 = result.issues.find((i) => i.id === "SCH-004");
    expect(sch004?.severity).toBe("success");
  });

  it("fails with invalid type", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "InvalidType",
    };
    const result = analyzeSchema(schema);
    const sch004 = result.issues.find((i) => i.id === "SCH-004");
    expect(sch004?.severity).toBe("critical");
  });

  it("handles multiple types (array)", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": ["RealEstateListing", "Place"],
    };
    const result = analyzeSchema(schema);
    const sch004 = result.issues.find((i) => i.id === "SCH-004");
    expect(sch004?.severity).toBe("success");
  });

  it("respects custom allowedTypes configuration", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "CustomType",
    };
    const result = analyzeSchema(schema, {
      allowedTypes: ["CustomType", "AnotherType"],
    });
    const sch004 = result.issues.find((i) => i.id === "SCH-004");
    expect(sch004?.severity).toBe("success");
  });

  it("fails with missing @type", () => {
    const schema = {
      "@context": "https://schema.org",
    };
    const result = analyzeSchema(schema);
    const sch004 = result.issues.find((i) => i.id === "SCH-004");
    expect(sch004?.severity).toBe("critical");
  });
});

/* ----------------------------------------------------------------
 * 5. Required Properties - SCH-005
 * ---------------------------------------------------------------- */

describe("SCH-005: Has Required Properties", () => {
  it("passes with name and description", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test Property",
      description: "A nice property",
    };
    const result = analyzeSchema(schema);
    const sch005 = result.issues.find((i) => i.id === "SCH-005");
    expect(sch005?.severity).toBe("success");
  });

  it("fails with missing name", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      description: "A nice property",
    };
    const result = analyzeSchema(schema);
    const sch005 = result.issues.find((i) => i.id === "SCH-005");
    expect(sch005?.severity).toBe("warning");
  });

  it("fails with missing description", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test Property",
    };
    const result = analyzeSchema(schema);
    const sch005 = result.issues.find((i) => i.id === "SCH-005");
    expect(sch005?.severity).toBe("warning");
  });

  it("treats empty string as missing", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "",
      description: "   ",
    };
    const result = analyzeSchema(schema);
    const sch005 = result.issues.find((i) => i.id === "SCH-005");
    expect(sch005?.severity).toBe("warning");
  });
});

/* ----------------------------------------------------------------
 * 6. Address Validation - SCH-006
 * ---------------------------------------------------------------- */

describe("SCH-006: Has Address", () => {
  it("passes with complete PostalAddress", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      address: {
        "@type": "PostalAddress",
        streetAddress: "123 Main St",
        addressLocality: "Seattle",
        addressRegion: "WA",
        postalCode: "98101",
      },
    };
    const result = analyzeSchema(schema);
    const sch006 = result.issues.find((i) => i.id === "SCH-006");
    expect(sch006?.severity).toBe("success");
    expect(result.hasAddress).toBe(true);
  });

  it("fails with missing address", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
    };
    const result = analyzeSchema(schema);
    const sch006 = result.issues.find((i) => i.id === "SCH-006");
    expect(sch006?.severity).toBe("warning");
  });

  it("fails with address without PostalAddress type", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      address: {
        streetAddress: "123 Main St",
      },
    };
    const result = analyzeSchema(schema);
    const sch006 = result.issues.find((i) => i.id === "SCH-006");
    expect(sch006?.severity).toBe("warning");
  });

  it("passes with partial address (warning for incomplete)", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      address: {
        "@type": "PostalAddress",
        streetAddress: "123 Main St",
      },
    };
    const result = analyzeSchema(schema);
    const sch006 = result.issues.find((i) => i.id === "SCH-006");
    expect(sch006?.severity).toBe("warning");
  });

  it("skips check when requireAddress=false", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
    };
    const result = analyzeSchema(schema, { requireAddress: false });
    const sch006 = result.issues.find((i) => i.id === "SCH-006");
    expect(sch006?.severity).toBe("info");
  });
});

/* ----------------------------------------------------------------
 * 7. Price/Offer Validation - SCH-007
 * ---------------------------------------------------------------- */

describe("SCH-007: Has Price/Offer", () => {
  it("passes with offer and price", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      offers: {
        "@type": "Offer",
        price: 450000,
        priceCurrency: "USD",
      },
    };
    const result = analyzeSchema(schema);
    const sch007 = result.issues.find((i) => i.id === "SCH-007");
    expect(sch007?.severity).toBe("success");
    expect(result.hasPrice).toBe(true);
  });

  it("fails with missing offers", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
    };
    const result = analyzeSchema(schema);
    const sch007 = result.issues.find((i) => i.id === "SCH-007");
    expect(sch007?.severity).toBe("warning");
  });

  it("fails with offer without price", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
      },
    };
    const result = analyzeSchema(schema);
    const sch007 = result.issues.find((i) => i.id === "SCH-007");
    expect(sch007?.severity).toBe("warning");
  });

  it("accepts price as string", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      offers: {
        "@type": "Offer",
        price: "450000",
      },
    };
    const result = analyzeSchema(schema);
    const sch007 = result.issues.find((i) => i.id === "SCH-007");
    expect(sch007?.severity).toBe("success");
  });

  it("accepts price as number", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      offers: {
        "@type": "Offer",
        price: 450000,
      },
    };
    const result = analyzeSchema(schema);
    const sch007 = result.issues.find((i) => i.id === "SCH-007");
    expect(sch007?.severity).toBe("success");
  });

  it("skips check when requirePrice=false", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
    };
    const result = analyzeSchema(schema, { requirePrice: false });
    const sch007 = result.issues.find((i) => i.id === "SCH-007");
    expect(sch007?.severity).toBe("info");
  });
});

/* ----------------------------------------------------------------
 * 8. Geo Coordinates - SCH-008
 * ---------------------------------------------------------------- */

describe("SCH-008: Has Geo Coordinates", () => {
  it("passes with complete GeoCoordinates", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      geo: {
        "@type": "GeoCoordinates",
        latitude: 47.6062,
        longitude: -122.3321,
      },
    };
    const result = analyzeSchema(schema, { requireGeo: true });
    const sch008 = result.issues.find((i) => i.id === "SCH-008");
    expect(sch008?.severity).toBe("success");
    expect(result.hasGeo).toBe(true);
  });

  it("returns info (not warning) when missing geo (default requireGeo=false)", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
    };
    const result = analyzeSchema(schema);
    const sch008 = result.issues.find((i) => i.id === "SCH-008");
    expect(sch008?.severity).toBe("info");
  });

  it("returns info when geo is incomplete", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      geo: {
        "@type": "GeoCoordinates",
        latitude: 47.6062,
      },
    };
    const result = analyzeSchema(schema, { requireGeo: true });
    const sch008 = result.issues.find((i) => i.id === "SCH-008");
    expect(sch008?.severity).toBe("info");
  });

  it("skips check when requireGeo=false (default)", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
    };
    const result = analyzeSchema(schema);
    const sch008 = result.issues.find((i) => i.id === "SCH-008");
    expect(sch008?.severity).toBe("info");
  });
});

/* ----------------------------------------------------------------
 * 9. Images - SCH-009
 * ---------------------------------------------------------------- */

describe("SCH-009: Has Images", () => {
  it("passes with image array containing URLs", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      image: [
        "https://example.com/img1.jpg",
        "https://example.com/img2.jpg",
      ],
    };
    const result = analyzeSchema(schema, { requireImages: true });
    const sch009 = result.issues.find((i) => i.id === "SCH-009");
    expect(sch009?.severity).toBe("success");
    expect(result.hasImages).toBe(true);
  });

  it("passes with single image string", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      image: "https://example.com/img1.jpg",
    };
    const result = analyzeSchema(schema, { requireImages: true });
    const sch009 = result.issues.find((i) => i.id === "SCH-009");
    expect(sch009?.severity).toBe("success");
  });

  it("returns info when missing images (default requireImages=false)", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
    };
    const result = analyzeSchema(schema);
    const sch009 = result.issues.find((i) => i.id === "SCH-009");
    expect(sch009?.severity).toBe("info");
  });

  it("returns info for empty image array", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      image: [],
    };
    const result = analyzeSchema(schema, { requireImages: true });
    const sch009 = result.issues.find((i) => i.id === "SCH-009");
    expect(sch009?.severity).toBe("info");
  });

  it("skips check when requireImages=false (default)", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
    };
    const result = analyzeSchema(schema);
    const sch009 = result.issues.find((i) => i.id === "SCH-009");
    expect(sch009?.severity).toBe("info");
  });
});

/* ----------------------------------------------------------------
 * 10. Schema Errors - SCH-010
 * ---------------------------------------------------------------- */

describe("SCH-010: No Schema Errors", () => {
  it("returns success when no errors", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
    };
    const result = analyzeSchema(schema);
    const sch010 = result.issues.find((i) => i.id === "SCH-010");
    expect(sch010?.severity).toBe("success");
    expect(result.errorCount).toBe(0);
  });

  it("returns critical when validation errors detected", () => {
    const result = analyzeSchema("{ invalid }");
    const sch010 = result.issues.find((i) => i.id === "SCH-010");
    expect(sch010?.severity).toBe("critical");
    expect(result.errorCount).toBe(1);
  });
});

/* ----------------------------------------------------------------
 * 11. @graph with Multiple Schemas
 * ---------------------------------------------------------------- */

describe("@graph with Multiple Schemas", () => {
  it("validates all schemas in @graph", () => {
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "RealEstateListing",
          name: "Property 1",
          description: "Desc 1",
        },
        {
          "@type": "RealEstateListing",
          name: "Property 2",
          description: "Desc 2",
        },
      ],
    };
    const result = analyzeSchema(schema);
    expect(result.schemaCount).toBe(2);
  });

  it("aggregates issues from multiple schemas", () => {
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "RealEstateListing",
          name: "Property 1",
          description: "Desc 1",
        },
        {
          "@type": "InvalidType",
        },
      ],
    };
    const result = analyzeSchema(schema);
    // Should have SCH-004 critical for invalid type
    const sch004 = result.issues.find((i) => i.id === "SCH-004");
    expect(sch004?.severity).toBe("critical");
  });
});

/* ----------------------------------------------------------------
 * 12. Scoring
 * ---------------------------------------------------------------- */

describe("Scoring", () => {
  it("returns score 100 for perfect schema", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test description",
      address: {
        "@type": "PostalAddress",
        streetAddress: "123 Main St",
        addressLocality: "Seattle",
        addressRegion: "WA",
        postalCode: "98101",
      },
      offers: {
        "@type": "Offer",
        price: 450000,
      },
    };
    const result = analyzeSchema(schema, {
      requireGeo: false,
      requireImages: false,
    });
    expect(result.score).toBe(100);
  });

  it("returns reduced score for missing schema", () => {
    const result = analyzeSchema(undefined);
    expect(result.score).toBeLessThan(100);
  });

  it("calculates correct penalty for multiple issues", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "InvalidType",
    };
    const result = analyzeSchema(schema);
    // Multiple critical/warning issues
    expect(result.score).toBeLessThan(100);
  });

  it("reduces score significantly for critical errors", () => {
    const result = analyzeSchema(undefined);
    // Missing schema is critical - calculateScore gives 25 penalty for critical
    expect(result.score).toBe(75); // 100 - 25 = 75
  });
});

/* ----------------------------------------------------------------
 * 13. Edge Cases
 * ---------------------------------------------------------------- */

describe("Edge Cases", () => {
  it("handles @graph with mixed schema types", () => {
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "RealEstateListing",
          name: "Property",
          description: "Desc",
        },
        {
          "@type": "Organization",
          name: "Agency",
        },
      ],
    };
    const result = analyzeSchema(schema);
    expect(result.schemaCount).toBe(2);
  });

  it("handles nested schema references", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      address: {
        "@type": "PostalAddress",
        streetAddress: "123 Main St",
        addressLocality: "Seattle",
        addressRegion: "WA",
        postalCode: "98101",
        geo: {
          "@type": "GeoCoordinates",
          latitude: 47.6062,
          longitude: -122.3321,
        },
      },
    };
    const result = analyzeSchema(schema);
    expect(result.propertyCount).toBeGreaterThan(5);
  });

  it("handles circular references gracefully (no infinite loop)", () => {
    // Create a schema with a self-reference
    const schemaObj: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
    };
    schemaObj.self = schemaObj; // Circular reference

    // This should not throw or hang
    expect(() => analyzeSchema(schemaObj)).not.toThrow();
  });

  it("handles unicode in property values", () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "测试属性",
      description: "Недвижимость",
    };
    const result = analyzeSchema(schema, {
      requireAddress: false,
      requirePrice: false,
    });
    expect(result.passed).toBe(true);
  });

  it("handles large schemas (1000+ properties)", () => {
    const largeSchema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
    };
    for (let i = 0; i < 1000; i++) {
      largeSchema[`prop${i}`] = `value${i}`;
    }
    const result = analyzeSchema(largeSchema);
    expect(result.propertyCount).toBeGreaterThan(1000);
  });
});

/* ----------------------------------------------------------------
 * 14. Output Contract
 * ---------------------------------------------------------------- */

describe("Output Contract", () => {
  it("returns all required fields in SchemaAnalysis", () => {
    const result = analyzeSchema(undefined);
    expect(result).toHaveProperty("schema");
    expect(result).toHaveProperty("schemaFound");
    expect(result).toHaveProperty("schemaType");
    expect(result).toHaveProperty("schemaCount");
    expect(result).toHaveProperty("passed");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("issues");
    expect(result).toHaveProperty("hasAddress");
    expect(result).toHaveProperty("hasPrice");
    expect(result).toHaveProperty("hasGeo");
    expect(result).toHaveProperty("hasImages");
    expect(result).toHaveProperty("propertyCount");
    expect(result).toHaveProperty("errorCount");
  });

  it("returns hasAddress correctly", () => {
    const withAddress = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      address: {
        "@type": "PostalAddress",
        streetAddress: "123 Main St",
        addressLocality: "Seattle",
        addressRegion: "WA",
        postalCode: "98101",
      },
    };
    const result = analyzeSchema(withAddress);
    expect(result.hasAddress).toBe(true);

    const withoutAddress = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
    };
    const result2 = analyzeSchema(withoutAddress);
    expect(result2.hasAddress).toBe(false);
  });

  it("returns hasPrice correctly", () => {
    const withPrice = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      offers: {
        "@type": "Offer",
        price: 450000,
      },
    };
    const result = analyzeSchema(withPrice);
    expect(result.hasPrice).toBe(true);

    const withoutPrice = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
    };
    const result2 = analyzeSchema(withoutPrice);
    expect(result2.hasPrice).toBe(false);
  });

  it("returns hasGeo correctly", () => {
    const withGeo = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      geo: {
        "@type": "GeoCoordinates",
        latitude: 47.6062,
        longitude: -122.3321,
      },
    };
    const result = analyzeSchema(withGeo, { requireGeo: true });
    expect(result.hasGeo).toBe(true);

    const withoutGeo = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
    };
    const result2 = analyzeSchema(withoutGeo, { requireGeo: true });
    expect(result2.hasGeo).toBe(false);
  });

  it("returns hasImages correctly", () => {
    const withImages = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
      image: ["https://example.com/img.jpg"],
    };
    const result = analyzeSchema(withImages, { requireImages: true });
    expect(result.hasImages).toBe(true);

    const withoutImages = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Test",
      description: "Test",
    };
    const result2 = analyzeSchema(withoutImages, { requireImages: true });
    expect(result2.hasImages).toBe(false);
  });
});