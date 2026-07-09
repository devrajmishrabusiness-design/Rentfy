"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Footer from "../Footer";
import PropertyCard from "../PropertyCard";
import ErrorMessage from "../ErrorMessage";
import type { Property, RenterProfile } from "../types";
import { supabase } from "@/lib/supabase-browser";
import { useRenterSession } from "./useRenterSession";

type TabKey = "shortlisted" | "account";

function ProfileForm({ profile }: { profile: RenterProfile }) {
  const { refreshProfile } = useRenterSession();
  const [name, setName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone_number);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    setError(null);
    setSaved(false);

    if (cleanName.length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^[0-9+\-\s()]{7,20}$/.test(cleanPhone)) {
      setError("Please enter a valid contact number.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase
      .from("renter_profiles")
      .update({
        full_name: cleanName,
        phone_number: cleanPhone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    setSaving(false);

    if (updateError) {
      setError(
        updateError.code === "23505"
          ? "That contact number is already used by another account."
          : updateError.message
      );
      return;
    }

    await refreshProfile(profile.user_id);
    setSaved(true);
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label htmlFor="profile-name" className="label">Full name</label>
        <input id="profile-name" className="input" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="profile-phone" className="label">Contact number</label>
        <input id="profile-phone" className="input" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" />
        <p className="mt-1.5 text-xs leading-5 text-[var(--brand-muted)]">Shared only with an agency when you send an enquiry.</p>
      </div>
      <ErrorMessage message={error} />
      {saved && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Profile updated.</p>}
      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

function AccountInfoCard({
  email,
  profile,
}: {
  email: string | undefined;
  profile: RenterProfile;
}) {
  return (
    <div className="card overflow-hidden">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-[var(--brand-primary)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <div>
              <p className="text-base font-extrabold text-[var(--brand-text)]">Account information</p>
              <p className="text-xs font-medium text-[var(--brand-muted)]">Email, name and contact number</p>
            </div>
          </div>
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-full bg-stone-100 text-[var(--brand-text)] transition group-open:rotate-180"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </summary>
        <div className="border-t border-[var(--brand-border)] bg-[var(--brand-background)]/50 px-5 py-5 sm:px-6 sm:py-6">
          <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">Email</p>
            <p className="mt-1 break-all text-sm font-semibold text-[var(--brand-text)]">{email ?? "—"}</p>
          </div>
          <div className="mt-5">
            <ProfileForm key={profile.updated_at} profile={profile} />
          </div>
        </div>
      </details>
    </div>
  );
}

export default function RenterProfilePage() {
  const { profile, session, isLoading, openAuthDialog } = useRenterSession();
  const [properties, setProperties] = useState<Property[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("shortlisted");

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
        .select("*")
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
  }, [profile?.id]);

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

  if (isLoading) {
    return <main className="container-app min-h-[70vh] py-12"><div className="skeleton h-72 rounded-3xl" /></main>;
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[var(--brand-background)]">
        <section className="container-app py-20 text-center">
          <div className="mx-auto max-w-lg rounded-3xl border border-[var(--brand-border)] bg-white p-8 shadow-sm sm:p-10">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-2xl">♡</div>
            <h1 className="mt-5 text-3xl font-extrabold text-[var(--brand-text)]">Your renter account</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--brand-muted)]">Sign in to view saved homes, manage your contact details, and continue your rental search.</p>
            <button type="button" onClick={() => void openAuthDialog("general")} className="btn-primary mt-6">Sign in as renter</button>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  const firstName = profile.full_name?.split(" ")[0] || "Renter";

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      {/* Compact header */}
      <section className="border-b border-[var(--brand-border)] bg-white">
        <div className="container-app py-6 sm:py-8">
          <span className="badge-info">Renter profile</span>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-[var(--brand-text)] sm:text-3xl">
                Welcome, {firstName}
              </h1>
              <p className="mt-1 text-sm text-[var(--brand-muted)]">
                Manage your details and revisit the properties you saved.
              </p>
            </div>
            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-bold text-[var(--brand-primary)]">
              {properties.length} saved
            </span>
          </div>
        </div>
      </section>

      {/* Tab pill row */}
      <section className="sticky top-[57px] z-20 border-b border-[var(--brand-border)] bg-white/95 backdrop-blur-md sm:top-[65px]">
        <div className="container-app">
          <div
            role="tablist"
            aria-label="Profile sections"
            className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto py-3"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "shortlisted"}
              onClick={() => setActiveTab("shortlisted")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === "shortlisted"
                  ? "bg-[var(--brand-primary)] text-white shadow-sm shadow-orange-500/20"
                  : "bg-stone-100 text-[var(--brand-text)] hover:bg-stone-200"
              }`}
            >
              Shortlisted
              <span className={`ml-2 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === "shortlisted" ? "bg-white/20 text-white" : "bg-white text-[var(--brand-muted)]"
              }`}>
                {properties.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "account"}
              onClick={() => setActiveTab("account")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === "account"
                  ? "bg-[var(--brand-primary)] text-white shadow-sm shadow-orange-500/20"
                  : "bg-stone-100 text-[var(--brand-text)] hover:bg-stone-200"
              }`}
            >
              Account
            </button>
<Link
              href="/#listings"
              className="shrink-0 rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-[var(--brand-text)] transition hover:bg-stone-200"
            >
              View Listings
            </Link>
          </div>
        </div>
      </section>

      {/* Content area */}
      <section className="container-app py-6 sm:py-8">
        {activeTab === "shortlisted" && (
          <div>
            <ErrorMessage message={favoritesError} className="mb-4" />

            {favoritesLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="skeleton h-96 rounded-3xl" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--brand-border)] bg-white px-6 py-14 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-2xl text-[var(--brand-primary)]">♡</div>
                <h3 className="mt-4 text-xl font-extrabold text-[var(--brand-text)]">No saved properties yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--brand-muted)]">Tap the heart on any listing to keep it here for later.</p>
                <Link href="/#listings" className="btn-primary mt-5">Browse properties</Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    actions={
                      <button
                        type="button"
                        onClick={() => void removeFavorite(property.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                      >
                        Remove
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "account" && (
          <div className="mx-auto max-w-2xl">
            <AccountInfoCard email={session?.user.email} profile={profile} />
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
