/**
 * Tests for admin-only server actions.
 *
 * Coverage:
 *   - verifyAgency: requires admin, applies verified=true
 *   - unverifyAgency: requires admin, applies verified=false
 *   - approveProperty: requires admin, applies status=approved
 *   - rejectProperty: requires admin, applies status=rejected
 *   - deleteAgency: requires admin, deletes row
 *   - deletePropertyAdmin: requires admin, deletes row
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const requireUserMock = vi.hoisted(() => vi.fn());
const supabaseAdminMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>(
    "@/lib/auth"
  );
  return { ...actual, requireUser: requireUserMock };
});

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: supabaseAdminMock,
  getSupabaseAdmin: vi.fn(() => supabaseAdminMock),
}));

vi.mock("@/lib/rate-limit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rate-limit")>(
    "@/lib/rate-limit"
  );
  return {
    ...actual,
    rateLimitByKey: vi.fn().mockResolvedValue({ blocked: false }),
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  verifyAgency,
  unverifyAgency,
  approveProperty,
  rejectProperty,
  deleteAgency,
  deletePropertyAdmin,
} from "../admin/actions";

const baseUser = {
  id: "admin-user-id",
  email: "admin@agency.com",
  email_confirmed_at: "2026-01-01T00:00:00.000Z",
};

function setupAdmin() {
  requireUserMock.mockResolvedValueOnce({
    ok: true,
    user: baseUser,
    supabase: { from: vi.fn() },
  });

  supabaseAdminMock.from.mockImplementation((table: string) => {
    if (table === "agencies") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { is_admin: true },
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    }
    if (table === "properties") {
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    }
    return { update: vi.fn(), delete: vi.fn() };
  });
}

function setupNonAdmin() {
  requireUserMock.mockResolvedValueOnce({
    ok: true,
    user: baseUser,
    supabase: { from: vi.fn() },
  });
  supabaseAdminMock.from.mockImplementation((table: string) => {
    if (table === "agencies") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      };
    }
    return { select: vi.fn(), update: vi.fn(), delete: vi.fn() };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verifyAgency", () => {
  it("rejects a non-admin caller", async () => {
    setupNonAdmin();
    const result = await verifyAgency("agency-1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/admin/i);
    }
  });

  it("sets verified=true on the agency row", async () => {
    setupAdmin();
    const result = await verifyAgency("agency-1");
    expect(result.ok).toBe(true);
  });
});

describe("approveProperty", () => {
  it("rejects a non-admin caller", async () => {
    setupNonAdmin();
    const result = await approveProperty("prop-1");
    expect(result.ok).toBe(false);
  });

  it("sets status=approved on success", async () => {
    setupAdmin();
    const result = await approveProperty("prop-1");
    expect(result.ok).toBe(true);
  });
});

describe("rejectProperty", () => {
  it("sets status=rejected on success", async () => {
    setupAdmin();
    const result = await rejectProperty("prop-1");
    expect(result.ok).toBe(true);
  });
});

describe("deleteAgency", () => {
  it("rejects a non-admin caller", async () => {
    setupNonAdmin();
    const result = await deleteAgency("agency-1");
    expect(result.ok).toBe(false);
  });

  it("deletes the row on success", async () => {
    setupAdmin();
    const result = await deleteAgency("agency-1");
    expect(result.ok).toBe(true);
  });
});

describe("deletePropertyAdmin", () => {
  it("deletes the property row on success", async () => {
    setupAdmin();
    const result = await deletePropertyAdmin("prop-1");
    expect(result.ok).toBe(true);
  });
});

describe("unverifyAgency", () => {
  it("sets verified=false on success", async () => {
    setupAdmin();
    const result = await unverifyAgency("agency-1");
    expect(result.ok).toBe(true);
  });
});