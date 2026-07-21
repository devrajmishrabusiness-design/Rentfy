/**
 * Tests for /api/visits POST route.
 *
 * Coverage:
 *   - Rejects unauthenticated requests
 *   - Validates property_id, visit_date, visit_time, visit_type
 *   - Accepts valid visit_type: site_visit, video_tour, phone_call
 *   - Accepts valid visit_time: HH:MM or morning/afternoon/evening
 *   - Rejects invalid visit_type values (physical, video)
 *   - Rejects invalid visit_time formats (free text)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ blocked: false }),
  RateLimitPresets: {
    moderate: { tokens: 30, intervalMs: 60_000 },
  },
}));

vi.mock("@/lib/observability", () => ({
  REQUEST_ID_HEADER: "x-request-id",
  createRequestLogger: vi.fn().mockReturnValue({
    info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
  generateRequestId: vi.fn().mockReturnValue("test-request-id"),
}));

import { POST } from "../route";
import { createClient } from "@/lib/supabase-server";

const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;

function setupClient(opts: {
  user: { id: string } | null;
  renterProfile: { id: string } | null;
  insertError?: { message: string } | null;
}) {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user } }),
    },
    from: vi.fn((table: string) => {
      if (table === "renter_profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: opts.renterProfile,
              }),
            }),
          }),
        };
      }
      if (table === "property_visits") {
        return {
          insert: vi.fn().mockResolvedValue({
            error: opts.insertError ?? null,
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "visit-1" } }),
            }),
          }),
        };
      }
      return { select: vi.fn() };
    }),
  });
}

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/visits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    setupClient({ user: null, renterProfile: null });
    const res = await POST(makeRequest({
      property_id: "prop-1",
      visit_date: "2025-08-01",
      visit_time: "morning",
      visit_type: "site_visit",
    }) as never);
    expect(res.status).toBe(401);
  });

  it("rejects missing property_id", async () => {
    setupClient({ user: { id: "user-1" }, renterProfile: { id: "renter-1" } });
    const res = await POST(makeRequest({
      visit_date: "2025-08-01",
      visit_time: "morning",
      visit_type: "site_visit",
    }) as never);
    expect(res.status).toBe(400);
  });

  it("rejects invalid visit_date format", async () => {
    setupClient({ user: { id: "user-1" }, renterProfile: { id: "renter-1" } });
    const res = await POST(makeRequest({
      property_id: "prop-1",
      visit_date: "01-08-2025",
      visit_time: "morning",
      visit_type: "site_visit",
    }) as never);
    expect(res.status).toBe(400);
  });

  it("rejects invalid visit_time format (free text)", async () => {
    setupClient({ user: { id: "user-1" }, renterProfile: { id: "renter-1" } });
    const res = await POST(makeRequest({
      property_id: "prop-1",
      visit_date: "2025-08-01",
      visit_time: "Morning (9 AM - 12 PM)",
      visit_type: "site_visit",
    }) as never);
    expect(res.status).toBe(400);
  });

  it("rejects invalid visit_type (physical instead of site_visit)", async () => {
    setupClient({ user: { id: "user-1" }, renterProfile: { id: "renter-1" } });
    const res = await POST(makeRequest({
      property_id: "prop-1",
      visit_date: "2025-08-01",
      visit_time: "morning",
      visit_type: "physical",
    }) as never);
    expect(res.status).toBe(400);
  });

  it("rejects invalid visit_type (video instead of video_tour)", async () => {
    setupClient({ user: { id: "user-1" }, renterProfile: { id: "renter-1" } });
    const res = await POST(makeRequest({
      property_id: "prop-1",
      visit_date: "2025-08-01",
      visit_time: "morning",
      visit_type: "video",
    }) as never);
    expect(res.status).toBe(400);
  });

  it("accepts valid site_visit with morning time slot", async () => {
    setupClient({ user: { id: "user-1" }, renterProfile: { id: "renter-1" } });
    const res = await POST(makeRequest({
      property_id: "prop-1",
      visit_date: "2025-08-01",
      visit_time: "morning",
      visit_type: "site_visit",
    }) as never);
    expect(res.status).toBe(201);
  });

  it("accepts valid video_tour with afternoon time slot", async () => {
    setupClient({ user: { id: "user-1" }, renterProfile: { id: "renter-1" } });
    const res = await POST(makeRequest({
      property_id: "prop-1",
      visit_date: "2025-08-01",
      visit_time: "afternoon",
      visit_type: "video_tour",
    }) as never);
    expect(res.status).toBe(201);
  });

  it("accepts valid HH:MM time format", async () => {
    setupClient({ user: { id: "user-1" }, renterProfile: { id: "renter-1" } });
    const res = await POST(makeRequest({
      property_id: "prop-1",
      visit_date: "2025-08-01",
      visit_time: "14:30",
      visit_type: "site_visit",
    }) as never);
    expect(res.status).toBe(201);
  });

  it("returns 404 when renter profile not found", async () => {
    setupClient({ user: { id: "user-1" }, renterProfile: null });
    const res = await POST(makeRequest({
      property_id: "prop-1",
      visit_date: "2025-08-01",
      visit_time: "morning",
      visit_type: "site_visit",
    }) as never);
    expect(res.status).toBe(404);
  });
});