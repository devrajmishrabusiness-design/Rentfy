"use client";

import Link from "next/link";
import type { Agency, Lead } from "../types";
import StatCard from "../StatCard";

type TabKey = "overview" | "properties" | "leads" | "visits" | "analytics" | "profile" | "subscription" | "notifications";

interface AgencyOverviewProps {
  agency: Agency;
  totalProperties: number;
  approvedCount: number;
  pendingCount: number;
  totalLeads: number;
  leadsThisWeek: number;
  leadsThisMonth: number;
  monthlyLeads: { label: string; count: number }[];
  propertyLeadCounts: { id: string; title: string; rent: number; leadCount: number }[];
  recentLeads: Lead[];
  onNavigate: (tab: TabKey) => void;
}

export default function AgencyOverview({
  agency,
  totalProperties,
  approvedCount,
  pendingCount,
  totalLeads,
  leadsThisWeek,
  leadsThisMonth,
  monthlyLeads,
  propertyLeadCounts,
  recentLeads,
  onNavigate,
}: AgencyOverviewProps) {
  const maxMonthly = Math.max(...monthlyLeads.map((m) => m.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Listings" value={approvedCount} sub={`${pendingCount} pending`} icon={<HomeIcon />} />
        <StatCard label="Total Leads" value={totalLeads} sub={`${leadsThisWeek} this week`} icon={<LeadsIcon />} />
        <StatCard label="Scheduled Visits" value={0} sub="Upcoming tours" icon={<CalendarIcon />} />
        <StatCard label="Property Views" value={0} sub="All time" icon={<EyeIcon />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--brand-muted)]">Leads this year</p>
                <p className="mt-1 text-2xl font-extrabold">{monthlyLeads.reduce((a, b) => a + b.count, 0)} leads</p>
              </div>
              <span className="badge-info">2026</span>
            </div>
            <div className="grid h-44 grid-cols-12 items-end gap-2">
              {monthlyLeads.map((m) => (
                <div key={m.label} className="flex h-full flex-col items-center justify-end gap-1">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[var(--brand-primary)] to-orange-400 transition-all"
                    style={{ height: `${(m.count / maxMonthly) * 100 || 4}%` }}
                    title={`${m.label}: ${m.count} leads`}
                  />
                  <span className="text-[10px] font-semibold text-[var(--brand-muted)]">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--brand-muted)]">Recent activity</p>
                <h2 className="text-xl font-extrabold">Recent leads</h2>
              </div>
            </div>
            {recentLeads.length > 0 ? (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="rounded-2xl border border-[var(--brand-border)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold">{lead.properties?.title || "Property"}</p>
                        <p className="mt-1 text-xs text-[var(--brand-muted)]">
                          {lead.source || "—"} · {lead.created_at ? new Date(lead.created_at).toLocaleString("en-IN") : "Unknown"}
                        </p>
                      </div>
                      <span className="badge-info text-[10px]">{lead.status || "New"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--brand-muted)]">No leads yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <p className="text-sm font-semibold text-[var(--brand-muted)]">Quick actions</p>
            <div className="mt-4 space-y-3">
              <Link href="/add-property" className="btn-primary w-full">+ Add new property</Link>
              <button type="button" onClick={() => onNavigate("leads")} className="btn-secondary w-full">View Leads</button>
              <button type="button" onClick={() => onNavigate("visits")} className="btn-secondary w-full">Manage Visits</button>
              <button type="button" onClick={() => onNavigate("profile")} className="btn-secondary w-full">Edit Agency Profile</button>
            </div>
          </div>

          <div className="card p-6">
            <p className="text-sm font-semibold text-[var(--brand-muted)]">Top performing</p>
            {propertyLeadCounts.length > 0 ? (
              <div className="mt-4 space-y-3">
                {propertyLeadCounts.map((property) => (
                  <Link
                    key={property.id}
                    href={`/property/${property.id}`}
                    className="flex items-center justify-between rounded-2xl border border-[var(--brand-border)] p-4 transition-all hover:border-[var(--brand-primary)] hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold">{property.title}</p>
                      <p className="text-xs text-[var(--brand-muted)]">₹{property.rent}/month</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-extrabold text-[var(--brand-primary)]">{property.leadCount}</p>
                      <p className="text-xs text-[var(--brand-muted)]">leads</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--brand-muted)]">No property data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function LeadsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
