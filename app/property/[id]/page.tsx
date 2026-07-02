import ImageGallery from "@/app/ImageGallery";
import { supabase } from "@/lib/supabase";
import ContactAgencyButton from "@/app/ContactAgencyButton";
import Footer from "@/app/Footer";
import StatusBadge from "@/app/StatusBadge";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .single();

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

const amenityItems = [
  { key: "parking", icon: "🚗", label: "Parking" },
  { key: "furnishing", icon: "🛋️", label: "Furnished" },
  { key: "available_from", icon: "📅", label: "Available" },
];

export const revalidate = 60;

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .single();

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

  const { data: agency } = await supabase
    .from("agencies")
    .select("*")
    .eq("id", property.agency_id)
    .single();

  const { data: images } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", property.id);

  const imageUrls = images?.map((img) => img.image_url) || [];

  const whatsappPhone = agency?.phone || "9084061619";
  const contactPhone = agency?.phone || "9084061619";

  const highlights = [
    { label: "Type", value: property.property_type, icon: "🏠" },
    { label: "Bedrooms", value: property.bedrooms, icon: "🛏️" },
    { label: "Bathrooms", value: property.bathrooms, icon: "🚿" },
    {
      label: "Furnishing",
      value: property.furnishing,
      icon: "🛋️",
    },
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
  ];

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <div className="container-app py-10">
        <ImageGallery images={imageUrls} title={property.title} />

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main */}
          <div className="space-y-8">
            <div className="card p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <StatusBadge status="approved" />
                    {property.property_type && (
                      <span className="badge-muted">
                        {highlightIcons[property.property_type] || "🏠"}{" "}
                        {property.property_type}
                      </span>
                    )}
                    {property.furnishing && (
                      <span className="badge-muted">{property.furnishing}</span>
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
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {property.location}, {property.city}
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
                {highlights.map((h) => (
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
                      {h.value || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="card p-7">
              <h2 className="text-lg font-bold text-[var(--brand-text)]">
                Amenities
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {amenityItems.map((a) => {
                  const active =
                    a.key === "parking"
                      ? !!property.parking
                      : a.key === "furnishing"
                      ? !!property.furnishing
                      : !!property.available_from;

                  return (
                    <div
                      key={a.key}
                      className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
                        active
                          ? "border-orange-200 bg-orange-50 text-[var(--brand-primary)]"
                          : "border-[var(--brand-border)] bg-stone-50 opacity-60"
                      }`}
                    >
                      <span className="text-xl" aria-hidden>
                        {a.icon}
                      </span>
                      <span className="text-sm font-bold text-current">
                        {a.label}
                      </span>
                      {active && (
                        <span className="ml-auto text-emerald-600">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
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
                </div>
              </div>
            </div>
          </div>

          {/* Sticky contact card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <div className="rounded-2xl bg-gradient-to-br from-stone-50 to-orange-50 p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                  Rental price
                </p>
                <p className="mt-1 text-3xl font-extrabold text-[var(--brand-text)]">
                  ₹{Number(property.rent).toLocaleString("en-IN")}
                  <span className="text-sm font-medium text-[var(--brand-muted)]">
                    /mo
                  </span>
                </p>
              </div>

              <div className="mt-5">
                <ContactAgencyButton
                  propertyId={property.id}
                  agencyId={agency?.id || ""}
                  whatsappPhone={whatsappPhone}
                  contactPhone={contactPhone}
                  propertyTitle={property.title}
                  agencyName={agency?.agency_name || undefined}
                />
              </div>

              <div className="mt-5 space-y-2 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-[var(--brand-muted)]">Type</span>
                  <span className="font-bold">{property.property_type}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-[var(--brand-muted)]">Bedrooms</span>
                  <span className="font-bold">{property.bedrooms}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-[var(--brand-muted)]">Bathrooms</span>
                  <span className="font-bold">{property.bathrooms}</span>
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

      <Footer />
    </main>
  );
}