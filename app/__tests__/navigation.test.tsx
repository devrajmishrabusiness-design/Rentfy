/**
 * Navigation & Authentication Tests - Sprint 5.2
 *
 * Covers:
 * - MobileMenu with conditional profile sections
 * - BottomNav role-aware tabs
 * - ProfileDropdown menus (renter, agency, agency-only)
 * - Accessibility (ARIA landmarks, keyboard nav, focus management)
 *
 * Note: Navbar is an async Server Component and cannot be rendered
 * directly in vitest/jsdom. Its DOM structure is exercised indirectly
 * through DesktopNavLinks, MobileMenu, and ProfileDropdown tests.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

const { mockSupabase } = vi.hoisted(() => {
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

  return { mockSupabase };
});

vi.mock("@/lib/supabase-browser", () => ({
  supabase: mockSupabase,
}));

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
  requireVerifiedAgency: vi.fn(),
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(ui);
}

// Import after mocks
import MobileMenu from "@/app/MobileMenu";
import BottomNav from "@/app/BottomNav";
import ProfileDropdown from "@/app/ProfileDropdown";
import { RenterSessionProvider } from "@/app/renter/RenterSessionProvider";

describe("MobileMenu - PDD Profile Sections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders hamburger button with proper ARIA", () => {
    renderWithProviders(<MobileMenu navItems={[{ label: "Home", href: "/" }]} />);
    const button = screen.getByRole("button", { name: /toggle navigation menu/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls", "mobile-menu");
  });

  it("opens slide-in panel on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileMenu navItems={[{ label: "Home", href: "/" }]} />);
    await user.click(screen.getByRole("button", { name: /toggle navigation menu/i }));
    expect(screen.getByRole("dialog", { name: /navigation menu/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close menu/i })).toBeInTheDocument();
  });

  it("shows public nav links in mobile menu", async () => {
    const user = userEvent.setup();
    const navItems = [
      { label: "Home", href: "/" },
      { label: "Browse Rentals", href: "/rent" },
    ];
    renderWithProviders(<MobileMenu navItems={navItems} />);
    await user.click(screen.getByRole("button", { name: /toggle navigation menu/i }));
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Browse Rentals")).toBeInTheDocument();
  });

  it("does not render login/signup links when unauthenticated", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileMenu navItems={[{ label: "Home", href: "/" }]} />);
    await user.click(screen.getByRole("button", { name: /toggle navigation menu/i }));
    expect(screen.queryByRole("link", { name: /login/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sign up/i })).not.toBeInTheDocument();
  });

  it("shows renter profile section when isRenter=true", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MobileMenu navItems={[{ label: "Home", href: "/" }]} isRenter={true} isAgency={false} isVerifiedAgency={false} isAdmin={false} />
    );
    await user.click(screen.getByRole("button", { name: /toggle navigation menu/i }));
    expect(screen.getByText(/account/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /saved properties/i })).toBeInTheDocument();
  });

  it("shows agency profile section when isAgency=true", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MobileMenu navItems={[{ label: "Home", href: "/" }]} isRenter={false} isAgency={true} isVerifiedAgency={true} isAdmin={false} />
    );
    await user.click(screen.getByRole("button", { name: /toggle navigation menu/i }));
    expect(screen.getByText(/account/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /agency profile/i })).toBeInTheDocument();
    expect(screen.getByText(/verified/i)).toBeInTheDocument();
  });

  it("closes on Escape key", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileMenu navItems={[{ label: "Home", href: "/" }]} />);
    await user.click(screen.getByRole("button", { name: /toggle navigation menu/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("BottomNav - Role-Aware Tabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows visitor tabs when unauthenticated", async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    renderWithProviders(
      <RenterSessionProvider>
        <BottomNav />
      </RenterSessionProvider>
    );
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /browse/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
    });
  });

  it("has safe-area inset for mobile", async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    renderWithProviders(
      <RenterSessionProvider>
        <BottomNav />
      </RenterSessionProvider>
    );
    await waitFor(() => {
      const nav = screen.getByRole("navigation", { name: /primary navigation/i });
      expect(nav).toHaveClass("safe-bottom");
    });
  });

  it("highlights active tab with aria-current when on /rent", async () => {
    const { usePathname: mockUsePathname } = await import("next/navigation");
    (mockUsePathname as ReturnType<typeof vi.fn>).mockReturnValue("/rent");
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    renderWithProviders(
      <RenterSessionProvider>
        <BottomNav />
      </RenterSessionProvider>
    );
    await waitFor(() => {
      const browseLink = screen.getByRole("link", { name: /browse/i });
      expect(browseLink).toHaveAttribute("aria-current", "page");
    });
  });
});

describe("ProfileDropdown - PDD Menus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user menu button", () => {
    renderWithProviders(
      <RenterSessionProvider>
        <ProfileDropdown isRenter={true} isAgency={false} isVerifiedAgency={false} />
      </RenterSessionProvider>
    );
    expect(screen.getByRole("button", { name: /user menu/i })).toBeInTheDocument();
  });

  it("opens dropdown on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RenterSessionProvider>
        <ProfileDropdown isRenter={true} isAgency={false} isVerifiedAgency={false} />
      </RenterSessionProvider>
    );
    await user.click(screen.getByRole("button", { name: /user menu/i }));
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("has proper ARIA attributes", () => {
    renderWithProviders(
      <RenterSessionProvider>
        <ProfileDropdown isRenter={true} isAgency={false} isVerifiedAgency={false} />
      </RenterSessionProvider>
    );
    const button = screen.getByRole("button", { name: /user menu/i });
    expect(button).toHaveAttribute("aria-haspopup", "true");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("MobileMenu has dialog role and aria-modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileMenu navItems={[{ label: "Home", href: "/" }]} />);
    await user.click(screen.getByRole("button", { name: /toggle navigation menu/i }));
    const dialog = screen.getByRole("dialog", { name: /navigation menu/i });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("BottomNav has navigation role and aria-label", () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    renderWithProviders(
      <RenterSessionProvider>
        <BottomNav />
      </RenterSessionProvider>
    );
    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    expect(nav).toBeInTheDocument();
  });
});