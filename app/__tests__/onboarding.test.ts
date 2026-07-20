/**
 * Tests for the post-verification onboarding action.
 *
 * The action:
 *   - Requires an authenticated user with a verified email.
 *   - Resolves auth_user_id from the JWT (never from the client).
 *   - Writes through auth.supabase (RLS-enforced).
 *   - Is idempotent (re-running for a user that already has an agency
 *     returns ok without writing again).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const requireUserMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>(
    "@/lib/auth"
  );
  return {
    ...actual,
    requireUser: requireUserMock,
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { completeAgencyOnboarding } from "../actions";

const baseUser = {
  id: "user-uuid-1",
  email: "owner@agency.com",
  email_confirmed_at: "2026-07-20T00:00:00.000Z",
};

function makeAuthedSupabase(opts: {
  existingAgency: { id: string } | null;
  insertError?: { message: string; code?: string } | null;
}) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: opts.existingAgency,
          }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({
        error: opts.insertError ?? null,
      }),
    }),
  } as never;
}

describe("completeAgencyOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when the user is not authenticated", async () => {
    requireUserMock.mockResolvedValueOnce({
      ok: false,
      error: "Not authenticated.",
      status: 401,
    });

    const result = await completeAgencyOnboarding({
      agency_name: "Acme Realty",
      owner_name: "Aman Verma",
      phone: "9876543210",
      city: "Noida",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/authenticated/i);
    }
  });

  it("returns an error when the email is not verified", async () => {
    requireUserMock.mockResolvedValueOnce({
      ok: true,
      user: { ...baseUser, email_confirmed_at: null },
      supabase: makeAuthedSupabase({ existingAgency: null }),
    });

    const result = await completeAgencyOnboarding({
      agency_name: "Acme Realty",
      owner_name: "Aman Verma",
      phone: "9876543210",
      city: "Noida",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/verify/i);
    }
  });

  it("rejects invalid phone numbers", async () => {
    requireUserMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      supabase: makeAuthedSupabase({ existingAgency: null }),
    });

    const result = await completeAgencyOnboarding({
      agency_name: "Acme Realty",
      owner_name: "Aman Verma",
      phone: "x",
      city: "Noida",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/contact/i);
    }
  });

  it("rejects too-short agency name", async () => {
    requireUserMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      supabase: makeAuthedSupabase({ existingAgency: null }),
    });

    const result = await completeAgencyOnboarding({
      agency_name: "A",
      owner_name: "Aman Verma",
      phone: "9876543210",
      city: "Noida",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/2–120/i);
    }
  });

  it("is a no-op when the user already has an agency", async () => {
    requireUserMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      supabase: makeAuthedSupabase({
        existingAgency: { id: "agency-1" },
      }),
    });

    const result = await completeAgencyOnboarding({
      agency_name: "Acme Realty",
      owner_name: "Aman Verma",
      phone: "9876543210",
      city: "Noida",
    });

    expect(result.ok).toBe(true);
  });

  it("treats a unique_violation as success (idempotent under race)", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({
          error: { message: "duplicate key", code: "23505" },
        }),
      }),
    };
    requireUserMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      supabase: supabase as never,
    });

    const result = await completeAgencyOnboarding({
      agency_name: "Acme Realty",
      owner_name: "Aman Verma",
      phone: "9876543210",
      city: "Noida",
    });

    expect(result.ok).toBe(true);
  });

  it("propagates non-unique insert errors as failures", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({
          error: { message: "RLS rejected the row", code: "42501" },
        }),
      }),
    };
    requireUserMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      supabase: supabase as never,
    });

    const result = await completeAgencyOnboarding({
      agency_name: "Acme Realty",
      owner_name: "Aman Verma",
      phone: "9876543210",
      city: "Noida",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/RLS rejected/);
    }
  });
});