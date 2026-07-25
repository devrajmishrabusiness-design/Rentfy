"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Property } from "../types";

interface SavedPropertiesListProps {
  properties: Property[];
  loading: boolean;
  error: string | null;
  onRemove: (propertyId: string) => void;
  onRefresh: () => void;
}

export default function SavedPropertiesList({
  properties,
  loading,
  error,
  onRemove,
  onRefresh,
}: SavedPropertiesListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => onRefresh(), 5000);
    return () => clearTimeout(timer);
  }, [error, onRefresh]);

  const handleRemove = async (propertyId: string) => {
    setRemovingId(propertyId);
    await onRemove(propertyId);
    setRemovingId(null);
  };

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="card h-80 rounded-3xl">
            <div className="skeleton h-48 w-full rounded-t-3xl" />
            <div className="space-y-3 p-5">
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
              <div className="skeleton h-6 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
        <p className="text-sm font-semibold text-rose-700">{error}</p>
        <button type="button" onClick={onRefresh} className="btn-primary mt-4">Try Again</button>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--brand-border)] bg-white px-6 py-14 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-2xl text-[var(--brand-primary)]">♡</div>
        <h3 className="mt-4 text-xl font-extrabold text-[var(--brand-text)]">No saved properties yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--brand-muted)]">Tap the heart on any listing to keep it here for later.</p>
        <Link href="/rent" className="btn-primary mt-5">Browse properties</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <div key={property.id} className="card overflow-hidden">
          <Link href={`/property/${property.id}`}>
            <div className="relative h-48 w-full bg-stone-100">
              {property.image_url ? (
                <img src={property.image_url} alt={property.title || "Property"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl text-stone-300">🏠</div>
              )}
            </div>
          </Link>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/property/${property.id}`} className="min-w-0 flex-1">
                <h3 className="truncate text-base font-extrabold text-[var(--brand-text)]">{property.title || "Property"}</h3>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">{property.location || property.city || "—"}</p>
              </Link>
              {property.rent != null && (
                <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-[var(--brand-primary)]">
                  ₹{property.rent.toLocaleString()}
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="text-xs text-[var(--brand-muted)]">
                {property.bedrooms != null && `${property.bedrooms} bed`}
                {property.bedrooms != null && property.bathrooms != null && " · "}
                {property.bathrooms != null && `${property.bathrooms} bath`}
                {!property.bedrooms && !property.bathrooms && "—"}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleRemove(property.id)}
                  disabled={removingId === property.id}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-wait"
                >
                  {removingId === property.id ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
