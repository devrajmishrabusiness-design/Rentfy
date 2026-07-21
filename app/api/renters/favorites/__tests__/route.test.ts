/**
 * Tests for /api/renters/favorites POST and DELETE routes.
 *
 * Coverage:
 *   - POST: rejects unauthenticated, validates property_id, inserts,
 *     handles unique_violation idempotently
 *   - DELETE: rejects unauthenticated, validates property_id, deletes
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ blocked: false }),
  RateLimitPresets: {
    standard: { tokens: 60, intervalMs: 60_000 },
  },
}));

vi.mock("@/lib/observability", () => ({
  REQUEST_ID_HEADER: "x-request-id",
  createRequestLogger: vi.fn().mockReturnValue({
    info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
  generateRequestId: vi.fn().mockReturnValue("test-request-id"),
}));

import { POST, DELETE } from "../route";
import { createClient } from "@/lib/supabase-server";

const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;

function setupClient(opts: {
  user: { id: string } | null;
  profile: { id: string } | null;
  insertError?: { message: string; code?: string } | null;
  deleteError?: { message: string; code?: string } | null;
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
                data: opts.profile,
              }),
            }),
          }),
        };
      }
      if (table === "renter_favorites") {
        return {
          insert: vi.fn().mockResolvedValue({
            error: opts.insertError ?? null,
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: opts.deleteError ?? null,
              }),
            }),
          }),
        };
      }
      return { select: vi.fn() };
    }),
  });
}

function makeRequest(body: Record<string, unknown>, method = "POST"): Request {
  return new Request("http://localhost/api/renters/favorites", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
  });
}

function makeDeleteRequest(propertyId: string): Request {
  const url = new URL("http://localhost/api/renters/favorites");
  url.searchParams.set("property_id", propertyId);
  return new Request(url, { method: "DELETE" });
}

describe("POST /api/renters/favorites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    setupClient({ user: null, profile: null });
    const res = await POST(makeRequest({ property_id: "prop-1" }) as never);
    expect(res.status).toBe(401);
  });

  it("rejects missing property_id", async () => {
    setupClient({ user: { id: "user-1" }, profile: { id: "renter-1" } });
    const res = await POST(makeRequest({}) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/property_id/i);
  });

  it("returns ok for a valid favorite insert", async () => {
    setupClient({ user: { id: "user-1" }, profile: { id: "renter-1" } });
    const res = await POST(makeRequest({ property_id: "prop-1" }) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns ok for duplicate favorite (idempotent)", async () => {
    setupClient({
      user: { id: "user-1" },
      profile: { id: "renter-1" },
      insertError: { message: "duplicate", code: "23505" },
    });
    const res = await POST(makeRequest({ property_id: "prop-1" }) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns 404 when renter profile not found", async () => {
    setupClient({ user: { id: "user-1" }, profile: null });
    const res = await POST(makeRequest({ property_id: "prop-1" }) as never);
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/renters/favorites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    setupClient({ user: null, profile: null });
    const res = await DELETE(makeDeleteRequest("prop-1") as never);
    expect(res.status).toBe(401);
  });

  it("removes a favorite row", async () => {
    setupClient({ user: { id: "user-1" }, profile: { id: "renter-1" } });
    const res = await DELETE(makeDeleteRequest("prop-1") as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("rejects missing property_id", async () => {
    setupClient({ user: { id: "user-1" }, profile: { id: "renter-1" } });
    const req = new Request("http://localhost/api/renters/favorites", {
      method: "DELETE",
      body: JSON.stringify({}),
    });
    const res = await DELETE(req as never);
    expect(res.status).toBe(400);
  });
});