"use client";

import Link from "next/link";
import type { Property, PropertyVisit, Lead } from "../types";

type TabKey = "overview" | "saved" | "visits" | "enquiries" | "profile" | "settings";

interface DashboardOverviewProps {
  stats: {
    saved: number;
    upcomingVisits: number;
    totalEnquiries: number;
  };
  properties: Property[];
  visits: PropertyVisit[];
  enquiries: Lead[];
  onNavigate: (tab: TabKey) => void;
}

export default function DashboardOverview({
  stats,
  properties,
  visits,
  enquiries,
  onNavigate,
}: DashboardOverviewProps) {
  const recentActivities = [
    ...visits.slice(0, 3).map((visit) => ({
      id: `visit-${visit.id}`,
      type: "visit" as const,
      title: `Scheduled visit${visit.properties?.title ? ` at ${visit.properties.title}` : ""}`,
      date: visit.created_at,
      status: visit.status,
    })),
    ...enquiries.slice(0, 3).map((enquiry) => ({
      id: `enquiry-${enquiry.id}`,
      type: "enquiry" as const,
      title: `Enquiry sent${enquiry.properties?.title ? ` for ${enquiry.properties.title}` : ""}`,
      date: enquiry.created_at,
      status: enquiry.status,
    })),
    ...properties.slice(0, 3).map((property) => ({
      id: `property-${property.id}`,
      type: "property" as const,
      title: `Saved ${property.title || "property"}`,
      date: property.created_at,
      status: null,
    })),
  ]
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 5);

  const activityIcon = (type: string) => {
    switch (type) {
      case "visit":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case "enquiry":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
      case "property":
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saved Properties" value={stats.saved} sub="Properties you liked" icon="saved" />
        <StatCard label="Upcoming Visits" value={stats.upcomingVisits} sub="Pending and confirmed" icon="visits" />
        <StatCard label="Total Enquiries" value={stats.totalEnquiries} sub="Sent to agencies" icon="enquiries" />
        <StatCard label="Recent Activity" value={recentActivities.length} sub="Latest actions" icon="activity" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-extrabold text-[var(--brand-text)]">Quick Actions</h2>
            <p className="mt-1 text-sm text-[var(--brand-muted)]">Common tasks to move faster</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/rent" className="card p-4 transition hover:border-[var(--brand-primary)] hover:shadow-sm">
                <p className="text-sm font-bold text-[var(--brand-text)]">Browse Rentals</p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">Explore verified properties</p>
              </Link>
              <button type="button" onClick={() => onNavigate("saved")} className="card p-4 text-left transition hover:border-[var(--brand-primary)] hover:shadow-sm">
                <p className="text-sm font-bold text-[var(--brand-text)]">View Saved Properties</p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">Revisit your shortlist</p>
              </button>
              <button type="button" onClick={() => onNavigate("visits")} className="card p-4 text-left transition hover:border-[var(--brand-primary)] hover:shadow-sm">
                <p className="text-sm font-bold text-[var(--brand-text)]">Schedule a Visit</p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">Book a property tour</p>
              </button>
              <button type="button" onClick={() => onNavigate("profile")} className="card p-4 text-left transition hover:border-[var(--brand-primary)] hover:shadow-sm">
                <p className="text-sm font-bold text-[var(--brand-text)]">Edit Profile</p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">Update your details</p>
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-[var(--brand-border)] px-6 py-4">
              <h2 className="text-lg font-extrabold text-[var(--brand-text)]">Recent Activity</h2>
              <p className="text-xs text-[var(--brand-muted)]">Your latest actions on RenterEasy</p>
            </div>
            {recentActivities.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-[var(--brand-muted)]">No activity yet. Start browsing to see updates here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--brand-border)]">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3 px-6 py-3">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-50 text-[var(--brand-primary)]">
                      {activityIcon(activity.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--brand-text)]">{activity.title}</p>
                      <p className="text-xs text-[var(--brand-muted)]">
                        {activity.date ? new Date(activity.date).toLocaleDateString() : "Just now"}
                      </p>
                    </div>
                    {activity.status && (
                      <span className="badge-info text-[10px]">{activity.status}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-extrabold text-[var(--brand-text)]">Saved Properties</h2>
            <p className="mt-1 text-xs text-[var(--brand-muted)]">Your shortlisted homes</p>
            {properties.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--brand-border)] p-5 text-center">
                <p className="text-sm font-semibold text-[var(--brand-text)]">No saved properties yet</p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">Tap the heart on any listing</p>
                <Link href="/rent" className="btn-primary mt-3 inline-block">Browse Rentals</Link>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {properties.slice(0, 3).map((property) => (
                  <Link key={property.id} href={`/property/${property.id}`} className="flex items-center gap-3 rounded-xl border border-[var(--brand-border)] p-2 transition hover:border-[var(--brand-primary)]">
                    <div className="h-12 w-16 shrink-0 rounded-lg bg-stone-100">
                      {property.image_url && (
                        <img src={property.image_url} alt="" className="h-full w-full rounded-lg object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--brand-text)]">{property.title || "Property"}</p>
                      <p className="text-xs text-[var(--brand-muted)]">{property.location || property.city || "—"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-base font-extrabold text-[var(--brand-text)]">Visits</h2>
            <p className="mt-1 text-xs text-[var(--brand-muted)]">Upcoming and past</p>
            {visits.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--brand-border)] p-5 text-center">
                <p className="text-sm font-semibold text-[var(--brand-text)]">No visits scheduled</p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">Book a tour of a property</p>
                <button type="button" onClick={() => onNavigate("visits")} className="btn-primary mt-3">Schedule Visit</button>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {visits.slice(0, 3).map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between rounded-xl border border-[var(--brand-border)] px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--brand-text)]">
                        {visit.properties?.title || "Property visit"}
                      </p>
                      <p className="text-xs text-[var(--brand-muted)]">
                        {visit.visit_date} {visit.visit_time ? `· ${visit.visit_time}` : ""}
                      </p>
                    </div>
                    <span className="badge-info text-[10px]">{visit.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: number;
  sub: string;
  icon: string;
}) {
  const iconNode = (() => {
    switch (icon) {
      case "saved":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        );
      case "visits":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case "enquiries":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
      case "activity":
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        );
    }
  })();

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--brand-muted)]">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--brand-text)]">{value}</p>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">{sub}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-100 text-[var(--brand-primary)]" aria-hidden>
          {iconNode}
        </span>
      </div>
    </div>
  );
}
