import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardClient from "../renter/DashboardClient";
import type { RenterProfile } from "../types";

const mockProfile: RenterProfile = {
  id: "profile-1",
  user_id: "user-1",
  full_name: "Test Renter",
  phone_number: "9876543210",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

vi.mock("@/lib/supabase-browser", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            then: vi.fn((resolve) => resolve({ data: [], error: null })),
          })),
          then: vi.fn((resolve) => resolve({ data: [], error: null })),
        })),
        in: vi.fn(() => ({
          returns: vi.fn(() => ({
            then: vi.fn((resolve) => resolve({ data: [], error: null })),
          })),
        })),
        single: vi.fn(() => ({
          then: vi.fn((resolve) => resolve({ data: null, error: null })),
        })),
        maybeSingle: vi.fn(() => ({
          then: vi.fn((resolve) => resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

vi.mock("../renter/useRenterSession", () => ({
  useRenterSession: () => ({
    profile: mockProfile,
    session: { user: { email: "test@example.com" } },
    isLoading: false,
    openAuthDialog: vi.fn(),
    isAuthOpen: false,
    closeAuthDialog: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

describe("DashboardClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard with welcome message", async () => {
    render(<DashboardClient email="test@example.com" profile={mockProfile} />);
    expect(screen.getByText(/Welcome, Test/)).toBeDefined();
  });

  it("renders sidebar navigation items", async () => {
    render(<DashboardClient email="test@example.com" profile={mockProfile} />);
    expect(screen.getByText("Menu")).toBeDefined();
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Saved Properties").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Visits").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Enquiries").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Profile").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Settings").length).toBeGreaterThan(0);
  });

  it("renders overview tab by default", async () => {
    render(<DashboardClient email="test@example.com" profile={mockProfile} />);
    expect(screen.getByText("Quick Actions")).toBeDefined();
    expect(screen.getAllByText("Recent Activity").length).toBeGreaterThan(0);
  });

  it("renders saved properties empty state when tab is active", async () => {
    render(<DashboardClient email="test@example.com" profile={mockProfile} />);
    const savedButtons = screen.getAllByText("Saved Properties");
    const sidebarButton = savedButtons.find((el) => el.closest("nav") !== null);
    if (sidebarButton) {
      sidebarButton.click();
    }
    await waitFor(() => {
      expect(screen.getByText("No saved properties yet")).toBeDefined();
    });
  });

  it("renders visits empty state when tab is active", async () => {
    render(<DashboardClient email="test@example.com" profile={mockProfile} />);
    const visitsButtons = screen.getAllByText("Visits");
    const sidebarButton = visitsButtons.find((el) => el.closest("nav") !== null);
    if (sidebarButton) {
      sidebarButton.click();
    }
    await waitFor(() => {
      expect(screen.getByText("No upcoming visits")).toBeDefined();
    });
  });

  it("renders enquiries empty state when tab is active", async () => {
    render(<DashboardClient email="test@example.com" profile={mockProfile} />);
    const enquiryButtons = screen.getAllByText("Enquiries");
    const sidebarButton = enquiryButtons.find((el) => el.closest("nav") !== null);
    if (sidebarButton) {
      sidebarButton.click();
    }
    await waitFor(() => {
      expect(screen.getByText("No enquiries yet")).toBeDefined();
    });
  });
});
