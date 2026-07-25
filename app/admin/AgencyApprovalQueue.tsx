"use client";

import { useState, useMemo } from "react";
import type { Agency } from "../types";
import StatusBadge from "../StatusBadge";
import VerifyAgencyButton from "../VerifyAgencyButton";
import UnverifyAgencyButton from "../UnverifyAgencyButton";
import DeleteAgencyButton from "../DeleteAgencyButton";

interface AgencyApprovalQueueProps {
  agencies: Agency[];
}

export default function AgencyApprovalQueue({ agencies }: AgencyApprovalQueueProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return agencies.filter((agency) => {
      const matchesSearch = !search || agency.agency_name?.toLowerCase().includes(search.toLowerCase()) || agency.owner_name?.toLowerCase().includes(search.toLowerCase()) || agency.email?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || (statusFilter === "verified" && agency.verified) || (statusFilter === "pending" && !agency.verified);
      return matchesSearch && matchesStatus;
    });
  }, [agencies, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--brand-text)]">Agency Approval Queue</h2>
            <p className="text-sm text-[var(--brand-muted)]">{agencies.length} total agencies</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Search agencies..."
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
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((agency) => (
            <div key={agency.id} className="card overflow-hidden">
              <div className="p-5">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 text-base font-extrabold text-white">
                      {agency.agency_name?.charAt(0) || "A"}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[var(--brand-text)]">{agency.agency_name}</p>
                        {agency.verified ? <StatusBadge status="verified" /> : <StatusBadge status="pending" />}
                        {agency.is_admin && <span className="badge-muted">Admin</span>}
                      </div>
                      <p className="text-sm text-[var(--brand-muted)]">Owner: {agency.owner_name} · {agency.city}</p>
                      <p className="text-xs text-[var(--brand-muted)]">{agency.email} · {agency.phone}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {agency.verified ? (
                      <UnverifyAgencyButton agencyId={agency.id} />
                    ) : (
                      <VerifyAgencyButton agencyId={agency.id} />
                    )}
                    {!agency.is_admin && (
                      <DeleteAgencyButton agencyId={agency.id} agencyName={agency.agency_name || undefined} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-3xl text-[var(--brand-primary)]">🏢</div>
          <h3 className="mt-4 text-xl font-extrabold text-[var(--brand-text)]">No agencies found</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--brand-muted)]">
            {search || statusFilter !== "all" ? "Try adjusting your search or filters." : "All agencies are processed."}
          </p>
        </div>
      )}
    </div>
  );
}
