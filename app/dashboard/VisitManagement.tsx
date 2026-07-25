"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { PropertyVisit } from "../types";

interface VisitManagementProps {
  initialVisits: PropertyVisit[];
}

type VisitTab = "upcoming" | "past";

export default function VisitManagement({ initialVisits }: VisitManagementProps) {
  const [activeTab, setActiveTab] = useState<VisitTab>("upcoming");
  const [search, setSearch] = useState("");

  const now = new Date();
  const upcoming = useMemo(() => {
    return initialVisits.filter((visit) => {
      if (!visit.visit_date) return ["pending", "confirmed"].includes(visit.status);
      const visitDate = new Date(`${visit.visit_date}T${visit.visit_time || "00:00"}:00.000Z`);
      return visitDate >= now || ["pending", "confirmed"].includes(visit.status);
    });
  }, [initialVisits]);

  const past = useMemo(() => {
    return initialVisits.filter((visit) => {
      if (!visit.visit_date) return !["pending", "confirmed"].includes(visit.status);
      const visitDate = new Date(`${visit.visit_date}T${visit.visit_time || "00:00"}:00.000Z`);
      return visitDate < now && !["pending", "confirmed"].includes(visit.status);
    });
  }, [initialVisits]);

  const visibleVisits = activeTab === "upcoming" ? upcoming : past;

  const filtered = useMemo(() => {
    if (!search) return visibleVisits;
    const lower = search.toLowerCase();
    return visibleVisits.filter((v) => v.properties?.title?.toLowerCase().includes(lower) || v.agencies?.agency_name?.toLowerCase().includes(lower));
  }, [visibleVisits, search]);

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700",
      confirmed: "bg-emerald-50 text-emerald-700",
      completed: "bg-stone-100 text-stone-700",
      cancelled: "bg-rose-50 text-rose-700",
    };
    return variants[status] || "bg-stone-100 text-stone-700";
  };

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--brand-text)]">Visit Management</h2>
            <p className="text-sm text-[var(--brand-muted)]">{initialVisits.length} total visits</p>
          </div>
          <input
            type="text"
            placeholder="Search visits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input sm:w-64"
          />
        </div>

        <div className="mt-4 flex items-center gap-2" role="tablist" aria-label="Visit tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "upcoming"}
            onClick={() => setActiveTab("upcoming")}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "upcoming"
                ? "bg-[var(--brand-primary)] text-white shadow-sm shadow-orange-500/20"
                : "bg-stone-100 text-[var(--brand-text)] hover:bg-stone-200"
            }`}
          >
            Upcoming
            <span className="ml-2 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold">
              {upcoming.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "past"}
            onClick={() => setActiveTab("past")}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "past"
                ? "bg-[var(--brand-primary)] text-white shadow-sm shadow-orange-500/20"
                : "bg-stone-100 text-[var(--brand-text)] hover:bg-stone-200"
            }`}
          >
            Past
            <span className="ml-2 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold">
              {past.length}
            </span>
          </button>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((visit) => (
            <div key={visit.id} className="card overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/property/${visit.property_id}`} className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-extrabold text-[var(--brand-text)]">
                      {visit.properties?.title || "Property"}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--brand-muted)]">
                      {visit.properties?.location || visit.properties?.city || "—"}
                    </p>
                  </Link>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusBadge(visit.status)}`}>
                    {visit.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Date</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--brand-text)]">{visit.visit_date || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Time</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--brand-text)]">{visit.visit_time || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Type</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--brand-text)]">{visit.visit_type?.replace("_", " ") || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Renter</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--brand-text)]">
                      {visit.renter_id ? "Renter" : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/property/${visit.property_id}`} className="btn-secondary flex-1 text-center text-xs">View Property</Link>
                  {visit.status === "pending" && (
                    <button type="button" className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100">
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-3xl text-[var(--brand-primary)]">📅</div>
          <h3 className="mt-4 text-xl font-extrabold text-[var(--brand-text)]">
            {activeTab === "upcoming" ? "No upcoming visits" : "No past visits"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--brand-muted)]">
            {activeTab === "upcoming" ? "Visits will appear here when renters schedule them." : "Completed or cancelled visits will appear here."}
          </p>
        </div>
      )}
    </div>
  );
}
