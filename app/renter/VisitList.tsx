"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PropertyVisit } from "../types";

interface VisitListProps {
  visits: PropertyVisit[];
  loading: boolean;
  error: string | null;
  onCancel: (visitId: string) => void;
  onRefresh: () => void;
}

type VisitTab = "upcoming" | "past";

export default function VisitList({ visits, loading, error, onCancel, onRefresh }: VisitListProps) {
  const [activeTab, setActiveTab] = useState<VisitTab>("upcoming");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => onRefresh(), 5000);
    return () => clearTimeout(timer);
  }, [error, onRefresh]);

  const now = new Date();
  const upcoming = visits.filter((visit) => {
    if (!visit.visit_date) return false;
    const visitDate = new Date(`${visit.visit_date}T${visit.visit_time || "00:00"}:00.000Z`);
    return visitDate >= now || ["pending", "confirmed"].includes(visit.status);
  });

  const past = visits.filter((visit) => {
    if (!visit.visit_date) return !["pending", "confirmed"].includes(visit.status);
    const visitDate = new Date(`${visit.visit_date}T${visit.visit_time || "00:00"}:00.000Z`);
    return visitDate < now && !["pending", "confirmed"].includes(visit.status);
  });

  const visibleVisits = activeTab === "upcoming" ? upcoming : past;

  const handleCancel = async (visitId: string) => {
    setCancellingId(visitId);
    await onCancel(visitId);
    setCancellingId(null);
  };

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
      <div className="flex items-center gap-2" role="tablist" aria-label="Visit tabs">
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

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
          <button type="button" onClick={onRefresh} className="btn-primary mt-3">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="card h-40 rounded-2xl">
              <div className="space-y-3 p-5">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-6 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleVisits.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--brand-border)] bg-white px-6 py-14 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-2xl text-[var(--brand-primary)]">📅</div>
          <h3 className="mt-4 text-xl font-extrabold text-[var(--brand-text)]">
            {activeTab === "upcoming" ? "No upcoming visits" : "No past visits"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--brand-muted)]">
            {activeTab === "upcoming" ? "Schedule a visit to see it here." : "Your completed or cancelled visits will appear here."}
          </p>
          {activeTab === "upcoming" && (
            <Link href="/rent" className="btn-primary mt-5 inline-block">Browse Rentals</Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleVisits.map((visit) => (
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
                    <p className="mt-0.5 text-sm font-semibold text-[var(--brand-text)]">
                      {visit.visit_type?.replace("_", " ") || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Agency</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--brand-text)]">
                      {visit.agencies?.agency_name || "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/property/${visit.property_id}`} className="btn-secondary flex-1 text-center text-xs">View Property</Link>
                  {visit.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => handleCancel(visit.id)}
                      disabled={cancellingId === visit.id}
                      className="flex-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-wait"
                    >
                      {cancellingId === visit.id ? "Cancelling..." : "Cancel Visit"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
