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
      bedrooms === "all" || String(property.bedrooms) === bedrooms;

    const furnishingMatch =
      furnishing === "all" || property.furnishing === furnishing;

    const parkingMatch =
      parking === "all" || String(property.parking) === parking;

    return (
      cityMatch && typeMatch && bedroomMatch && furnishingMatch && parkingMatch
    );
  });

  return (
    <div className="space-y-8">
      <div className="sticky top-[72px] z-30 -mx-4 rounded-none border-y border-[var(--brand-border)] bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:mx-0 sm:rounded-3xl sm:border sm:px-5 sm:shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-1">
            <label className="label text-xs uppercase tracking-wider text-[var(--brand-muted)]">
              Search
            </label>
            <input
              type="text"
              placeholder="City, area or title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />
          </div>

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
        </div>

        <p className="mt-3 text-xs font-medium text-[var(--brand-muted)]">
          Showing <span className="font-bold text-[var(--brand-text)]">{filteredProperties.length}</span> of {properties.length} properties
        </p>
      </div>

      {showSkeleton ? (
        <div className="grid gap-6 md:grid-cols-3">
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
      ) : filteredProperties.length === 0 ? (
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
            onClick={() => {
              setSearch("");
              setPropertyType("all");
              setBedrooms("all");
              setFurnishing("all");
              setParking("all");
            }}
            className="btn-secondary mt-6"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}