"use client";

import { useState } from "react";
import type { Property } from "./types";
import PropertyCard from "./PropertyCard";

export default function PropertyList({
  properties,
  showSkeleton = false,
}: {
  properties: Property[];
  showSkeleton?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [bedrooms, setBedrooms] = useState("all");
  const [furnishing, setFurnishing] = useState("all");
  const [parking, setParking] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState("recommended");

  const filteredProperties = properties.filter((property) => {
    const q = search.toLowerCase();
    const cityMatch = !q
      ? true
      : property.city?.toLowerCase().includes(q) ||
        property.location?.toLowerCase().includes(q) ||
        property.title?.toLowerCase().includes(q);

    const typeMatch =
      propertyType === "all" ||
      property.property_type?.toLowerCase() === propertyType.toLowerCase();

    const bedroomMatch =
      bedrooms === "all" ||
      (bedrooms === "4"
        ? Number(property.bedrooms) >= 4
        : String(property.bedrooms) === bedrooms);

    const furnishingMatch =
      furnishing === "all" || property.furnishing === furnishing;

    const parkingMatch =
      parking === "all" || String(property.parking) === parking;

    return (
      cityMatch && typeMatch && bedroomMatch && furnishingMatch && parkingMatch
    );
  });

  const displayedProperties = [...filteredProperties].sort((a, b) => {
    if (sort === "rent-low") return Number(a.rent ?? 0) - Number(b.rent ?? 0);
    if (sort === "rent-high") return Number(b.rent ?? 0) - Number(a.rent ?? 0);
    return 0;
  });

  const activeFilterCount = [propertyType, bedrooms, furnishing, parking].filter(
    (value) => value !== "all"
  ).length;

  const resetFilters = () => {
    setSearch("");
    setPropertyType("all");
    setBedrooms("all");
    setFurnishing("all");
    setParking("all");
    setSort("recommended");
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-muted)]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              aria-label="Search properties"
              placeholder="Search city, area or property"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--brand-border)] bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition sm:flex-none ${filtersOpen || activeFilterCount ? "border-orange-200 bg-orange-50 text-[var(--brand-primary)]" : "border-[var(--brand-border)] text-[var(--brand-text)]"}`}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 6h16M7 12h10M10 18h4"/></svg>
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>

            <label className="relative inline-flex h-11 flex-1 items-center rounded-xl border border-[var(--brand-border)] bg-white sm:flex-none">
              <svg className="pointer-events-none absolute left-3" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M3 6h18M6 12h12M10 18h4"/></svg>
              <span className="sr-only">Sort properties</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-full w-full appearance-none bg-transparent pl-9 pr-8 text-sm font-semibold text-[var(--brand-text)] outline-none">
                <option value="recommended">Recommended</option>
                <option value="rent-low">Rent: low to high</option>
                <option value="rent-high">Rent: high to low</option>
              </select>
              <svg className="pointer-events-none absolute right-3" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m6 9 6 6 6-6"/></svg>
            </label>
          </div>
        </div>

        {filtersOpen && (
          <div className="mt-3 grid gap-3 border-t border-[var(--brand-border)] pt-3 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">

          <div>
            <label className="label text-xs uppercase tracking-wider text-[var(--brand-muted)]">
              Type
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="select"
            >
              <option value="all">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="flat">Flat</option>
              <option value="villa">Villa</option>
              <option value="house">House</option>
            </select>
          </div>

          <div>
            <label className="label text-xs uppercase tracking-wider text-[var(--brand-muted)]">
              Bedrooms
            </label>
            <select
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="select"
            >
              <option value="all">All Bedrooms</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4+ BHK</option>
            </select>
          </div>

          <div>
            <label className="label text-xs uppercase tracking-wider text-[var(--brand-muted)]">
              Furnishing
            </label>
            <select
              value={furnishing}
              onChange={(e) => setFurnishing(e.target.value)}
              className="select"
            >
              <option value="all">Any Furnishing</option>
              <option value="Unfurnished">Unfurnished</option>
              <option value="Semi Furnished">Semi Furnished</option>
              <option value="Fully Furnished">Fully Furnished</option>
            </select>
          </div>

          <div>
            <label className="label text-xs uppercase tracking-wider text-[var(--brand-muted)]">
              Parking
            </label>
            <select
              value={parking}
              onChange={(e) => setParking(e.target.value)}
              className="select"
            >
              <option value="all">Parking Any</option>
              <option value="true">Available</option>
              <option value="false">Not Available</option>
            </select>
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <button type="button" onClick={resetFilters} className="text-sm font-bold text-[var(--brand-primary)] hover:underline">
              Clear all filters
            </button>
          </div>
        </div>
        )}

        <p className="mt-2 px-1 text-xs font-medium text-[var(--brand-muted)]">
          <span className="font-bold text-[var(--brand-text)]">{displayedProperties.length}</span> properties found
        </p>
      </div>

      {showSkeleton ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-white"
            >
              <div className="skeleton h-52 w-full" />
              <div className="space-y-3 p-5">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-6 w-2/3 rounded" />
                <div className="flex gap-2">
                  <div className="skeleton h-6 w-16 rounded-full" />
                  <div className="skeleton h-6 w-16 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayedProperties.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--brand-border)] bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-background)] text-2xl">
            🏠
          </div>
          <h2 className="text-2xl font-bold text-[var(--brand-text)]">
            No properties found
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--brand-muted)]">
            Try changing a filter or searching a different city or locality.
          </p>
          <button
            onClick={resetFilters}
            className="btn-secondary mt-6"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {displayedProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
