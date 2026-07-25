import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    refresh: mockRefresh,
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    replace: vi.fn(),
  })),
  usePathname: vi.fn(() => "/admin"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

import AdminDashboardClient from "../admin/AdminDashboardClient";
import type { Agency, Property, Lead } from "../types";

const mockAgency: Agency = {
  id: "agency-1",
  auth_user_id: "user-1",
  agency_name: "Test Agency",
  owner_name: "Test Owner",
  city: "Noida",
  verified: true,
  is_admin: true,
};

const mockAgencies: Agency[] = [
  mockAgency,
  {
    id: "agency-2",
    auth_user_id: "user-2",
    agency_name: "Another Agency",
    owner_name: "Another Owner",
    city: "Delhi",
    verified: false,
    is_admin: false,
  },
];

const mockProperty: Property = {
  id: "property-1",
  title: "Test Property",
  rent: 15000,
  location: "Sector 62",
  city: "Noida",
  status: "pending",
};

const mockLead: Lead = {
  id: "lead-1",
  lead_name: "Test Renter",
  lead_phone: "9876543210",
  property_id: "property-1",
  agency_id: "agency-1",
  status: "New",
  created_at: "2026-07-01T00:00:00Z",
};

describe("AdminDashboardClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockRefresh.mockClear();
  });

  it("renders admin dashboard with welcome message", async () => {
    render(
      <AdminDashboardClient
        agency={mockAgency}
        agencies={mockAgencies}
        properties={[mockProperty]}
        leads={[mockLead]}
        totalAgencies={2}
        verifiedAgencies={1}
        totalProperties={1}
        pendingProperties={1}
        totalLeads={1}
        totalRenters={10}
      />
    );
    expect(screen.getByText("Admin Dashboard")).toBeDefined();
  });

  it("renders sidebar navigation", async () => {
    render(
      <AdminDashboardClient
        agency={mockAgency}
        agencies={mockAgencies}
        properties={[mockProperty]}
        leads={[mockLead]}
        totalAgencies={2}
        verifiedAgencies={1}
        totalProperties={1}
        pendingProperties={1}
        totalLeads={1}
        totalRenters={10}
      />
    );
    expect(screen.getByText("Admin Menu")).toBeDefined();
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Agency Approval").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Properties").length).toBeGreaterThan(0);
  });

  it("renders overview tab by default", async () => {
    render(
      <AdminDashboardClient
        agency={mockAgency}
        agencies={mockAgencies}
        properties={[mockProperty]}
        leads={[mockLead]}
        totalAgencies={2}
        verifiedAgencies={1}
        totalProperties={1}
        pendingProperties={1}
        totalLeads={1}
        totalRenters={10}
      />
    );
    expect(screen.getByText("Quick Actions")).toBeDefined();
  });

  it("switches to agencies tab", async () => {
    render(
      <AdminDashboardClient
        agency={mockAgency}
        agencies={mockAgencies}
        properties={[mockProperty]}
        leads={[mockLead]}
        totalAgencies={2}
        verifiedAgencies={1}
        totalProperties={1}
        pendingProperties={1}
        totalLeads={1}
        totalRenters={10}
      />
    );
    const agenciesButtons = screen.getAllByText("Agency Approval");
    const sidebarButton = agenciesButtons.find((el) => el.closest("nav") !== null);
    if (sidebarButton) {
      sidebarButton.click();
    }
    await waitFor(() => {
      expect(screen.getByText("Agency Approval Queue")).toBeDefined();
    });
  });

  it("switches to properties tab", async () => {
    render(
      <AdminDashboardClient
        agency={mockAgency}
        agencies={mockAgencies}
        properties={[mockProperty]}
        leads={[mockLead]}
        totalAgencies={2}
        verifiedAgencies={1}
        totalProperties={1}
        pendingProperties={1}
        totalLeads={1}
        totalRenters={10}
      />
    );
    const propertiesButtons = screen.getAllByText("Properties");
    const sidebarButton = propertiesButtons.find((el) => el.closest("nav") !== null);
    if (sidebarButton) {
      sidebarButton.click();
    }
    await waitFor(() => {
      expect(screen.getByText("Property Moderation")).toBeDefined();
    });
  });
});
