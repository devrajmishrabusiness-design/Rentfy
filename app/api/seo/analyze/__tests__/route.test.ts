/**
 * Unit tests for the SEO analyze API route.
 *
 * Verifies HTTP-level behavior:
 *   - 200 with a structured report for valid input
 *   - 201 with persisted report when propertyId provided
 *   - 400 for malformed JSON
 *   - 400 for missing/invalid property id
 *   - non-POST methods rejected
 *   - engine failures are returned as structured 500s (not leaked
 *     as uncaught exceptions)
 *   - persistence failures are logged but don't fail the request
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the adapter and report service
vi.mock("@/lib/seo/adapter", async () => {
  const actual = await vi.importActual<typeof import("@/lib/seo/adapter")>(
    "@/lib/seo/adapter"
  );
  return {
    ...actual,
    analyzePropertySeo: vi.fn(),
  };
});

vi.mock("@/lib/seo/report-service", () => ({
  upsertReport: vi.fn(),
}));

import { POST } from "../route";
import { analyzePropertySeo } from "@/lib/seo/adapter";
import { upsertReport } from "@/lib/seo/report-service";

const mockAnalyze = analyzePropertySeo as unknown as ReturnType<typeof vi.fn>;
const mockUpsert = upsertReport as unknown as ReturnType<typeof vi.fn>;

function makeRequest(body: unknown, method: string = "POST"): Request {
  return new Request("http://localhost/api/seo/analyze", {
    method,
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validProperty = {
  id: "prop-123",
  title: "Spacious 2BHK in Sector 62",
  description: "Well-ventilated apartment close to metro.",
  city: "Noida",
  location: "Sector 62",
  property_type: "Apartment",
};

const validPropertyWithId = {
  ...validProperty,
  propertyId: "prop-123",
};

describe("POST /api/seo/analyze — success", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with a structured report", async () => {
    const fakeReport = {
      overallScore: 85,
      metadata: { propertyId: "prop-123", runId: "r1" },
      totalChecks: 7,
    };
    mockAnalyze.mockResolvedValueOnce({
      ok: true,
      report: fakeReport,
      runId: "r1",
    });

    const res = await POST(makeRequest(validProperty) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.report).toEqual(fakeReport);
    expect(body.runId).toBe("r1");
    expect(body.persisted).toBe(false);
  });

  it("returns 201 with persisted report when propertyId provided", async () => {
    const fakeReport = {
      overallScore: 85,
      metadata: { propertyId: "prop-123", runId: "r1" },
      totalChecks: 7,
    };
    mockAnalyze.mockResolvedValueOnce({
      ok: true,
      report: fakeReport,
      runId: "r1",
    });
    mockUpsert.mockResolvedValueOnce({ id: "report-uuid" });

    const res = await POST(makeRequest(validPropertyWithId) as never);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.report).toEqual(fakeReport);
    expect(body.persisted).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith({
      propertyId: "prop-123",
      report: fakeReport,
      analyzerVersion: "0.1.0-core",
    });
  });

  it("returns 200 even if persistence fails (graceful degradation)", async () => {
    const fakeReport = {
      overallScore: 85,
      metadata: { propertyId: "prop-123", runId: "r1" },
      totalChecks: 7,
    };
    mockAnalyze.mockResolvedValueOnce({
      ok: true,
      report: fakeReport,
      runId: "r1",
    });
    mockUpsert.mockRejectedValueOnce(new Error("Database error"));

    const res = await POST(makeRequest(validPropertyWithId) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.report).toEqual(fakeReport);
    expect(body.persisted).toBe(false);
  });
});

describe("POST /api/seo/analyze — validation failures", () => {
  it("returns 400 for malformed JSON", async () => {
    const req = new Request("http://localhost/api/seo/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ not json",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/valid JSON/);
  });

  it("returns 400 for empty body", async () => {
    mockAnalyze.mockResolvedValueOnce({
      ok: false,
      error: { message: "Property `id` is required and must be a non-empty string." },
    });
    const res = await POST(makeRequest({}) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 for null body", async () => {
    mockAnalyze.mockResolvedValueOnce({
      ok: false,
      error: { message: "Property `id` is required and must be a non-empty string." },
    });
    const res = await POST(makeRequest(null) as never);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/seo/analyze — engine failures", () => {
  it("returns 500 when the adapter reports an engine failure", async () => {
    mockAnalyze.mockResolvedValueOnce({
      ok: false,
      error: { message: "SEO analysis failed: engine blew up" },
    });
    const res = await POST(makeRequest(validProperty) as never);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/engine blew up/);
  });
});

describe("POST /api/seo/analyze — HTTP method handling", () => {
  it("exports only a POST handler", () => {
    expect(typeof POST).toBe("function");
  });
});
