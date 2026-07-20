"use client";

import { useState, useMemo } from "react";
import type { Property } from "./types";
import PropertyCard from "./PropertyCard";

const popularSectors = [
  "All Sectors",
  "Sector 18",
  "Sector 44",
  "Sector 50",
  "Sector 62",
  "Sector 70",
  "Sector 78",
  "Sector 93",
  "Sector 137",
  "Sector 150",
  "Greater Noida West",
  "Noida Extension",
];

const getRentRange = (properties: Property[]) => {
  const rents = properties
    .map((p) => Number(p.rent))
    .filter((r) => !isNaN(r) && r > 0);
  if (rents.length === 0) return { min: 5000, max: 50000 };
  return {
    min: Math.floor(Math.min(...rents) / 1000) * 1000,
    max: Math.ceil(Math.max(...rents) / 1000) * 1000,
  };
};

const formatRent = (value: number) => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
};

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
  const [sector, setSector] = useState("all");
  const [rentMin, setRentMin] = useState(0);
  const [rentMax, setRentMax] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState("recommended");

  const { min: dataMin, max: dataMax } = useMemo(() => getRentRange(properties), [properties]);
  const initializedRentMin = useMemo(() => rentMin || dataMin, [rentMin, dataMin]);
  const initializedRentMax = useMemo(() => rentMax || dataMax, [rentMax, dataMax]);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const q = search.toLowerCase();
      const textMatch = !q
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

      const sectorMatch =
        sector === "all" || property.location === sector;

      const rentMatch =
        (initializedRentMin === 0 || Number(property.rent ?? 0) >= initializedRentMin) &&
        (initializedRentMax === 0 || Number(property.rent ?? 0) <= initializedRentMax);

      return textMatch && typeMatch && bedroomMatch && furnishingMatch && parkingMatch && sectorMatch && rentMatch;
    });
  }, [properties, search, propertyType, bedrooms, furnishing, parking, sector, initializedRentMin, initializedRentMax]);

  const displayedProperties = useMemo(() => {
    return [...filteredProperties].sort((a, b) => {
      if (sort === "rent-low") return Number(a.rent ?? 0) - Number(b.rent ?? 0);
      if (sort === "rent-high") return Number(b.rent ?? 0) - Number(a.rent ?? 0);
      if (sort === "newest") return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      if (sort === "popular") return Number(b.views_count ?? 0) - Number(a.views_count ?? 0);
      return 0;
    });
  }, [filteredProperties, sort]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (propertyType !== "all") count++;
    if (bedrooms !== "all") count++;
    if (furnishing !== "all") count++;
    if (parking !== "all") count++;
    if (sector !== "all") count++;
    if (rentMin !== 0 && initializedRentMin > dataMin) count++;
    if (rentMax !== 0 && initializedRentMax < dataMax) count++;
    return count;
  }, [propertyType, bedrooms, furnishing, parking, sector, rentMin, rentMax, initializedRentMin, initializedRentMax, dataMin, dataMax]);

  const resetFilters = () => {
    setSearch("");
    setPropertyType("all");
    setBedrooms("all");
    setFurnishing("all");
    setParking("all");
    setSector("all");
    setRentMin(0);
    setRentMax(0);
    setSort("recommended");
  };

  const handleRentMinChange = (value: number) => {
    setRentMin(Math.min(value, initializedRentMax - 1000));
  };

  const handleRentMaxChange = (value: number) => {
    setRentMax(Math.max(value, initializedRentMin + 1000));
  };

  const renderContent = () => {
    if (showSkeleton) {
      return (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-white">
              <div className="skeleton h-56 w-full" />
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
      );
    }

    if (displayedProperties.length === 0) {
      return (
        <div className="rounded-3xl border border-dashed border-[var(--brand-border)] bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[var(--brand-background)] text-3xl">
            🏠
          </div>
          <h2 className="text-2xl font-bold text-[var(--brand-text)]">
            No properties found
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--brand-muted)]">
            Try changing a filter or searching a different city or locality.
          </p>
          <button onClick={resetFilters} className="btn-secondary mt-6">
            Reset filters
          </button>
        </div>
      );
    }

    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {displayedProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-muted)]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="search"
              aria-label="Search properties"
              placeholder="Search city, area or property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full rounded-xl border border-[var(--brand-border)] bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition sm:flex-none ${filtersOpen || activeFilterCount > 0 ? "border-orange-200 bg-orange-50 text-[var(--brand-primary)]" : "border-[var(--brand-border)] text-[var(--brand-text)]"}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 6h16M7 12h10M10 18h4"/></svg>
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>

            <label className="relative inline-flex h-12 flex-1 items-center rounded-xl border border-[var(--brand-border)] bg-white sm:flex-none min-w-[180px]">
              <svg className="pointer-events-none absolute left-3" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M3 6h18M6 12h12M10 18h4"/></svg>
              <span className="sr-only">Sort properties</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-full w-full appearance-none bg-transparent pl-9 pr-8 text-sm font-semibold text-[var(--brand-text)] outline-none">
                <option value="recommended">Recommended</option>
                <option value="rent-low">Rent: Low to High</option>
                <option value="rent-high">Rent: High to Low</option>
                <option value="newest">Newest First</option>
                <option value="popular">Most Viewed</option>
              </select>
              <svg className="pointer-events-none absolute right-3" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m6 9 6 6 6-6"/></svg>
            </label>
          </div>
        </div>

        {filtersOpen && (
          <div className="mt-4 animate-fade-in">
            <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="label text-xs uppercase tracking-wider text-[var(--brand-muted)]">
                    Monthly Rent
                  </label>
                  <span className="text-sm font-bold text-[var(--brand-primary)]">
                    {formatRent(initializedRentMin)} - {formatRent(initializedRentMax)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={dataMin}
                    max={dataMax}
                    step={1000}
                    value={initializedRentMin}
                    onChange={(e) => handleRentMinChange(Number(e.target.value))}
                    className="flex-1 h-2 appearance-none bg-[var(--brand-border)] rounded-full accent-[var(--brand-primary)]"
                    aria-label="Minimum rent"
                  />
                  <input
                    type="range"
                    min={dataMin}
                    max={dataMax}
                    step={1000}
                    value={initializedRentMax}
                    onChange={(e) => handleRentMaxChange(Number(e.target.value))}
                    className="flex-1 h-2 appearance-none bg-[var(--brand-border)] rounded-full accent-[var(--brand-primary)]"
                    aria-label="Maximum rent"
                  />
                </div>
                <div className="flex justify-between text-xs text-[var(--brand-muted)] mt-1">
                  <span>{formatRent(dataMin)}</span>
                  <span>{formatRent(dataMax)}</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
                    <option value="all">All BHK</option>
                    <option value="1">1 BHK</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4">4+ BHK</option>
                  </select>
                </div>

                <div>
                  <label className="label text-xs uppercase tracking-wider text-[var(--brand-muted)]">
                    Sector / Area
                  </label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="select"
                  >
                    {popularSectors.map((s) => (
                      <option key={s} value={s === "All Sectors" ? "all" : s}>
                        {s}
                      </option>
                    ))}
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
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--brand-border)]">
                <button type="button" onClick={resetFilters} className="text-sm font-bold text-[var(--brand-primary)] hover:underline">
                  Clear all filters
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="mt-3 px-1 text-xs font-medium text-[var(--brand-muted)]">
          <span className="font-bold text-[var(--brand-text)]">{displayedProperties.length}</span> propert{displayedProperties.length === 1 ? "y" : "ies"} found
        </p>
      </div>

      {renderContent()}
    </div>
  );
}