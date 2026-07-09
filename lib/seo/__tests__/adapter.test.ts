/**
 * Unit tests for the SEO integration adapter.
 *
 * Verifies that:
 *   - Input validation catches missing/invalid property ids
 *   - Rentfy `Property` rows are translated into the correct
 *     `PageSignals` payload (title, description, slug, images,
 *     headings)
 *   - The adapter drives the full analyzer + report pipeline
 *   - Engine failures are surfaced as a structured `{ ok: false }`
 *     result (never thrown)
 *   - The default engine is constructed with the documented plugin
 *     set
 */

import { describe, it, expect, vi } from "vitest";
import {
  analyzePropertySeo,
  createDefaultEngine,
  propertyToPageSignals,
  propertyRowToSeoInput,
  validatePropertyInput,
  type PropertyForSeo,
} from "../adapter";
import { SeoEngine } from "@/seo-agent/core";

const validProperty: PropertyForSeo = {
  id: "prop-123",
  title: "Spacious 2BHK in Sector 62",
  description:
    "A well-ventilated 2BHK apartment in Noida Sector 62. Close to the metro and IT hubs.",
  image_url: "https://cdn.example.com/properties/prop-123/hero.jpg",
  cover_image_url: "https://cdn.example.com/properties/prop-123/cover.jpg",
  city: "Noida",
  location: "Sector 62",
  property_type: "Apartment",
  rent: 25000,
  bedrooms: 2,
  bathrooms: 2,
};

describe("validatePropertyInput", () => {
  it("accepts a valid property", () => {
    expect(validatePropertyInput(validProperty)).toBeNull();
  });

  it("rejects null", () => {
    expect(validatePropertyInput(null)).toBeTruthy();
  });

  it("rejects undefined", () => {
    expect(validatePropertyInput(undefined)).toBeTruthy();
  });

  it("rejects non-object values", () => {
    expect(validatePropertyInput("string")).toBeTruthy();
    expect(validatePropertyInput(42)).toBeTruthy();
  });

  it("rejects property without an id", () => {
    const { id: _id, ...withoutId } = validProperty;
    void _id;
    expect(validatePropertyInput(withoutId)).toBeTruthy();
  });

  it("rejects property with empty string id", () => {
    expect(validatePropertyInput({ ...validProperty, id: "" })).toBeTruthy();
  });
});

describe("propertyToPageSignals", () => {
  it("maps title and description to the engine payload", () => {
    const signals = propertyToPageSignals(validProperty);
    expect(signals.title).toBe(validProperty.title);
    expect(signals.metaDescription).toBe(validProperty.description);
    expect(signals.titleLength).toBe(validProperty.title!.length);
    expect(signals.metaDescriptionLength).toBe(
      validProperty.description!.length
    );
  });

  it("builds a canonical URL slug from city + location", () => {
    const signals = propertyToPageSignals(validProperty);
    expect(signals.canonical).toBe("/rent/noida/sector-62");
  });

  it("builds a slug with just the city when no location is given", () => {
    const signals = propertyToPageSignals({
      ...validProperty,
      location: null,
    });
    expect(signals.canonical).toBe("/rent/noida");
  });

  it("omits canonical when no city is given", () => {
    const signals = propertyToPageSignals({
      ...validProperty,
      city: null,
    });
    expect(signals.canonical).toBeUndefined();
  });

  it("constructs a heading list from the title", () => {
    const signals = propertyToPageSignals(validProperty);
    expect(signals.headings).toEqual([
      { level: 1, text: validProperty.title },
    ]);
  });

  it("forwards the cover image as the hero image and adds the gallery image", () => {
    const signals = propertyToPageSignals(validProperty);
    expect(signals.images).toEqual([
      { src: validProperty.cover_image_url, isHero: true },
      { src: validProperty.image_url },
    ]);
  });

  it("handles a property with no images", () => {
    const signals = propertyToPageSignals({
      ...validProperty,
      image_url: null,
      cover_image_url: null,
    });
    expect(signals.images).toBeUndefined();
  });

  it("handles a property with only a cover image", () => {
    const signals = propertyToPageSignals({
      ...validProperty,
      image_url: null,
    });
    expect(signals.images).toEqual([
      { src: validProperty.cover_image_url, isHero: true },
    ]);
  });

  it("handles a property with only a non-cover image", () => {
    const signals = propertyToPageSignals({
      ...validProperty,
      cover_image_url: null,
    });
    expect(signals.images).toEqual([{ src: validProperty.image_url }]);
  });

  it("computes wordCount from the description", () => {
    const signals = propertyToPageSignals(validProperty);
    const expectedWords = validProperty.description!
      .split(/\s+/)
      .filter(Boolean).length;
    expect(signals.wordCount).toBe(expectedWords);
  });

  it("handles an entirely minimal property", () => {
    const signals = propertyToPageSignals({ id: "p1" });
    expect(signals.title).toBeUndefined();
    expect(signals.metaDescription).toBeUndefined();
    expect(signals.canonical).toBeUndefined();
    expect(signals.headings).toBeUndefined();
    expect(signals.images).toBeUndefined();
    expect(signals.content).toBeUndefined();
    expect(signals.wordCount).toBeUndefined();
  });
});

describe("createDefaultEngine", () => {
  it("registers all 7 analyzers and the report plugin", () => {
    const engine = createDefaultEngine();
    const ids = engine.inspect().map((p) => p.id);
    expect(ids).toContain("analyzer.title");
    expect(ids).toContain("analyzer.meta-description");
    expect(ids).toContain("analyzer.url");
    expect(ids).toContain("analyzer.heading");
    expect(ids).toContain("analyzer.image");
    expect(ids).toContain("analyzer.schema");
    expect(ids).toContain("analyzer.keyword");
    expect(ids).toContain("report.generator");
  });
});

describe("analyzePropertySeo", () => {
  it("returns a report for a valid property", async () => {
    const result = await analyzePropertySeo(validProperty);
    expect(result.ok).toBe(true);
    expect(result.report).toBeDefined();
    expect(result.runId).toBeTruthy();
    expect(result.report!.metadata.propertyId).toBe(validProperty.id);
    expect(result.report!.totalChecks).toBeGreaterThan(0);
  });

  it("returns a structured failure for invalid input (no throw)", async () => {
    const result = await analyzePropertySeo({});
    expect(result.ok).toBe(false);
    expect(result.error?.message).toBeTruthy();
  });

  it("returns a structured failure for null body", async () => {
    const result = await analyzePropertySeo(null);
    expect(result.ok).toBe(false);
  });

  it("accepts a custom engine via dependency injection", async () => {
    const engine = createDefaultEngine();
    const result = await analyzePropertySeo(validProperty, { engine });
    expect(result.ok).toBe(true);
    expect(result.report!.metadata.propertyId).toBe(validProperty.id);
  });

  it("falls back to a fresh default engine when none is supplied", async () => {
    const first = await analyzePropertySeo(validProperty);
    const second = await analyzePropertySeo(validProperty);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(first.runId).not.toBe(second.runId);
  });
});

describe("propertyRowToSeoInput", () => {
  it("forwards all relevant fields from a full Property row", () => {
    const row = {
      id: "row-1",
      title: "Title",
      description: "Description",
      image_url: "img",
      cover_image_url: "cover",
      city: "Delhi",
      location: "Connaught Place",
      property_type: "Flat",
      rent: 50000,
      bedrooms: 3,
      bathrooms: 2,
      area_sqft: 1200,
    } as const;
    const input = propertyRowToSeoInput(row as never);
    expect(input).toEqual(row);
  });
});
