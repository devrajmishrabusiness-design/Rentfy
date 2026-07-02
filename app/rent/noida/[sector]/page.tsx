import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sector: string }>;
}): Promise<Metadata> {
  const { sector } = await params;

  return {
    title: `Flats for Rent in ${sector} Noida | Rentfy`,
    description: `Browse rental properties in ${sector}, Noida listed by verified agencies on Rentfy.`,
  };
}

export default async function SectorPage({
  params,
}: {
  params: Promise<{ sector: string }>;
}) {
  const { sector } = await params;

  const formattedSector = sector.replace(/-/g, " ");

    const { data: properties } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "approved")
      .ilike("city", "noida")
      .ilike("location", formattedSector);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold mb-4">
        Flats for Rent in {formattedSector}, Noida
      </h1>

      <p className="text-gray-600 mb-8">
        Browse verified rental properties in {formattedSector}.
      </p>

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

      {properties?.length === 0 && (
        <div className="mt-10 text-center">
          <h2 className="text-2xl font-semibold">
            No properties found in {formattedSector}
          </h2>
        </div>
      )}
    </main>
  );
}