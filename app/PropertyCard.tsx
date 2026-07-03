"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { Property } from "./types";
import FavoriteButton from "./renter/FavoriteButton";

export default function PropertyCard({
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

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      aria-label={`View ${property.title || "property"}`}
      className="card-hover group relative flex h-full cursor-pointer flex-col overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
    >
      <div className="relative h-52 w-full overflow-hidden bg-[var(--brand-background)]">
        {property.image_url ? (
          <Image
            src={property.image_url}
            alt={property.title || "Rental property"}
            width={640}
            height={416}
            unoptimized
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-stone-50 to-orange-50 text-sm font-medium text-[var(--brand-muted)]">
            No image available
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {showVerifiedBadge && (
            <span className="badge-success backdrop-blur">
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
            <span className="badge-muted bg-white/90 backdrop-blur">
              {property.property_type}
            </span>
          )}
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

      <div className="flex flex-1 flex-col p-5">
        <h2 className="line-clamp-1 text-lg font-bold text-[var(--brand-text)] transition-colors group-hover:text-[var(--brand-primary)]">
          {property.title || "Untitled property"}
        </h2>

        <p className="mt-1 flex items-center gap-1 text-sm font-medium text-[var(--brand-muted)]">
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

        <p className="mt-2 text-2xl font-extrabold text-[var(--brand-text)]">
          ₹{(Number(property.rent) || 0).toLocaleString("en-IN")}
          <span className="text-sm font-medium text-[var(--brand-muted)]">
            /month
          </span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          {property.bedrooms != null && (
            <span className="rounded-full bg-[var(--brand-background)] px-3 py-1 text-[var(--brand-text)]">
              {property.bedrooms} BHK
            </span>
          )}
          {property.bathrooms != null && (
            <span className="rounded-full bg-[var(--brand-background)] px-3 py-1 text-[var(--brand-text)]">
              {property.bathrooms} Bath
            </span>
          )}
          {property.furnishing && (
            <span className="rounded-full bg-[var(--brand-background)] px-3 py-1 text-[var(--brand-text)]">
              {property.furnishing}
            </span>
          )}
          {property.parking && (
            <span className="rounded-full bg-[var(--brand-background)] px-3 py-1 text-[var(--brand-text)]">
              Parking
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <Link
            href={`/property/${property.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-sm font-bold text-[var(--brand-primary)] transition group-hover:gap-2"
          >
            View details
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
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
}
