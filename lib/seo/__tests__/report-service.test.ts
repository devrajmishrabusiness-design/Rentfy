/**
 * Unit tests for the SEO report service (persistence layer).
 *
 * Verifies that:
 *   - Reports can be inserted/updated
 *   - Reports can be retrieved by property ID
 *   - Reports can be fetched by agency
 *   - Existence checks work
 *   - Deletion works
 *   - Error handling for missing/corrupted data
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase-admin
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  upsertReport,
  getReportByPropertyId,
  getReportsByAgency,
  hasReport,
  deleteReport,
} from "@/lib/seo/report-service";
import type { SeoReportOutput } from "@/seo-agent/report/types";

const mockReport: SeoReportOutput = {
  overallScore: 85,
  scoreGrade: "good",
  passed: true,
  passedThreshold: 70,
  categoryScores: {
    meta: 90,
    headings: 80,
    content: 85,
    performance: 75,
    accessibility: 80,
    mobile: 90,
    "structured-data": 70,
    links: 85,
    images: 80,
    keywords: 90,
    technical: 85,
  },
  criticalIssues: [],
  highIssues: [],
  mediumIssues: [],
  lowIssues: [],
  topIssues: [],
  recommendations: ["Add meta description"],
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
};

const mockSeoReport = {
  id: "report-uuid",
  property_id: "prop-123",
  overall_score: 85,
  overall_grade: "good",
  report_json: mockReport,
  analyzer_version: "0.1.0-core",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("upsertReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a new report successfully", async () => {
    const mockUpsert = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockSeoReport, error: null }),
    };

    (supabaseAdmin.from as any).mockReturnValue(mockUpsert);

    const result = await upsertReport({
      propertyId: "prop-123",
      report: mockReport,
      analyzerVersion: "0.1.0-core",
    });

    expect(supabaseAdmin.from).toHaveBeenCalledWith("seo_reports");
    expect(mockUpsert.upsert).toHaveBeenCalled();
    expect(result).toEqual(mockSeoReport);
  });

  it("updates an existing report (upsert)", async () => {
    const mockUpsert = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockSeoReport, error: null }),
    };

    (supabaseAdmin.from as any).mockReturnValue(mockUpsert);

    const result = await upsertReport({
      propertyId: "prop-123",
      report: mockReport,
      analyzerVersion: "0.1.0-core",
    });

    expect(mockUpsert.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        property_id: "prop-123",
        overall_score: 85,
        overall_grade: "good",
      }),
      { onConflict: "property_id" }
    );
    expect(result).toEqual(mockSeoReport);
  });

  it("throws on database error", async () => {
    const mockError = new Error("Database error");
    const mockUpsert = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    };

    (supabaseAdmin.from as any).mockReturnValue(mockUpsert);

    await expect(
      upsertReport({
        propertyId: "prop-123",
        report: mockReport,
        analyzerVersion: "0.1.0-core",
      })
    ).rejects.toThrow("Database error");
  });
});

describe("getReportByPropertyId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves a report successfully", async () => {
    const mockSelect = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockSeoReport, error: null }),
    };

    (supabaseAdmin.from as any).mockReturnValue(mockSelect);

    const result = await getReportByPropertyId("prop-123");

    expect(supabaseAdmin.from).toHaveBeenCalledWith("seo_reports");
    expect(mockSelect.eq).toHaveBeenCalledWith("property_id", "prop-123");
    expect(result).toEqual(mockSeoReport);
  });

  it("returns null when no report exists", async () => {
    const mockSelect = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    (supabaseAdmin.from as any).mockReturnValue(mockSelect);

    const result = await getReportByPropertyId("non-existent");

    expect(result).toBeNull();
  });

  it("throws on database error", async () => {
    const mockError = new Error("Database error");
    const mockSelect = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    };

    (supabaseAdmin.from as any).mockReturnValue(mockSelect);

    await expect(getReportByPropertyId("prop-123")).rejects.toThrow(
      "Database error"
    );
  });
});

describe("getReportsByAgency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves all reports for an agency", async () => {
    const mockProperties = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((resolve) => resolve({ data: [{ id: "prop-1" }, { id: "prop-2" }], error: null })),
    };

    const mockReports = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    };

    (supabaseAdmin.from as any)
      .mockReturnValueOnce(mockProperties)
      .mockReturnValueOnce(mockReports);

    const mockReportsResult = {
      data: [mockSeoReport],
      error: null,
    };

    mockReports.order.mockResolvedValue(mockReportsResult);

    const result = await getReportsByAgency("agency-123");

    expect(supabaseAdmin.from).toHaveBeenCalledWith("properties");
    expect(result).toEqual([mockSeoReport]);
  });

  it("returns empty array when agency has no properties", async () => {
    const mockProperties = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((resolve) => resolve({ data: [], error: null })),
    };

    (supabaseAdmin.from as any).mockReturnValue(mockProperties);

    const result = await getReportsByAgency("agency-123");

    expect(result).toEqual([]);
  });

  it("throws on database error", async () => {
    const mockError = new Error("Database error");
    const mockProperties = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((resolve) => {
        // Create a rejected promise
        const rejected = Promise.reject(mockError);
        resolve(rejected);
      }),
    };

    (supabaseAdmin.from as any).mockReturnValue(mockProperties);

    await expect(getReportsByAgency("agency-123")).rejects.toThrow(
      "Database error"
    );
  });
});

describe("hasReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when report exists", async () => {
    const mockSelect = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "report-uuid" }, error: null }),
    };

    (supabaseAdmin.from as any).mockReturnValue(mockSelect);

    const result = await hasReport("prop-123");

    expect(result).toBe(true);
  });

  it("returns false when report does not exist", async () => {
    const mockSelect = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    (supabaseAdmin.from as any).mockReturnValue(mockSelect);

    const result = await hasReport("prop-123");

    expect(result).toBe(false);
  });

  it("returns false on database error", async () => {
    const mockSelect = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
    };

    (supabaseAdmin.from as any).mockReturnValue(mockSelect);

    const result = await hasReport("prop-123");

    expect(result).toBe(false);
  });
});

describe("deleteReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a report successfully", async () => {
    const mockDelete = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    (supabaseAdmin.from as any).mockReturnValue(mockDelete);

    await deleteReport("prop-123");

    expect(supabaseAdmin.from).toHaveBeenCalledWith("seo_reports");
    expect(mockDelete.delete).toHaveBeenCalled();
    expect(mockDelete.eq).toHaveBeenCalledWith("property_id", "prop-123");
  });

  it("throws on database error", async () => {
    const mockError = new Error("Database error");
    const mockDelete = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    (supabaseAdmin.from as any).mockReturnValue(mockDelete);

    // Simulate error by making the chain throw
    mockDelete.eq.mockReturnValue({
      then: vi.fn((_, reject) => reject(mockError)),
    });

    await expect(deleteReport("prop-123")).rejects.toThrow("Database error");
  });
});