"use client";

import type { PropertyVisit } from "../types";

interface AnalyticsDashboardProps {
  monthlyLeads: { label: string; count: number }[];
  totalLeads: number;
}

export default function AnalyticsDashboard({ monthlyLeads, totalLeads }: AnalyticsDashboardProps) {
  const maxMonthly = Math.max(...monthlyLeads.map((m) => m.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--brand-muted)]">Property Views</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--brand-text)]">0</p>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">Placeholder</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--brand-muted)]">Total Leads</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--brand-text)]">{totalLeads}</p>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">All time</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--brand-muted)]">Conversion Rate</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--brand-text)]">0%</p>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">Placeholder</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--brand-muted)]">Visits Scheduled</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--brand-text)]">0</p>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">Placeholder</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--brand-muted)]">Leads over time</p>
            <p className="mt-1 text-2xl font-extrabold">{monthlyLeads.reduce((a, b) => a + b.count, 0)} leads</p>
          </div>
          <span className="badge-info">2026</span>
        </div>
        <div className="grid h-64 grid-cols-12 items-end gap-2">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--brand-muted)]">Most Viewed Properties</p>
          <p className="mt-2 text-sm text-[var(--brand-muted)]">Placeholder — backend integration pending.</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold text-[var(--brand-muted)]">Top Performing Listing</p>
          <p className="mt-2 text-sm text-[var(--brand-muted)]">Placeholder — backend integration pending.</p>
        </div>
      </div>
    </div>
  );
}
