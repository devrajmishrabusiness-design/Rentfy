"use client";

import type { Lead, Property } from "../types";

interface PlatformAnalyticsProps {
  leads: Lead[];
  properties: Property[];
}

export default function PlatformAnalytics({ leads, properties }: PlatformAnalyticsProps) {
  const approvedCount = properties.filter((p) => p.status === "approved").length;
  const pendingCount = properties.filter((p) => p.status === "pending").length;
  const rejectedCount = properties.filter((p) => p.status === "rejected").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--brand-muted)]">Daily Signups</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--brand-text)]">0</p>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">Placeholder</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--brand-muted)]">Daily Listings</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--brand-text)]">0</p>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">Placeholder</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--brand-muted)]">Lead Volume</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--brand-text)]">{leads.length}</p>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">All time</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--brand-muted)]">Visit Volume</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--brand-text)]">0</p>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">Placeholder</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--brand-muted)]">Approval Time</p>
          <p className="mt-2 text-sm text-[var(--brand-muted)]">Placeholder — backend integration pending.</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--brand-muted)]">Conversion Funnel</p>
          <p className="mt-2 text-sm text-[var(--brand-muted)]">Placeholder — backend integration pending.</p>
        </div>
      </div>

      <div className="card p-6">
        <p className="text-sm font-semibold text-[var(--brand-muted)]">Listing Status Breakdown</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Approved</p>
            <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">{approvedCount}</p>
          </div>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Pending</p>
            <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)]/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Rejected</p>
            <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">{rejectedCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
