"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Lead } from "../types";
import LeadStatusSelect from "../LeadStatusSelect";

interface LeadManagementProps {
  initialLeads: Lead[];
}

export default function LeadManagement({ initialLeads }: LeadManagementProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return initialLeads.filter((lead) => {
      const matchesSearch = !search || lead.properties?.title?.toLowerCase().includes(search.toLowerCase()) || lead.lead_name?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [initialLeads, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--brand-text)]">Lead Management</h2>
            <p className="text-sm text-[var(--brand-muted)]">{initialLeads.length} total leads</p>
          </div>
          <Link href="/rent" className="btn-primary">Browse Listings</Link>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input sm:w-48"
          >
            <option value="all">All Status</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lead) => (
            <div key={lead.id} className="card overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/property/${lead.property_id}`} className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-extrabold text-[var(--brand-text)]">
                      {lead.properties?.title || "Property"}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--brand-muted)]">
                      {lead.lead_name} · {lead.lead_phone}
                    </p>
                  </Link>
                  <LeadStatusSelect leadId={lead.id} currentStatus={lead.status || "New"} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Sent</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--brand-text)]">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Source</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--brand-text)]">{lead.source || "—"}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/property/${lead.property_id}`} className="btn-secondary flex-1 text-center text-xs">View Property</Link>
                  <button type="button" className="flex-1 rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--brand-text)] transition hover:bg-stone-50">
                    Contact
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-3xl text-[var(--brand-primary)]">✉️</div>
          <h3 className="mt-4 text-xl font-extrabold text-[var(--brand-text)]">No leads yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--brand-muted)]">
            {search || statusFilter !== "all" ? "Try adjusting your search or filters." : "Publish more listings to attract renters."}
          </p>
          {!search && statusFilter === "all" && (
            <Link href="/add-property" className="btn-primary mt-5">+ Add Property</Link>
          )}
        </div>
      )}
    </div>
  );
}
