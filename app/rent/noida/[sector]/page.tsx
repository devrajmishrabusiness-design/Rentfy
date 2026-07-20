import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import type { Metadata } from "next";
import type { Property } from "../../../types";
import { extractPagination, toRange, respondPaginated } from "@/lib/pagination";
import { listingPropertyColumns } from "@/lib/listing-query";

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
  searchParams,
}: {
  params: Promise<{ sector: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sector } = await params;
  const supabase = await createClient();
  const resolvedParams = await searchParams;
  const pagination = extractPagination(new URLSearchParams(
    Object.entries(resolvedParams).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((sv) => [k, sv] as [string, string]) : [[k, v ?? ""] as [string, string]]
    )
  ));

  const formattedSector = sector.replace(/-/g, " ");

  const { count: totalCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .eq("city", "noida")
    .ilike("location", formattedSector);

  const [from, to] = toRange(pagination);

  const { data: properties } = await supabase
    .from("properties")
    .select(listingPropertyColumns)
    .eq("status", "approved")
    .eq("city", "noida")
    .ilike("location", formattedSector)
    .order("created_at", { ascending: false })
    .range(from, to)
    .returns<Property[]>();

  const paginated = respondPaginated(properties ?? [], totalCount ?? 0, pagination);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold mb-4">
        Flats for Rent in {formattedSector}, Noida
      </h1>

      <p className="text-gray-600 mb-8">
        Browse verified rental properties in {formattedSector}.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {paginated.items.map((property: Property) => (
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

      {paginated.items.length === 0 && (
        <div className="mt-10 text-center">
          <h2 className="text-2xl font-semibold">
            No properties found in {formattedSector}
          </h2>
        </div>
      )}

      {paginated.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          {paginated.hasPrev && (
            <Link
              href={`/rent/noida/${sector}?page=${paginated.page - 1}`}
              className="btn-secondary"
            >
              Previous
            </Link>
          )}
          <span className="text-sm font-medium text-gray-500">
            Page {paginated.page} of {paginated.totalPages}
          </span>
          {paginated.hasNext && (
            <Link
              href={`/rent/noida/${sector}?page=${paginated.page + 1}`}
              className="btn-secondary"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </main>
  );
}