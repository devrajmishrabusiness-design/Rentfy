/**
 * Unit tests for the SEO Reports API route.
 *
 * Verifies that:
 *   - GET /api/seo/reports/:propertyId returns stored reports
 *   - 404 when report not found
 *   - 400 when propertyId missing
 *   - 500 on database errors
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
  RateLimitPresets: {
    strict: { tokens: 5, intervalMs: 60_000 },
    moderate: { tokens: 20, intervalMs: 60_000 },
    standard: { tokens: 60, intervalMs: 60_000 },
    light: { tokens: 120, intervalMs: 60_000 },
  },
}));

// Mock the report service
vi.mock("@/lib/seo/report-service", () => ({
  getReportByPropertyId: vi.fn(),
}));

import { GET } from "../route";
import { createClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { getReportByPropertyId } from "@/lib/seo/report-service";

const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;
const mockRateLimit = rateLimit as unknown as ReturnType<typeof vi.fn>;

const mockGetReport = getReportByPropertyId as ReturnType<typeof vi.fn>;

const mockReport = {
  id: "report-uuid",
  property_id: "prop-123",
  overall_score: 85,
  overall_grade: "good",
  report_json: {
    overallScore: 85,
    scoreGrade: "good",
    passed: true,
    passedThreshold: 70,
    categoryScores: {},
    criticalIssues: [],
    highIssues: [],
    mediumIssues: [],
    lowIssues: [],
    topIssues: [],
    recommendations: [],
    passedChecks: 6,
    failedChecks: 1,
    warningChecks: 0,
    totalChecks: 7,
    analyzerResults: [],
    executionSummary: {
      totalExecutionTimeMs: 100,
      successfulAnalyzers: 7,
      failedAnalyzers: 0,
      skippedAnalyzers: 0,
      disabledAnalyzers: 0,
    },
    metadata: {
      propertyId: "prop-123",
      runId: "run-456",
      engineVersion: "0.1.0-core",
      generatedAt: new Date().toISOString(),
      reportVersion: "1.0.0",
    },
  },
  analyzer_version: "0.1.0-core",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function createMockRequest(propertyId?: string): Request {
  const url = propertyId
    ? `http://localhost/api/seo/reports/${propertyId}`
    : "http://localhost/api/seo/reports/";
  return new Request(url, { method: "GET" });
}

function setupAuth() {
  mockRateLimit.mockResolvedValue({ blocked: false, remaining: 10, resetAt: Date.now() + 60_000 });
  const baseFrom = (table: string) => {
    if (table === "agencies") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "agency-1", verified: true },
            }),
          }),
        }),
      };
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { agency_id: "agency-1" },
          }),
        }),
      }),
    };
  };
  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@agency.com", email_confirmed_at: new Date().toISOString() } },
      }),
    },
    from: vi.fn((table: string) => baseFrom(table)),
  };
  mockCreateClient.mockResolvedValue(mockSupabaseClient);
}

type RouteContext = { params: Promise<{ propertyId: string }> };

describe("GET /api/seo/reports/:propertyId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuth();
  });

  it("returns 200 with stored report", async () => {
    mockGetReport.mockResolvedValue(mockReport);

    const req = createMockRequest("prop-123");
    const params = { propertyId: "prop-123" };
    const res = await GET(req as unknown as Request, { params } as unknown as RouteContext);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.report).toEqual(mockReport.report_json);
    expect(body.score).toBe(85);
    expect(body.grade).toBe("good");
    expect(body.analyzerVersion).toBe("0.1.0-core");
  });

  it("returns 404 when report not found", async () => {
    mockGetReport.mockResolvedValue(null);

    const req = createMockRequest("non-existent");
    const params = { propertyId: "non-existent" };
    const res = await GET(req as unknown as Request, { params } as unknown as RouteContext);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/no seo report found/i);
  });

  it("returns 400 when propertyId is missing", async () => {
    const req = createMockRequest();
    const params = { propertyId: "" };
    const res = await GET(req as unknown as Request, { params } as unknown as RouteContext);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/property id is required/i);
  });

  it("returns 500 on database error", async () => {
    mockGetReport.mockRejectedValue(new Error("Database connection failed"));

    const req = createMockRequest("prop-123");
    const params = { propertyId: "prop-123" };
    const res = await GET(req as unknown as Request, { params } as unknown as RouteContext);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/failed to retrieve/i);
  });
});