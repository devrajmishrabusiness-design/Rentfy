/**
 * Tests for the health endpoint.
 *
 * Coverage:
 *   - GET /api/health returns 200 with healthy status
 *   - Returns checks object with env vars and supabase connectivity
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/metrics", () => ({
  readAll: vi.fn().mockReturnValue({}),
}));

import { GET } from "../api/health/route";
import { createClient } from "@/lib/supabase-server";

const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;

function setupSupabase(error: { message: string; code?: string } | null = null) {
  mockCreateClient.mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ error }),
      }),
    }),
  });
}

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("returns 200 healthy when Supabase is reachable", async () => {
    setupSupabase();
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("healthy");
    expect(body.checks.supabase_connectivity).toBe("ok");
    expect(body.checks.env_supabase_url).toBe("ok");
    expect(body.checks.env_supabase_anon_key).toBe("ok");
  });

  it("returns 503 degraded when Supabase is unreachable", async () => {
    setupSupabase({ message: "Connection refused", code: "ECONNREFUSED" });
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.status).toBe("degraded");
  });

  it("returns degraded when env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    setupSupabase();
    const res = await GET();
    const body = await res.json();
    expect(body.checks.env_supabase_url).toBe("fail");
  });
});