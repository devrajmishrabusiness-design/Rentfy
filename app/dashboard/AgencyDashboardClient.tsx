"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Footer from "../Footer";
import type { Agency, Property, Lead, PropertyVisit } from "../types";
import AgencyOverview from "./AgencyOverview";
import PropertyManagement from "./PropertyManagement";
import LeadManagement from "./LeadManagement";
import VisitManagement from "./VisitManagement";
import AnalyticsDashboard from "./AnalyticsDashboard";
import AgencyProfile from "./AgencyProfile";
import SubscriptionPanel from "./SubscriptionPanel";
import NotificationCenter from "./NotificationCenter";

type TabKey = "overview" | "properties" | "leads" | "visits" | "analytics" | "profile" | "subscription" | "notifications";

interface AgencyDashboardClientProps {
  agency: Agency;
  initialProperties: Property[];
  initialLeads: Lead[];
  initialVisits: PropertyVisit[];
  totalProperties: number;
  approvedCount: number;
  pendingCount: number;
  totalLeads: number;
  leadsThisWeek: number;
  leadsThisMonth: number;
  monthlyLeads: { label: string; count: number }[];
  propertyLeadCounts: { id: string; title: string; rent: number; leadCount: number }[];
}

export default function AgencyDashboardClient({
  agency,
  initialProperties,
  initialLeads,
  initialVisits,
  totalProperties,
  approvedCount,
  pendingCount,
  totalLeads,
  leadsThisWeek,
  leadsThisMonth,
  monthlyLeads,
  propertyLeadCounts,
}: AgencyDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const navItems = [
    { key: "overview" as TabKey, label: "Dashboard", icon: DashboardIcon },
    { key: "properties" as TabKey, label: "Properties", icon: PropertiesIcon },
    { key: "leads" as TabKey, label: "Leads", icon: LeadsIcon },
    { key: "visits" as TabKey, label: "Visits", icon: VisitsIcon },
    { key: "analytics" as TabKey, label: "Analytics", icon: AnalyticsIcon },
    { key: "profile" as TabKey, label: "Agency Profile", icon: ProfileIcon },
    { key: "subscription" as TabKey, label: "Subscription", icon: SubscriptionIcon },
    { key: "notifications" as TabKey, label: "Notifications", icon: NotificationsIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <AgencyOverview
            agency={agency}
            totalProperties={totalProperties}
            approvedCount={approvedCount}
            pendingCount={pendingCount}
            totalLeads={totalLeads}
            leadsThisWeek={leadsThisWeek}
            leadsThisMonth={leadsThisMonth}
            monthlyLeads={monthlyLeads}
            propertyLeadCounts={propertyLeadCounts}
            recentLeads={initialLeads.slice(0, 5)}
            onNavigate={setActiveTab}
          />
        );
      case "properties":
        return (
          <PropertyManagement
            initialProperties={initialProperties}
            totalProperties={totalProperties}
          />
        );
      case "leads":
        return <LeadManagement initialLeads={initialLeads} />;
      case "visits":
        return <VisitManagement initialVisits={initialVisits} />;
      case "analytics":
        return <AnalyticsDashboard monthlyLeads={monthlyLeads} totalLeads={totalLeads} />;
      case "profile":
        return <AgencyProfile agency={agency} />;
      case "subscription":
        return <SubscriptionPanel />;
      case "notifications":
        return <NotificationCenter />;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="hidden lg:block lg:w-64 xl:w-72 shrink-0">
          <div className="sticky top-[57px]">
            <div className="card p-4">
              <div className="px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">Menu</p>
              </div>
              <nav className="mt-2 space-y-1" aria-label="Dashboard navigation">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      activeTab === item.key
                        ? "bg-orange-50 text-[var(--brand-primary)]"
                        : "text-[var(--brand-text)] hover:bg-stone-100"
                    }`}
                    aria-current={activeTab === item.key ? "page" : undefined}
                  >
                    <item.icon active={activeTab === item.key} />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile header */}
          <div className="lg:hidden border-b border-[var(--brand-border)] bg-white">
            <div className="container-app py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-extrabold text-[var(--brand-text)]">Dashboard</h1>
                <span className="badge-info text-xs">Agency</span>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      activeTab === item.key
                        ? "bg-[var(--brand-primary)] text-white"
                        : "bg-stone-100 text-[var(--brand-text)]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block border-b border-[var(--brand-border)] bg-white">
            <div className="container-app py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-[var(--brand-text)]">
                    Welcome, {agency.owner_name?.split(" ")[0] || "Agency"}
                  </h1>
                  <p className="mt-1 text-sm text-[var(--brand-muted)]">
                    Manage your properties, leads, and visits
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href="/add-property" className="btn-primary">+ Add Property</Link>
                </div>
              </div>
            </div>
          </div>

          <section className="container-app py-6 sm:py-8">
            {renderContent()}
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function PropertiesIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function LeadsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function VisitsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function AnalyticsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SubscriptionIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function NotificationsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
