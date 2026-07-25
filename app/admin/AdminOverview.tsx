"use client";

import Link from "next/link";
import type { Agency, Property, Lead } from "../types";
import StatCard from "../StatCard";

type TabKey = "overview" | "agencies" | "properties" | "users" | "reports" | "analytics" | "audit" | "notifications";

interface AdminOverviewProps {
  agency?: Agency;
  totalAgencies: number;
  verifiedAgencies: number;
  totalProperties: number;
  pendingProperties: number;
  totalLeads: number;
  totalRenters: number;
  agencies: Agency[];
  properties: Property[];
  leads: Lead[];
  onNavigate: (tab: TabKey) => void;
}

export default function AdminOverview({
  agency,
  totalAgencies,
  verifiedAgencies,
  totalProperties,
  pendingProperties,
  totalLeads,
  totalRenters,
  agencies,
  properties,
  leads,
  onNavigate,
}: AdminOverviewProps) {
  const recentActivity = [
    ...agencies.slice(0, 3).map((a) => ({
      id: `agency-${a.id}`,
      title: `Agency ${a.agency_name} ${a.verified ? "verified" : "registered"}`,
      date: null,
      type: "agency",
    })),
    ...properties.slice(0, 3).map((p) => ({
      id: `property-${p.id}`,
      title: `Property "${p.title}" ${p.status}`,
      date: null,
      type: "property",
    })),
    ...leads.slice(0, 3).map((l) => ({
      id: `lead-${l.id}`,
      title: `New lead from ${l.lead_name || "renter"}`,
      date: l.created_at,
      type: "lead",
    })),
  ].slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Agencies" value={totalAgencies} sub={`${verifiedAgencies} verified`} icon={<AgencyIcon />} />
        <StatCard label="Pending Approvals" value={pendingProperties} sub="Properties awaiting review" icon={<PendingIcon />} />
        <StatCard label="Total Renters" value={totalRenters} sub="Registered users" icon={<RenterIcon />} />
        <StatCard label="Leads Today" value={0} sub="Placeholder" icon={<LeadIconLarge />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-extrabold text-[var(--brand-text)]">Quick Actions</h2>
            <p className="mt-1 text-sm text-[var(--brand-muted)]">Common admin tasks</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => onNavigate("agencies")} className="card p-4 text-left transition hover:border-[var(--brand-primary)] hover:shadow-sm">
                <p className="text-sm font-bold text-[var(--brand-text)]">Review Agencies</p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">Approve or reject agency registrations</p>
              </button>
              <button type="button" onClick={() => onNavigate("properties")} className="card p-4 text-left transition hover:border-[var(--brand-primary)] hover:shadow-sm">
                <p className="text-sm font-bold text-[var(--brand-text)]">Moderate Properties</p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">Review and approve listings</p>
              </button>
              <button type="button" onClick={() => onNavigate("users")} className="card p-4 text-left transition hover:border-[var(--brand-primary)] hover:shadow-sm">
                <p className="text-sm font-bold text-[var(--brand-text)]">Manage Users</p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">View and manage renters and agencies</p>
              </button>
              <button type="button" onClick={() => onNavigate("reports")} className="card p-4 text-left transition hover:border-[var(--brand-primary)] hover:shadow-sm">
                <p className="text-sm font-bold text-[var(--brand-text)]">Review Reports</p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">Handle flagged content and users</p>
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-[var(--brand-border)] px-6 py-4">
              <h2 className="text-lg font-extrabold text-[var(--brand-text)]">Recent Activity</h2>
              <p className="text-xs text-[var(--brand-muted)]">Latest platform actions</p>
            </div>
            {recentActivity.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-[var(--brand-muted)]">No activity yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--brand-border)]">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3 px-6 py-3">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-50 text-[var(--brand-primary)]">
                      {activity.type === "agency" && <AgencyIcon />}
                      {activity.type === "property" && <PropertyIcon />}
                      {activity.type === "lead" && <LeadIcon />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--brand-text)]">{activity.title}</p>
                      <p className="text-xs text-[var(--brand-muted)]">
                        {activity.date ? new Date(activity.date).toLocaleString() : "Just now"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-extrabold text-[var(--brand-text)]">Pending Approvals</h2>
            <p className="mt-1 text-xs text-[var(--brand-muted)]">Agencies and properties awaiting review</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-[var(--brand-border)] p-4">
                <p className="text-sm font-bold text-[var(--brand-text)]">{pendingProperties} properties</p>
                <p className="text-xs text-[var(--brand-muted)]">Awaiting approval</p>
              </div>
              <div className="rounded-2xl border border-[var(--brand-border)] p-4">
                <p className="text-sm font-bold text-[var(--brand-text)]">{agencies.filter((a) => !a.verified).length} agencies</p>
                <p className="text-xs text-[var(--brand-muted)]">Awaiting verification</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-extrabold text-[var(--brand-text)]">Platform Health</h2>
            <p className="mt-1 text-xs text-[var(--brand-muted)]">System status overview</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-bold text-emerald-700">All systems operational</p>
                <p className="text-xs text-emerald-600">Last checked: Just now</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgencyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
    </svg>
  );
}

function PropertyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function LeadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

function RenterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LeadIconLarge() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}
