"use client";

import { useState } from "react";
import type { Agency, Property, Lead } from "../types";
import AdminOverview from "./AdminOverview";
import AgencyApprovalQueue from "./AgencyApprovalQueue";
import PropertyModeration from "./PropertyModeration";
import UserManagement from "./UserManagement";
import ReportsFlags from "./ReportsFlags";
import PlatformAnalytics from "./PlatformAnalytics";
import AuditLog from "./AuditLog";
import AdminNotificationCenter from "./AdminNotificationCenter";

type TabKey = "overview" | "agencies" | "properties" | "users" | "reports" | "analytics" | "audit" | "notifications";

interface AdminDashboardClientProps {
  agency?: Agency;
  agencies: Agency[];
  properties: Property[];
  leads: Lead[];
  totalAgencies: number;
  verifiedAgencies: number;
  totalProperties: number;
  pendingProperties: number;
  totalLeads: number;
  totalRenters: number;
}

export default function AdminDashboardClient({
  agency,
  agencies,
  properties,
  leads,
  totalAgencies,
  verifiedAgencies,
  totalProperties,
  pendingProperties,
  totalLeads,
  totalRenters,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const navItems = [
    { key: "overview" as TabKey, label: "Dashboard", icon: DashboardIcon },
    { key: "agencies" as TabKey, label: "Agency Approval", icon: AgenciesIcon },
    { key: "properties" as TabKey, label: "Properties", icon: PropertiesIcon },
    { key: "users" as TabKey, label: "Users", icon: UsersIcon },
    { key: "reports" as TabKey, label: "Reports", icon: ReportsIcon },
    { key: "analytics" as TabKey, label: "Analytics", icon: AnalyticsIcon },
    { key: "audit" as TabKey, label: "Audit Log", icon: AuditIcon },
    { key: "notifications" as TabKey, label: "Notifications", icon: NotificationsIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <AdminOverview
            agency={agency}
            totalAgencies={totalAgencies}
            verifiedAgencies={verifiedAgencies}
            totalProperties={totalProperties}
            pendingProperties={pendingProperties}
            totalLeads={totalLeads}
            totalRenters={totalRenters}
            agencies={agencies}
            properties={properties}
            leads={leads}
            onNavigate={setActiveTab}
          />
        );
      case "agencies":
        return <AgencyApprovalQueue agencies={agencies} />;
      case "properties":
        return <PropertyModeration properties={properties} />;
      case "users":
        return <UserManagement agencies={agencies} />;
      case "reports":
        return <ReportsFlags />;
      case "analytics":
        return <PlatformAnalytics leads={leads} properties={properties} />;
      case "audit":
        return <AuditLog />;
      case "notifications":
        return <AdminNotificationCenter />;
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
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">Admin Menu</p>
              </div>
              <nav className="mt-2 space-y-1" aria-label="Admin navigation">
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
                <h1 className="text-lg font-extrabold text-[var(--brand-text)]">Admin</h1>
                <span className="badge-info text-xs">Platform</span>
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
                    Admin Dashboard
                  </h1>
                  <p className="mt-1 text-sm text-[var(--brand-muted)]">
                    Platform operations and moderation
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="container-app py-6 sm:py-8">
            {renderContent()}
          </section>
        </div>
      </div>
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

function AgenciesIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
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

function UsersIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ReportsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
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

function AuditIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
