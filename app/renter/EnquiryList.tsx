"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lead } from "../types";

interface EnquiryListProps {
  enquiries: Lead[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function EnquiryList({ enquiries, loading, error, onRefresh }: EnquiryListProps) {
  const [archivingId, setArchivingId] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => onRefresh(), 5000);
    return () => clearTimeout(timer);
  }, [error, onRefresh]);

  const archiveStatus = async (enquiryId: string) => {
    setArchivingId(enquiryId);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setArchivingId(null);
  };

  return (
    <div className="space-y-4">
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
      ) : enquiries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--brand-border)] bg-white px-6 py-14 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-2xl text-[var(--brand-primary)]">✉️</div>
          <h3 className="mt-4 text-xl font-extrabold text-[var(--brand-text)]">No enquiries yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--brand-muted)]">Contact an agency about a property to see your messages here.</p>
          <Link href="/rent" className="btn-primary mt-5">Browse Rentals</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {enquiries.map((enquiry) => (
            <div key={enquiry.id} className="card overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/property/${enquiry.property_id}`} className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-extrabold text-[var(--brand-text)]">
                      {enquiry.properties?.title || "Property"}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--brand-muted)]">
                      {enquiry.properties?.location || enquiry.properties?.city || "—"}
                    </p>
                  </Link>
                  <span className="badge-info text-[10px]">{enquiry.status || "new"}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Sent</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--brand-text)]">
                      {enquiry.created_at ? new Date(enquiry.created_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">Agency</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--brand-text)]">
                      {enquiry.agencies?.agency_name || "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/property/${enquiry.property_id}`} className="btn-secondary flex-1 text-center text-xs">Open Property</Link>
                  <button
                    type="button"
                    onClick={() => archiveStatus(enquiry.id)}
                    disabled={archivingId === enquiry.id}
                    className="flex-1 rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--brand-text)] transition hover:bg-stone-50 disabled:cursor-wait"
                  >
                    {archivingId === enquiry.id ? "Archiving..." : "Archive"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
