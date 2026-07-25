import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AgencyDashboardClient from "../dashboard/AgencyDashboardClient";
import type { Agency, Property, Lead, PropertyVisit } from "../types";

const mockAgency: Agency = {
  id: "agency-1",
  auth_user_id: "user-1",
  agency_name: "Test Agency",
  owner_name: "Test Owner",
  city: "Noida",
  verified: true,
};

const mockProperty: Property = {
  id: "property-1",
  title: "Test Property",
  rent: 15000,
  location: "Sector 62",
  city: "Noida",
  status: "approved",
};

const mockLead: Lead = {
  id: "lead-1",
  lead_name: "Test Renter",
  lead_phone: "9876543210",
  property_id: "property-1",
  agency_id: "agency-1",
  status: "New",
  created_at: "2026-07-01T00:00:00Z",
  properties: { title: "Test Property" },
};

const mockVisit: PropertyVisit = {
  id: "visit-1",
  property_id: "property-1",
  renter_id: "renter-1",
  visit_date: "2026-07-25",
  visit_time: "10:00",
  visit_type: "site_visit",
  status: "pending",
  created_at: "2026-07-01T00:00:00Z",
  properties: { title: "Test Property", location: "Sector 62", city: "Noida" },
  agencies: { agency_name: "Test Agency" },
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

describe("AgencyDashboardClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard with welcome message", async () => {
    render(
      <AgencyDashboardClient
        agency={mockAgency}
        initialProperties={[mockProperty]}
        initialLeads={[mockLead]}
        initialVisits={[mockVisit]}
        totalProperties={1}
        approvedCount={1}
        pendingCount={0}
        totalLeads={1}
        leadsThisWeek={1}
        leadsThisMonth={1}
        monthlyLeads={[]}
        propertyLeadCounts={[]}
      />
    );
    expect(screen.getByText(/Welcome, Test/)).toBeDefined();
  });

  it("renders sidebar navigation", async () => {
    render(
      <AgencyDashboardClient
        agency={mockAgency}
        initialProperties={[]}
        initialLeads={[]}
        initialVisits={[]}
        totalProperties={0}
        approvedCount={0}
        pendingCount={0}
        totalLeads={0}
        leadsThisWeek={0}
        leadsThisMonth={0}
        monthlyLeads={[]}
        propertyLeadCounts={[]}
      />
    );
    expect(screen.getByText("Menu")).toBeDefined();
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Properties").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Leads").length).toBeGreaterThan(0);
  });

  it("renders overview tab by default", async () => {
    render(
      <AgencyDashboardClient
        agency={mockAgency}
        initialProperties={[]}
        initialLeads={[]}
        initialVisits={[]}
        totalProperties={0}
        approvedCount={0}
        pendingCount={0}
        totalLeads={0}
        leadsThisWeek={0}
        leadsThisMonth={0}
        monthlyLeads={[]}
        propertyLeadCounts={[]}
      />
    );
    expect(screen.getByText("Quick actions")).toBeDefined();
  });

  it("switches to properties tab", async () => {
    render(
      <AgencyDashboardClient
        agency={mockAgency}
        initialProperties={[]}
        initialLeads={[]}
        initialVisits={[]}
        totalProperties={0}
        approvedCount={0}
        pendingCount={0}
        totalLeads={0}
        leadsThisWeek={0}
        leadsThisMonth={0}
        monthlyLeads={[]}
        propertyLeadCounts={[]}
      />
    );
    const propertiesButtons = screen.getAllByText("Properties");
    const sidebarButton = propertiesButtons.find((el) => el.closest("nav") !== null);
    if (sidebarButton) {
      sidebarButton.click();
    }
    await waitFor(() => {
      expect(screen.getByText("Property Management")).toBeDefined();
    });
  });

  it("switches to leads tab", async () => {
    render(
      <AgencyDashboardClient
        agency={mockAgency}
        initialProperties={[]}
        initialLeads={[]}
        initialVisits={[]}
        totalProperties={0}
        approvedCount={0}
        pendingCount={0}
        totalLeads={0}
        leadsThisWeek={0}
        leadsThisMonth={0}
        monthlyLeads={[]}
        propertyLeadCounts={[]}
      />
    );
    const leadsButtons = screen.getAllByText("Leads");
    const sidebarButton = leadsButtons.find((el) => el.closest("nav") !== null);
    if (sidebarButton) {
      sidebarButton.click();
    }
    await waitFor(() => {
      expect(screen.getByText("Lead Management")).toBeDefined();
    });
  });
});
