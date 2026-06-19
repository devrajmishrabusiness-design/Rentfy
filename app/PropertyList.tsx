"use client";

import { useState } from "react";
import Link from "next/link";

export default function PropertyList({
  properties,
}: {
  properties: any[];
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
      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid md:grid-cols-5 gap-4">

          <input
            type="text"
            placeholder="Search City"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />

          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full p-3 border rounded-lg"
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
            className="w-full p-3 border rounded-lg"
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
            className="w-full p-3 border rounded-lg"
          >
            <option value="all">Any Furnishing</option>
            <option value="Unfurnished">Unfurnished</option>
            <option value="Semi Furnished">Semi Furnished</option>
            <option value="Fully Furnished">Fully Furnished</option>
          </select>

          <select
            value={parking}
            onChange={(e) => setParking(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            <option value="all">Parking Any</option>
            <option value="true">Parking Available</option>
            <option value="false">No Parking</option>
          </select>

        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <div
            key={property.id}
            className="bg-white rounded-xl shadow hover:shadow-lg transition p-4"
          >
            <img
              src={property.image_url}
              alt={property.title}
              className="w-full h-48 object-cover rounded-lg"
            />

            <h2 className="text-xl font-semibold mt-4">
              {property.title}
            </h2>

            <p className="text-gray-600 mt-2 line-clamp-2">
              {property.description}
            </p>

            <div className="mt-3">
              <p className="text-2xl font-bold text-green-600">
                ₹{property.rent}/month
              </p>

              <p className="text-gray-500 font-medium">
                📍 {property.location}, {property.city}
              </p>

              <p>🏠 {property.property_type}</p>
              <p>🛏️ {property.bedrooms} Bedrooms</p>
              <p>🚿 {property.bathrooms} Bathrooms</p>

              {property.furnishing && (
                <p>🛋️ {property.furnishing}</p>
              )}

              <p>
                🚗 {property.parking ? "Parking Available" : "No Parking"}
              </p>
            </div>

            <Link
              href={`/property/${property.id}`}
              className="block mt-4 w-full bg-blue-600 text-white py-2 rounded-lg text-center"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center mt-10">
          <h2 className="text-2xl font-semibold">
            No properties found
          </h2>
        </div>
      )}
    </>
  );
}