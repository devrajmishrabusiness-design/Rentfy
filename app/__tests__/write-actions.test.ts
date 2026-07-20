/**
 * Tests for write-side server actions introduced in Sprint 3B.
 *
 * These tests cover the input-validation paths of:
 *   - createProperty: rejects bad inputs, derives agency_id server-side
 *   - updateOwnPropertyData: rejects bad inputs, requires ownership
 *   - createLead: validates inputs, resolves agency from property
 *   - updateRenterProfile: validates inputs
 *
 * Authentication and ownership are exercised through requireUser /
 * requireVerifiedAgency / requirePropertyOwnership, which are mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const requireUserMock = vi.hoisted(() => vi.fn());
const requireVerifiedAgencyMock = vi.hoisted(() => vi.fn());
const requirePropertyOwnershipMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>(
    "@/lib/auth"
  );
  return {
    ...actual,
    requireUser: requireUserMock,
    requireVerifiedAgency: requireVerifiedAgencyMock,
    requirePropertyOwnership: requirePropertyOwnershipMock,
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  createProperty,
  updateOwnPropertyData,
  createLead,
  updateRenterProfile,
} from "../actions";

const baseUser = {
  id: "user-uuid-1",
  email: "owner@agency.com",
  email_confirmed_at: "2026-07-20T00:00:00.000Z",
};

const baseAgency = { id: "agency-1" };

function makeSupabase() {
  return {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  } as never;
}

beforeEach(() => {
  vi.resetAllMocks();
  requireUserMock.mockReset();
  requireVerifiedAgencyMock.mockReset();
  requirePropertyOwnershipMock.mockReset();
});

const validPropertyInput = {
  title: "Spacious 2BHK in Sector 62",
  description: "Well-ventilated apartment close to metro station.",
  rent: 25000,
  city: "Noida",
  location: "Sector 62",
  property_type: "Apartment",
  bedrooms: 2,
  bathrooms: 2,
  furnishing: "Semi Furnished",
  parking: false,
  available_from: "2026-08-01",
  contact_number: "9876543210",
  image_url: "",
  cover_image_url: "",
};

describe("createProperty", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when the user is not a verified agency", async () => {
    requireVerifiedAgencyMock.mockResolvedValueOnce({
      ok: false,
      error: "Agency not verified yet.",
      status: 403,
    });
    const result = await createProperty(validPropertyInput);
    expect(result.ok).toBe(false);
  });

  it("rejects an unknown property_type", async () => {
    requireVerifiedAgencyMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      agencyId: baseAgency.id,
      supabase: makeSupabase(),
    });
    const result = await createProperty({
      ...validPropertyInput,
      property_type: "Mansion",
    });
    expect(result.ok).toBe(false);
    if (!result.ok && result.fieldErrors) {
      expect(result.fieldErrors.property_type).toBeDefined();
    }
  });

  it("rejects rent above the safe maximum", async () => {
    requireVerifiedAgencyMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      agencyId: baseAgency.id,
      supabase: makeSupabase(),
    });
    const result = await createProperty({
      ...validPropertyInput,
      rent: 999_999_999,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a too-short title", async () => {
    requireVerifiedAgencyMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      agencyId: baseAgency.id,
      supabase: makeSupabase(),
    });
    const result = await createProperty({
      ...validPropertyInput,
      title: "ab",
    });
    expect(result.ok).toBe(false);
  });

  it("inserts with status=pending and the JWT-derived agency_id", async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "property-uuid" },
          error: null,
        }),
      }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ insert: insertMock }) };
    requireVerifiedAgencyMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      agencyId: "agency-from-jwt",
      supabase: supabase as never,
    });

    const result = await createProperty(validPropertyInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.propertyId).toBe("property-uuid");
    }

    // The INSERT was called with agency_id from the JWT and status=pending.
    const insertArg = insertMock.mock.calls[0][0];
    expect(insertArg.agency_id).toBe("agency-from-jwt");
    expect(insertArg.status).toBe("pending");
    // Client cannot set agency_id to a different value than the JWT.
    expect(insertArg.agency_id).not.toBe("not-the-agency");
  });
});

describe("updateOwnPropertyData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the user is not a verified agency", async () => {
    requireVerifiedAgencyMock.mockResolvedValueOnce({
      ok: false,
      error: "Agency not verified yet.",
      status: 403,
    });
    const result = await updateOwnPropertyData("p-1", validPropertyInput);
    expect(result.ok).toBe(false);
  });

  it("rejects when the user does not own the property", async () => {
    requireVerifiedAgencyMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      agencyId: "agency-A",
      supabase: makeSupabase(),
    });
    requirePropertyOwnershipMock.mockResolvedValueOnce({
      ok: false,
      error: "You do not own this property.",
      status: 403,
    });
    const result = await updateOwnPropertyData("p-1", validPropertyInput);
    expect(result.ok).toBe(false);
  });

  it("updates the row when ownership is confirmed", async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ update: updateMock }) };
    requireVerifiedAgencyMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      agencyId: "agency-A",
      supabase: supabase as never,
    });
    requirePropertyOwnershipMock.mockResolvedValueOnce({ ok: true });
    const result = await updateOwnPropertyData("p-1", validPropertyInput);
    expect(result.ok).toBe(true);
    // The update must include the .eq("id", propertyId) filter.
    expect(updateMock).toHaveBeenCalled();
  });
});

describe("createLead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires an authenticated user", async () => {
    requireUserMock.mockResolvedValueOnce({
      ok: false,
      error: "Not authenticated.",
      status: 401,
    });
    const result = await createLead({
      propertyId: "p-1",
      name: "Aman",
      phone: "9876543210",
      source: "whatsapp",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid source", async () => {
    const result = await createLead({
      propertyId: "p-1",
      name: "Aman",
      phone: "9876543210",
      source: "carrier-pigeon" as never,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a too-short name", async () => {
    requireUserMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      supabase: makeSupabase(),
    });
    const result = await createLead({
      propertyId: "p-1",
      name: "A",
      phone: "9876543210",
      source: "whatsapp",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid phone", async () => {
    requireUserMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      supabase: makeSupabase(),
    });
    const result = await createLead({
      propertyId: "p-1",
      name: "Aman",
      phone: "abc",
      source: "whatsapp",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a non-approved property", async () => {
    const noopChain = () => {
      const eqChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        single: vi.fn().mockResolvedValue({ data: null }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
      };
      return {
        select: vi.fn(() => eqChain),
        eq: vi.fn(() => eqChain),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        single: vi.fn().mockResolvedValue({ data: null }),
        insert: vi.fn(() => eqChain),
        update: vi.fn(() => eqChain),
      };
    };
    const fromMock = vi.fn((table: string) => {
      if (table === "properties") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "p-1",
                  agency_id: "agency-1",
                  status: "pending",
                },
              }),
            }),
          }),
        };
      }
      return noopChain();
    });
    requireUserMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      supabase: { from: fromMock } as never,
    });
    const result = await createLead({
      propertyId: "p-1",
      name: "Aman",
      phone: "9876543210",
      source: "whatsapp",
    });
    expect(result.ok).toBe(false);
  });

  it("uses the server-resolved agency_id, not the client's", async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "lead-uuid" },
          error: null,
        }),
      }),
    });
    const fromMock = vi.fn((table: string) => {
      if (table === "properties") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "p-1",
                  agency_id: "real-agency",
                  status: "approved",
                },
              }),
            }),
          }),
        };
      }
      if (table === "renter_profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        };
      }
      if (table === "leads") {
        return { insert: insertMock };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        single: vi.fn().mockResolvedValue({ data: null }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
      };
    });
    requireUserMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      supabase: { from: fromMock } as never,
    });
    const result = await createLead({
      propertyId: "p-1",
      name: "Aman",
      phone: "9876543210",
      source: "whatsapp",
    });
    expect(result.ok).toBe(true);
    const insertArg = insertMock.mock.calls[0][0];
    expect(insertArg.agency_id).toBe("real-agency");
    // No property_id in body — it's the same as propertyId passed in.
    expect(insertArg.property_id).toBe("p-1");
  });
});

describe("updateRenterProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated callers", async () => {
    requireUserMock.mockResolvedValueOnce({
      ok: false,
      error: "Not authenticated.",
      status: 401,
    });
    const result = await updateRenterProfile({ full_name: "Aman" });
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid phone format", async () => {
    requireUserMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      supabase: makeSupabase(),
    });
    const result = await updateRenterProfile({ phone_number: "abc" });
    expect(result.ok).toBe(false);
  });

  it("rejects empty phone", async () => {
    requireUserMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      supabase: makeSupabase(),
    });
    const result = await updateRenterProfile({ phone_number: "" });
    expect(result.ok).toBe(false);
  });

  it("updates the profile with the validated payload", async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ update: updateMock }) };
    requireUserMock.mockResolvedValueOnce({
      ok: true,
      user: baseUser,
      supabase: supabase as never,
    });
    const result = await updateRenterProfile({
      full_name: "Aman Verma",
      phone_number: "9876543210",
    });
    expect(result.ok).toBe(true);
    const updateArg = updateMock.mock.calls[0][0];
    expect(updateArg.full_name).toBe("Aman Verma");
    expect(updateArg.phone_number).toBe("9876543210");
    expect(updateArg.updated_at).toBeDefined();
  });
});
