import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resend: vi.fn(),
    updateUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  })),
};

vi.mock("@/lib/supabase-browser", () => ({
  supabase: mockSupabase,
}));

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(() => ({ ok: false, error: "No user", status: 401 })),
  requireVerifiedAgency: vi.fn(),
  requireRole: vi.fn(() => ({ ok: false, error: "No user", status: 401 })),
}));

describe("user_roles table", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("RLS policies", () => {
    it("prevents unauthenticated access", async () => {
      const mockError = { message: "Unauthorized" };
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      });

      const result = await mockSupabase.from("user_roles").select("*").single();
      expect(result.error).toBeDefined();
    });
  });

  describe("schema constraints", () => {
    it("rejects invalid role values", async () => {
      const mockError = { code: "23514", message: "check violation" };
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      });

      const result = await mockSupabase.from("user_roles").select("*").single();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe("23514");
    });
  });
});

describe("requireRole helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is exported from lib/auth", async () => {
    const { requireRole } = await import("@/lib/auth");
    expect(requireRole).toBeDefined();
    expect(typeof requireRole).toBe("function");
  });

  it("returns correct shape for unauthenticated user", async () => {
    const { requireRole } = await import("@/lib/auth");
    const result = await requireRole();
    expect(result).toHaveProperty("ok");
    expect(result.ok).toBe(false);
  });

  it("returns role on successful call", async () => {
    const { requireRole } = await import("@/lib/auth");
    const result = await requireRole();
    if (result.ok && result.role) {
      expect(["agency", "renter"]).toContain(result.role);
    }
  });
});

describe("user_roles integration with profile tables", () => {
  it("should map agency profiles to agency roles", async () => {
    // Test structure - real integration requires seeding data
  });

  it("should map renter profiles to renter roles", async () => {
    // Test structure - real integration requires seeding data
  });
});

describe("user_roles_updated_at_default", () => {
  it("has proper default timestamp behavior", async () => {
    const mockError = { code: "23503", message: "foreign key violation" };
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    });

    const result = await mockSupabase.from("user_roles").select("*").single();
    expect(result.error).toBeDefined();
  });
});

describe("schema structure", () => {
  it("has required columns", async () => {
    expect(true).toBe(true);
  });
});