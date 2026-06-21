"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Property } from "./types";

export default function PropertyList({
  properties,
}: {
  properties: Property[];
}) {
  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [bedrooms, setBedrooms] = useState("all");
  const [furnishing, setFurnishing] = useState("all");
  const [parking, setParking] = useState("all");

  const filteredProperties = properties.filter((property) => {
    const cityMatch = property.city
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const typeMatch =
      propertyType === "all" ||
      property.property_type?.toLowerCase() ===
        propertyType.toLowerCase();

    const bedroomMatch =
      bedrooms === "all" ||
      String(property.bedrooms) === bedrooms;

    const furnishingMatch =
      furnishing === "all" ||
      property.furnishing === furnishing;

    const parkingMatch =
      parking === "all" ||
      String(property.parking) === parking;

    return (
      cityMatch &&
      typeMatch &&
      bedroomMatch &&
      furnishingMatch &&
      parkingMatch
    );
  });

  return (
    <>
      <div className="mb-8 rounded border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <input
            type="text"
            placeholder="Search City"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          />

          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full rounded border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          >
            <option value="all">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="flat">Flat</option>
            <option value="villa">Villa</option>
            <option value="house">House</option>
          </select>

          <select
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="w-full rounded border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          >
            <option value="all">All Bedrooms</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4+ BHK</option>
          </select>

          <select
            value={furnishing}
            onChange={(e) => setFurnishing(e.target.value)}
            className="w-full rounded border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          >
            <option value="all">Any Furnishing</option>
            <option value="Unfurnished">Unfurnished</option>
            <option value="Semi Furnished">Semi Furnished</option>
            <option value="Fully Furnished">Fully Furnished</option>
          </select>

          <select
            value={parking}
            onChange={(e) => setParking(e.target.value)}
            className="w-full rounded border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          >
            <option value="all">Parking Any</option>
            <option value="true">Parking Available</option>
            <option value="false">No Parking</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {filteredProperties.map((property) => (
          <div
            key={property.id}
            className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            {property.image_url ? (
              <Image
                src={property.image_url}
                alt={property.title || "Rental property"}
                width={640}
                height={416}
                unoptimized
                className="h-52 w-full object-cover"
              />
            ) : (
              <div className="grid h-52 w-full place-items-center bg-slate-100 text-sm font-medium text-slate-500">
                No image available
              </div>
            )}

            <div className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-950">
                  {property.title}
                </h2>
                <span className="shrink-0 rounded bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  Verified
                </span>
              </div>

              <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                {property.description}
              </p>

              <div className="mt-4">
                <p className="text-2xl font-bold text-slate-950">
                  Rs. {property.rent}/month
                </p>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {property.location}, {property.city}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600">
                <p className="rounded bg-slate-50 px-3 py-2">
                  {property.property_type}
                </p>
                <p className="rounded bg-slate-50 px-3 py-2">
                  {property.bedrooms} Bedrooms
                </p>
                <p className="rounded bg-slate-50 px-3 py-2">
                  {property.bathrooms} Bathrooms
                </p>
                <p className="rounded bg-slate-50 px-3 py-2">
                  {property.parking ? "Parking" : "No parking"}
                </p>
              </div>

              {property.furnishing && (
                <p className="mt-3 text-sm font-medium text-slate-600">
                  {property.furnishing}
                </p>
              )}

              <Link
                href={`/property/${property.id}`}
                className="mt-5 block w-full rounded bg-slate-950 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="mt-10 rounded border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <h2 className="text-2xl font-semibold text-slate-950">
            No properties found
          </h2>
          <p className="mt-2 text-slate-500">
            Try changing a filter or searching a nearby city.
          </p>
        </div>
      )}
    </>
  );
}
