import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flats & Apartments for Rent in Noida | Rentfy",
  description:
    "Browse verified rental flats, apartments, houses and villas in Noida.",
};

export default async function NoidaRentPage() {
  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "approved")
    .ilike("city", "noida");

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold mb-4">
        Flats & Apartments for Rent in Noida
      </h1>

      <p className="text-gray-600 mb-8">
        Browse verified rental properties in Noida.
      </p>
       
      <div className="mb-10">
  <h2 className="text-2xl font-semibold mb-4">
    Popular Areas in Noida
  </h2>

  <div className="flex flex-wrap gap-3">
    <Link
      href="/rent/noida/sector-5"
      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg"
    >
      Sector 5
    </Link>

    <Link
      href="/rent/noida/sector-51"
      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg"
    >
      Sector 51
    </Link>

    <Link
      href="/rent/noida/sector-62"
      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg"
    >
      Sector 62
    </Link>

    <Link
      href="/rent/noida/sector-70"
      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg"
    >
      Sector 70
    </Link>
  </div>
</div>

      <div className="grid md:grid-cols-3 gap-6">
        {properties?.map((property: any) => (
          <div
            key={property.id}
            className="bg-white rounded-xl shadow p-4"
          >
            <h2 className="text-xl font-semibold">
              {property.title}
            </h2>

            <p className="text-green-600 font-bold mt-2">
              ₹{property.rent}/month
            </p>

            <p>
              {property.location}, {property.city}
            </p>

            <Link
              href={`/property/${property.id}`}
              className="block mt-4 bg-blue-600 text-white py-2 rounded text-center"
            >
              View Property
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}