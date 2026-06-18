"use client";

import { useState } from "react";
import Link from "next/link";

export default function PropertyList({
  properties,
}: {
  properties: any[];
}) {
  const [search, setSearch] = useState("");

  const filteredProperties = properties.filter((property) =>
    property.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="max-w-md mx-auto mb-8">
        <input
          type="text"
          placeholder="Search by city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <div
            key={property.id}
            className="bg-white rounded-xl shadow p-4"
          >
            <img
              src={property.image_url}
              alt={property.title}
              className="w-full h-48 object-cover rounded-lg"
            />

            <h2 className="text-xl font-semibold mt-4">
              {property.title}
            </h2>

            <p className="text-gray-600 mt-2">
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
            </div>

            <Link
              href={`/property/${property.id}`}
              className="block mt-4 w-full bg-blue-600 text-white py-2 rounded-lg text-center"
            >
              View Details
            </Link>

            <a
              href="https://wa.me/919084061619"
              target="_blank"
              className="block mt-2 w-full bg-green-600 text-white py-2 rounded-lg text-center"
            >
              WhatsApp Agency
            </a>
          </div>
        ))}
      </div>
    </>
  );
}