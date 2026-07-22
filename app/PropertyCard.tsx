"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { memo, type ReactNode } from "react";
import type { Property } from "./types";
import FavoriteButton from "./renter/FavoriteButton";

export default memo(function PropertyCard({
  property,
  actions,
  showVerifiedBadge = true,
}: {
  property: Property;
  actions?: ReactNode;
  showVerifiedBadge?: boolean;
}) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/property/${property.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  // Format availability date
  const formatAvailability = (date?: string | null) => {
    if (!date) return "Available now";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Available now";
    const today = new Date();
    const daysDiff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 0) return "Available now";
    if (daysDiff <= 7) return `In ${daysDiff} day${daysDiff > 1 ? "s" : ""}`;
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  };

  // Calculate rent per sqft
  const rentPerSqft =
    property.rent && property.area_sqft && property.area_sqft > 0
      ? Math.round(property.rent / property.area_sqft)
      : null;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      aria-label={`View ${property.title || "property"}`}
      className="card-hover group relative flex h-full cursor-pointer flex-col overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
    >
      {/* Image Section - Now larger (60% aspect ratio for mobile impact) */}
      <div className="relative w-full overflow-hidden bg-[var(--brand-background)] sm:aspect-[16/10] aspect-[4/3]">
        {property.image_url ? (
          <Image
            src={property.image_url}
            alt={property.title || "Rental property"}
            width={640}
            height={416}
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-stone-50 to-orange-50 text-sm font-medium text-[var(--brand-muted)]">
            <div className="flex flex-col items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-300">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="15" x2="15.01" y2="15"/>
                <path d="M9 15l3-3 2 2 2-2"/>
              </svg>
              No image available
            </div>
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {showVerifiedBadge && (
            <span className="badge-success bg-white/95 backdrop-blur-sm shadow-sm">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Verified
            </span>
          )}
          {property.property_type && (
            <span className="badge-muted bg-white/95 backdrop-blur-sm shadow-sm">
              {property.property_type}
            </span>
          )}
        </div>

        {/* Availability Badge - New! */}
        <div className="absolute right-3 bottom-3">
          <span className="badge-info bg-white/95 backdrop-blur-sm shadow-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formatAvailability(property.available_from)}
          </span>
        </div>

        {!actions && (
          <div className="absolute right-3 top-3" onClick={(e) => e.stopPropagation()}>
            <FavoriteButton
              propertyId={property.id}
              label={`Save ${property.title || "property"}`}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[var(--brand-text)] shadow-md transition hover:text-rose-500 disabled:opacity-60"
            />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Title & Location */}
        <h2 className="line-clamp-1 text-base sm:text-lg font-bold text-[var(--brand-text)] transition-colors group-hover:text-[var(--brand-primary)]">
          {property.title || "Untitled property"}
        </h2>

        <p className="mt-1 flex items-center gap-1 text-xs sm:text-sm font-medium text-[var(--brand-muted)]">
          <svg
            width="14"
            height="14"
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
          <span className="truncate">
            {property.location}
            {property.city ? `, ${property.city}` : ""}
          </span>
        </p>

        {/* Dynamic Rent & Area Display */}
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <p className="text-xl sm:text-2xl font-extrabold text-[var(--brand-text)]">
            ₹{(Number(property.rent) || 0).toLocaleString("en-IN")}
            <span className="text-xs sm:text-sm font-medium text-[var(--brand-muted)]">
              /month
            </span>
          </p>
          {rentPerSqft && (
            <span className="badge-muted text-[10px]">
              ₹{rentPerSqft}/sqft
            </span>
          )}
        </div>

        {/* Specs & Amenities */}
        <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2 text-xs font-semibold">
          {property.bedrooms != null && (
            <span className="rounded-full bg-[var(--brand-background)] px-2.5 py-1 text-[var(--brand-text)]">
              {property.bedrooms} BHK
            </span>
          )}
          {property.bathrooms != null && (
            <span className="rounded-full bg-[var(--brand-background)] px-2.5 py-1 text-[var(--brand-text)]">
              {property.bathrooms} Bath
            </span>
          )}
          {property.area_sqft && (
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[var(--brand-primary)]">
              {property.area_sqft} sqft
            </span>
          )}
          {property.furnishing && (
            <span className="rounded-full bg-[var(--brand-background)] px-2.5 py-1 text-[var(--brand-text)] hidden sm:inline-flex">
              {property.furnishing}
            </span>
          )}
          {property.parking && (
            <span className="rounded-full bg-[var(--brand-background)] px-2.5 py-1 text-[var(--brand-text)] hidden sm:inline-flex">
              Parking
            </span>
          )}
        </div>

        {/* Mobile-optimized CTA */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <Link
            href={`/property/${property.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-sm font-bold text-[var(--brand-primary)] transition group-hover:gap-2"
          >
            View details
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              aria-hidden="true"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Link>

          {actions && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2"
            >
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
