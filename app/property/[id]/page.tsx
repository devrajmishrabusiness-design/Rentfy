import { cache } from "react";
import ImageGallery from "@/app/ImageGallery";
import { createClient } from "@/lib/supabase-server";
import ContactAgencyButton from "@/app/ContactAgencyButton";
import Footer from "@/app/Footer";
import StatusBadge from "@/app/StatusBadge";
import AgencyReviews from "@/app/renter/AgencyReviews";
import SimilarListings from "@/app/SimilarListings";
import ScheduleVisitButton from "@/app/renter/ScheduleVisitButton";
import FavoriteButton from "@/app/renter/FavoriteButton";
import SharePropertyButton from "@/app/property/SharePropertyButton";
import Link from "next/link";
import type { Metadata } from "next";

const PROPERTY_COLUMNS =
  "id, title, description, rent, city, location, property_type, bedrooms, bathrooms, furnishing, parking, available_from, image_url, agency_id, area_sqft, status, views_count, created_at, updated_at";

const getProperty = cache(async (id: string) => {
  const supabase = await createClient();
  return supabase
    .from("properties")
    .select(PROPERTY_COLUMNS)
    .eq("id", id)
    .eq("status", "approved")
    .single();
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const { data: property } = await getProperty(id);

  if (!property) {
    return {
      title: "Property Not Found | RenterEasy",
      description: "The requested property could not be found.",
    };
  }

  return {
    title: `${property.title} | RenterEasy`,
    description:
      property.description?.slice(0, 160) ||
      `Rental property in ${property.city} listed on RenterEasy.`,
    openGraph: {
      title: `${property.title} | RenterEasy`,
      description:
        property.description?.slice(0, 160) ||
        `Rental property in ${property.city} listed on RenterEasy.`,
      images: property.image_url ? [property.image_url] : [],
    },
  };
}

const highlightIcons: Record<string, string> = {
  Apartment: "🏢",
  Flat: "🏬",
  Villa: "🏡",
  House: "🏘️",
};

const ALL_AMENITIES = [
  { key: "parking", icon: "🚗", label: "Parking" },
  { key: "furnishing", icon: "🛋️", label: "Furnished" },
  { key: "lift", icon: "🛗", label: "Lift" },
  { key: "power_backup", icon: "⚡", label: "Power Backup" },
  { key: "water_supply", icon: "💧", label: "Water Supply" },
  { key: "security", icon: "🛡️", label: "Security" },
  { key: "internet", icon: "📶", label: "Internet" },
  { key: "pet_friendly", icon: "🐾", label: "Pet Friendly" },
  { key: "garden", icon: "🌳", label: "Garden" },
  { key: "gym", icon: "🏋️", label: "Gym" },
  { key: "swimming_pool", icon: "🏊", label: "Swimming Pool" },
  { key: "available_from", icon: "📅", label: "Available" },
];

export const revalidate = 60;

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: property } = await getProperty(id);

  if (!property) {
    return (
      <main className="min-h-screen bg-[var(--brand-background)]">
        <div className="container-app py-32 text-center">
          <p className="text-2xl font-bold">Property not found</p>
          <p className="mt-2 text-[var(--brand-muted)]">
            The property you&apos;re looking for may have been removed.
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  const supabase = await createClient();

  const { data: agency } = await supabase
    .from("agencies")
    .select("id, agency_name, verified, owner_name, city, phone")
    .eq("id", property.agency_id)
    .single();

  const { data: images } = await supabase
    .from("property_images")
    .select("image_url")
    .eq("property_id", property.id);

  const imageUrls = images?.map((img) => img.image_url) || [];

  const whatsappPhone = agency?.phone || "9084061619";
  const contactPhone = agency?.phone || "9084061619";

  const activeAmenities = ALL_AMENITIES.filter((a) => {
    if (a.key === "parking") return !!property.parking;
    if (a.key === "furnishing") return !!property.furnishing;
    if (a.key === "available_from") return true;
    return false;
  });

  const formatRent = (value: number | null | undefined) => {
    if (value == null) return "—";
    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  const formatArea = (value: number | null | undefined) => {
    if (value == null) return "—";
    return `${value} sqft`;
  };

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <div className="container-app py-6 pb-32 lg:pb-10">
        <ImageGallery images={imageUrls} title={property.title} />

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main */}
          <div className="space-y-8">
            <div className="card p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <StatusBadge status={property.status || "approved"} />
                    {property.property_type && (
                      <span className="badge-muted">
                        {highlightIcons[property.property_type] || "🏠"}{" "}
                        {property.property_type}
                      </span>
                    )}
                    {property.furnishing && (
                      <span className="badge-muted">
                        {property.furnishing}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-extrabold text-[var(--brand-text)] sm:text-4xl">
                    {property.title}
                  </h1>
                  <p className="mt-2 flex items-center gap-2 text-base font-medium text-[var(--brand-muted)]">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {property.location && property.city
                      ? `${property.location}, ${property.city}`
                      : property.location || property.city || "Location not specified"}
                  </p>
                </div>
              </div>

              {property.description && (
                <div className="mt-6 border-t border-[var(--brand-border)] pt-6">
                  <h2 className="text-lg font-bold text-[var(--brand-text)]">
                    About this property
                  </h2>
                  <p className="mt-3 whitespace-pre-line leading-7 text-[var(--brand-muted)]">
                    {property.description}
                  </p>
                </div>
              )}
            </div>

            {/* Highlights */}
            <div className="card p-7">
              <h2 className="text-lg font-bold text-[var(--brand-text)]">
                Property highlights
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: "Monthly Rent", value: formatRent(property.rent), icon: "💰" },
                  { label: "Security Deposit", value: "—", icon: "🔒" },
                  { label: "Property Type", value: property.property_type || "—", icon: "🏠" },
                  { label: "Bedrooms", value: property.bedrooms ?? "—", icon: "🛏️" },
                  { label: "Bathrooms", value: property.bathrooms ?? "—", icon: "🚿" },
                  { label: "Area", value: formatArea(property.area_sqft), icon: "📐" },
                  { label: "Floor", value: "—", icon: "🏢" },
                  { label: "Furnishing", value: property.furnishing || "—", icon: "🛋️" },
                  {
                    label: "Parking",
                    value: property.parking ? "Available" : "Not Available",
                    icon: "🚗",
                  },
                  {
                    label: "Available From",
                    value: property.available_from || "Now",
                    icon: "📅",
                  },
                  {
                    label: "Property Status",
                    value: property.status
                      ? property.status.charAt(0).toUpperCase() + property.status.slice(1)
                      : "Approved",
                    icon: "✅",
                  },
                ].map((h) => (
                  <div
                    key={h.label}
                    className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4"
                  >
                    <span className="text-xl" aria-hidden>
                      {h.icon}
                    </span>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)]">
                      {h.label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">
                      {h.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="card p-7">
              <h2 className="text-lg font-bold text-[var(--brand-text)]">
                Location
              </h2>
              <div className="mt-5 space-y-3">
                {property.location && (
                  <div className="flex items-start gap-3">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 shrink-0 text-[var(--brand-muted)]"
                      aria-hidden
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-[var(--brand-text)]">Address</p>
                      <p className="text-sm text-[var(--brand-muted)]">{property.location}</p>
                    </div>
                  </div>
                )}
                {property.city && (
                  <div className="flex items-start gap-3">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 shrink-0 text-[var(--brand-muted)]"
                      aria-hidden
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-[var(--brand-text)]">City</p>
                      <p className="text-sm text-[var(--brand-muted)]">{property.city}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-background)] p-6 text-center">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto text-[var(--brand-muted)]"
                  aria-hidden
                >
                  <polygon points="1 6 1 22 8 18 16 22 21 18 21 2 16 6 8 2 1 6" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                </svg>
                <p className="mt-2 text-sm font-semibold text-[var(--brand-text)]">
                  Interactive map coming soon
                </p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">
                  View exact location on map in a future update.
                </p>
              </div>
            </div>

            {/* Amenities */}
            <div className="card p-7">
              <h2 className="text-lg font-bold text-[var(--brand-text)]">
                Amenities
              </h2>
              {activeAmenities.length > 0 ? (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {activeAmenities.map((a) => (
                    <div
                      key={a.key}
                      className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-[var(--brand-primary)]"
                    >
                      <span className="text-xl" aria-hidden>
                        {a.icon}
                      </span>
                      <span className="text-sm font-bold text-current">
                        {a.label}
                      </span>
                      <span className="ml-auto text-emerald-600">✓</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--brand-muted)]">
                  No specific amenities listed for this property.
                </p>
              )}
            </div>

            {/* Agency */}
            <div className="card p-7">
              <h2 className="text-lg font-bold text-[var(--brand-text)]">
                Listed by
              </h2>
              <div className="mt-5 flex items-center gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-lg font-extrabold text-white">
                  {agency?.agency_name?.charAt(0) || "R"}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-[var(--brand-text)]">
                      {agency?.agency_name || "RenterEasy Partner"}
                    </p>
                    {agency?.verified && (
                      <span className="badge-success">Verified</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--brand-muted)]">
                    Owner: {agency?.owner_name || "N/A"}
                  </p>
                  <p className="text-sm text-[var(--brand-muted)]">
                    {agency?.city || "N/A"}
                  </p>
                  {agency?.id && (
                    <Link
                      href={`/agency/${agency.id}`}
                      className="mt-2 inline-block text-sm font-semibold text-[var(--brand-primary)] hover:underline"
                    >
                      View agency profile
                    </Link>
                  )}
                </div>
              </div>
              {agency?.id && <AgencyReviews agencyId={agency.id} />}
            </div>
          </div>

          {/* Sticky contact card */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <div className="rounded-2xl bg-gradient-to-br from-stone-50 to-orange-50 p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                  Rental price
                </p>
                <p className="mt-1 text-3xl font-extrabold text-[var(--brand-text)]">
                  {formatRent(property.rent)}
                  <span className="text-sm font-medium text-[var(--brand-muted)]">
                    /mo
                  </span>
                </p>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <div className="flex-1">
                  <ContactAgencyButton
                    propertyId={property.id}
                    agencyId={agency?.id || ""}
                    whatsappPhone={whatsappPhone}
                    contactPhone={contactPhone}
                    propertyTitle={property.title}
                    agencyName={agency?.agency_name || undefined}
                  />
                </div>
                <div className="w-10">
                  <FavoriteButton
                    propertyId={property.id}
                    label="Save property"
                    className="h-12 w-12"
                  />
                </div>
              </div>

              <div className="mt-3">
                <ScheduleVisitButton
                  propertyId={property.id}
                  agencyId={agency?.id || ""}
                  propertyTitle={property.title}
                />
              </div>

              <div className="mt-3">
                <SharePropertyButton
                  propertyId={property.id}
                  propertyTitle={property.title}
                />
              </div>

              <div className="mt-5 space-y-2 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-[var(--brand-muted)]">Type</span>
                  <span className="font-bold">{property.property_type || "—"}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-[var(--brand-muted)]">Bedrooms</span>
                  <span className="font-bold">{property.bedrooms ?? "—"}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-[var(--brand-muted)]">Bathrooms</span>
                  <span className="font-bold">{property.bathrooms ?? "—"}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-[var(--brand-muted)]">Area</span>
                  <span className="font-bold">{formatArea(property.area_sqft)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-[var(--brand-muted)]">Deposit</span>
                  <span className="font-bold">—</span>
                </p>
              </div>

              <p className="mt-4 text-center text-xs leading-5 text-[var(--brand-muted)]">
                You&apos;ll share your name and phone with the agency before the
                contact is revealed.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Similar Listings */}
      <section className="container-app py-12">
        <SimilarListings
          currentPropertyId={property.id}
          currentPropertyCity={property.city}
          currentPropertyType={property.property_type}
          currentPropertyBedrooms={property.bedrooms}
          currentPropertyRent={property.rent}
        />
      </section>

      {/* Mobile sticky bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--brand-border)] bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ContactAgencyButton
              propertyId={property.id}
              agencyId={agency?.id || ""}
              whatsappPhone={whatsappPhone}
              contactPhone={contactPhone}
              propertyTitle={property.title}
              agencyName={agency?.agency_name || undefined}
            />
          </div>
          <div className="w-12">
            <FavoriteButton
              propertyId={property.id}
              label="Save property"
              className="h-12 w-12"
            />
          </div>
          <div className="w-12">
            <ScheduleVisitButton
              propertyId={property.id}
              agencyId={agency?.id || ""}
              propertyTitle={property.title}
            />
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}