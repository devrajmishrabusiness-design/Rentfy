"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../Footer";
import ErrorMessage from "../ErrorMessage";
import type { Property, RenterProfile, Lead, PropertyVisit } from "../types";
import { listingPropertyColumns } from "@/lib/listing-query";
import { useRenterSession } from "./useRenterSession";
import { supabase } from "@/lib/supabase-browser";
import DashboardOverview from "./DashboardOverview";
import SavedPropertiesList from "./SavedPropertiesList";
import VisitList from "./VisitList";
import EnquiryList from "./EnquiryList";
import ProfileSummary from "./ProfileSummary";
import NotificationSettings from "./NotificationSettings";

type TabKey = "overview" | "saved" | "visits" | "enquiries" | "profile" | "settings";

interface DashboardClientProps {
  email: string | null;
  profile: RenterProfile;
}

export default function DashboardClient({
  email,
  profile,
}: DashboardClientProps) {
  const { refreshProfile } = useRenterSession();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [properties, setProperties] = useState<Property[]>([]);
  const [visits, setVisits] = useState<PropertyVisit[]>([]);
  const [enquiries, setEnquiries] = useState<Lead[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [enquiriesLoading, setEnquiriesLoading] = useState(true);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [visitsError, setVisitsError] = useState<string | null>(null);
  const [enquiriesError, setEnquiriesError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;

    void (async () => {
      const { data: favorites, error: favoritesQueryError } = await supabase
        .from("renter_favorites")
        .select("property_id")
        .eq("renter_id", profile.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (favoritesQueryError) {
        setFavoritesError(favoritesQueryError.message);
        setFavoritesLoading(false);
        return;
      }

      const ids = favorites?.map((favorite) => favorite.property_id) ?? [];
      if (ids.length === 0) {
        setProperties([]);
        setFavoritesLoading(false);
        return;
      }

      const { data: savedProperties, error: propertiesError } = await supabase
        .from("properties")
        .select(listingPropertyColumns)
        .in("id", ids)
        .returns<Property[]>();

      if (cancelled) return;
      if (propertiesError) setFavoritesError(propertiesError.message);
      setProperties(
        ids
          .map((id) => savedProperties?.find((property) => property.id === id))
          .filter((property): property is Property => Boolean(property))
      );
      setFavoritesLoading(false);
    })();

    return () => { cancelled = true; };
  }, [profile?.id, refreshKey, supabase]);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;

    void (async () => {
      const { data, error } = await supabase
        .from("property_visits")
        .select(`
          id,
          visit_date,
          visit_time,
          visit_type,
          status,
          notes,
          created_at,
          properties(title, location, city, image_url),
          agencies(agency_name, verified)
        `)
        .eq("renter_id", profile.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        setVisitsError(error.message);
      } else {
        const rows = (data ?? []) as unknown as PropertyVisit[];
        setVisits(rows);
      }
      setVisitsLoading(false);
    })();

    return () => { cancelled = true; };
  }, [profile?.id, refreshKey, supabase]);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;

    void (async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          id,
          lead_name,
          lead_phone,
          source,
          status,
          created_at,
          properties(title, location, city),
          agencies(agency_name)
        `)
        .eq("renter_id", profile.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        setEnquiriesError(error.message);
      } else {
        const rows = (data ?? []) as unknown as Lead[];
        setEnquiries(rows);
      }
      setEnquiriesLoading(false);
    })();

    return () => { cancelled = true; };
  }, [profile?.id, refreshKey, supabase]);

  const removeFavorite = async (propertyId: string) => {
    if (!profile) return;
    const previous = properties;
    setProperties((current) => current.filter((property) => property.id !== propertyId));
    const { error } = await supabase
      .from("renter_favorites")
      .delete()
      .eq("renter_id", profile.id)
      .eq("property_id", propertyId);

    if (error) {
      setProperties(previous);
      setFavoritesError("Could not remove this property. Please try again.");
    }
  };

  const cancelVisit = async (visitId: string) => {
    const previous = visits;
    setVisits((current) =>
      current.map((visit) =>
        visit.id === visitId ? { ...visit, status: "cancelled" } : visit
      )
    );

    const { error } = await supabase
      .from("property_visits")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", visitId);

    if (error) {
      setVisits(previous);
      setVisitsError("Could not cancel visit. Please try again.");
    }
  };

  const refreshAll = () => {
    setFavoritesLoading(true);
    setVisitsLoading(true);
    setEnquiriesLoading(true);
    setRefreshKey((k) => k + 1);
    refreshProfile(profile.user_id);
  };

  const stats = {
    saved: properties.length,
    upcomingVisits: visits.filter((v) => v.status === "confirmed" || v.status === "pending").length,
    totalEnquiries: enquiries.length,
  };

  const navItems = [
    { key: "overview" as TabKey, label: "Dashboard", icon: DashboardIcon },
    { key: "saved" as TabKey, label: "Saved Properties", icon: SavedIcon, badge: stats.saved },
    { key: "visits" as TabKey, label: "Visits", icon: VisitsIcon, badge: stats.upcomingVisits },
    { key: "enquiries" as TabKey, label: "Enquiries", icon: EnquiriesIcon, badge: stats.totalEnquiries },
    { key: "profile" as TabKey, label: "Profile", icon: ProfileIcon },
    { key: "settings" as TabKey, label: "Settings", icon: SettingsIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <DashboardOverview
            stats={stats}
            properties={properties}
            visits={visits}
            enquiries={enquiries}
            onNavigate={setActiveTab}
          />
        );
      case "saved":
        return (
          <SavedPropertiesList
            properties={properties}
            loading={favoritesLoading}
            error={favoritesError}
            onRemove={removeFavorite}
            onRefresh={refreshAll}
          />
        );
      case "visits":
        return (
          <VisitList
            visits={visits}
            loading={visitsLoading}
            error={visitsError}
            onCancel={cancelVisit}
            onRefresh={refreshAll}
          />
        );
      case "enquiries":
        return (
          <EnquiryList
            enquiries={enquiries}
            loading={enquiriesLoading}
            error={enquiriesError}
            onRefresh={refreshAll}
          />
        );
      case "profile":
        return <ProfileSummary email={email} profile={profile} onRefresh={refreshAll} />;
      case "settings":
        return <NotificationSettings />;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="hidden lg:block lg:w-64 xl:w-72 shrink-0">
          <div className="sticky top-[57px]">
            <div className="card p-4">
              <div className="px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">Menu</p>
              </div>
              <nav className="mt-2 space-y-1" aria-label="Dashboard navigation">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      activeTab === item.key
                        ? "bg-orange-50 text-[var(--brand-primary)]"
                        : "text-[var(--brand-text)] hover:bg-stone-100"
                    }`}
                    aria-current={activeTab === item.key ? "page" : undefined}
                  >
                    <item.icon active={activeTab === item.key} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge != null && item.badge > 0 && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        activeTab === item.key ? "bg-orange-100 text-[var(--brand-primary)]" : "bg-stone-200 text-stone-600"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile header */}
          <div className="lg:hidden border-b border-[var(--brand-border)] bg-white">
            <div className="container-app py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-extrabold text-[var(--brand-text)]">Dashboard</h1>
                <span className="badge-info text-xs">Renter</span>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      activeTab === item.key
                        ? "bg-[var(--brand-primary)] text-white"
                        : "bg-stone-100 text-[var(--brand-text)]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block border-b border-[var(--brand-border)] bg-white">
            <div className="container-app py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-[var(--brand-text)]">
                    Welcome, {profile.full_name?.split(" ")[0] || "Renter"}
                  </h1>
                  <p className="mt-1 text-sm text-[var(--brand-muted)]">
                    Manage your rentals, visits, and enquiries
                  </p>
                </div>
                <Link href="/rent" className="btn-primary">Browse Rentals</Link>
              </div>
            </div>
          </div>

          <section className="container-app py-6 sm:py-8">
            <ErrorMessage message={favoritesError || visitsError || enquiriesError} className="mb-4" />
            {renderContent()}
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function SavedIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function VisitsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function EnquiriesIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6m4.22-10.22l4.24-4.24M6.34 6.34L2.1 2.1m17.8 17.8l-4.24-4.24M6.34 17.66l-4.24 4.24M23 12h-6m-6 0H1m20.07-4.93l-4.24 4.24M6.34 6.34l-4.24-4.24" />
    </svg>
  );
}
