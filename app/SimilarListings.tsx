"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Property } from "./types";
import FavoriteButton from "./renter/FavoriteButton";

interface SimilarListingsProps {
  currentPropertyId: string;
  currentPropertyCity?: string | null;
  currentPropertyType?: string | null;
  currentPropertyBedrooms?: number | null;
  currentPropertyRent?: number | null;
}

export default function SimilarListings({
  currentPropertyId,
  currentPropertyCity,
  currentPropertyType,
  currentPropertyBedrooms,
  currentPropertyRent,
}: SimilarListingsProps) {
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        const params = new URLSearchParams();
        params.set("exclude", currentPropertyId);
        params.set("limit", "4");
        if (currentPropertyCity) params.set("city", currentPropertyCity);
        if (currentPropertyType) params.set("type", currentPropertyType);
        if (currentPropertyBedrooms) params.set("bedrooms", String(currentPropertyBedrooms));
        if (currentPropertyRent) {
          params.set("rentMin", String(Math.max(0, currentPropertyRent - 5000)));
          params.set("rentMax", String(currentPropertyRent + 5000));
        }

        const response = await fetch(`/api/properties/similar?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch similar properties");
        const data = await response.json();
        setSimilarProperties(data.properties || []);
      } catch {
        setError("Could not load similar listings");
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [currentPropertyId, currentPropertyCity, currentPropertyType, currentPropertyBedrooms, currentPropertyRent]);

  if (loading) {
    return (
      <section className="space-y-6" aria-labelledby="similar-heading">
        <div className="flex items-center justify-between">
          <h2 id="similar-heading" className="text-xl font-bold text-[var(--brand-text)]">
            Similar Properties
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-white">
              <div className="skeleton h-40 w-full" />
              <div className="space-y-3 p-4">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-5 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || similarProperties.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6" aria-labelledby="similar-heading">
      <div className="flex items-center justify-between">
        <h2 id="similar-heading" className="text-xl font-bold text-[var(--brand-text)]">
          Similar Properties
        </h2>
        <Link
          href={`/rent/${currentPropertyCity?.toLowerCase().replace(/\s+/g, "-") || "noida"}`}
          className="text-sm font-semibold text-[var(--brand-primary)] hover:underline"
        >
          View all →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {similarProperties.map((property) => (
          <Link
            key={property.id}
            href={`/property/${property.id}`}
            className="card-hover group flex flex-col overflow-hidden"
            aria-label={`View ${property.title || "property"}`}
          >
            <div className="relative h-40 w-full overflow-hidden bg-[var(--brand-background)]">
              {property.image_url ? (
                <Image
                  src={property.image_url}
                  alt={property.title || "Rental property"}
                  width={400}
                  height={256}
                  unoptimized
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-stone-50 to-orange-50 text-xs font-medium text-[var(--brand-muted)]">
                  No image
                </div>
              )}

              <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                <span className="badge-success bg-white/95 backdrop-blur-sm shadow-sm text-[10px]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Verified
                </span>
                {property.property_type && (
                  <span className="badge-muted bg-white/95 backdrop-blur-sm shadow-sm text-[10px]">
                    {property.property_type}
                  </span>
                )}
              </div>

              <div className="absolute right-2 top-2" onClick={(e) => e.stopPropagation()}>
                <FavoriteButton
                  propertyId={property.id}
                  label={`Save ${property.title || "property"}`}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/95 text-[var(--brand-text)] shadow-md transition hover:text-rose-500"
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <h3 className="line-clamp-1 text-sm font-bold text-[var(--brand-text)] transition-colors group-hover:text-[var(--brand-primary)]">
                {property.title || "Untitled property"}
              </h3>

              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-[var(--brand-muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="truncate">{property.location}{property.city ? `, ${property.city}` : ""}</span>
              </p>

              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-lg font-extrabold text-[var(--brand-text)]">
                  ₹{Number(property.rent || 0).toLocaleString("en-IN")}
                  <span className="text-xs font-medium text-[var(--brand-muted)]">/mo</span>
                </p>
                {property.area_sqft && (
                  <span className="badge-muted text-[9px]">
                    {property.area_sqft} sqft
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                {property.bedrooms != null && (
                  <span className="rounded-full bg-[var(--brand-background)] px-2 py-0.5 text-[var(--brand-text)]">
                    {property.bedrooms} BHK
                  </span>
                )}
                {property.furnishing && (
                  <span className="rounded-full bg-[var(--brand-background)] px-2 py-0.5 text-[var(--brand-text)]">
                    {property.furnishing}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}