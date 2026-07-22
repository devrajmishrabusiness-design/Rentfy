import { createClient } from "@/lib/supabase-server";
import Footer from "@/app/Footer";
import PropertyList from "@/app/PropertyList";
import Link from "next/link";
import type { Metadata } from "next";
import type { Property } from "../../../types";
import { extractPagination, toRange, respondPaginated } from "@/lib/pagination";
import { listingPropertyColumns } from "@/lib/listing-query";

export const revalidate = 300;

const popularSectors = [
  "Sector 18",
  "Sector 50",
  "Sector 62",
  "Sector 70",
  "Sector 78",
  "Sector 137",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sector: string }>;
}): Promise<Metadata> {
  const { sector } = await params;
  const formattedSector = sector.replace(/-/g, " ");

  return {
    title: `Flats for Rent in ${formattedSector}, Noida | RenterEasy`,
    description: `Browse verified rental properties in ${formattedSector}, Noida listed by verified agencies on RenterEasy.`,
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

  const [from, to] = toRange(pagination);

  const { data: properties, count: totalCount } = await supabase
    .from("properties")
    .select(listingPropertyColumns, { count: "exact" })
    .eq("status", "approved")
    .ilike("city", "noida")
    .ilike("location", formattedSector)
    .order("created_at", { ascending: false })
    .range(from, to)
    .returns<Property[]>();

  const paginated = respondPaginated(properties ?? [], totalCount ?? 0, pagination);

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="border-b border-[var(--brand-border)] bg-gradient-to-br from-slate-50 to-indigo-50 py-14">
        <div className="container-app">
          <span className="badge-info mb-3">Noida rentals</span>
          <h1 className="text-3xl font-extrabold text-[var(--brand-text)] sm:text-4xl">
            Flats &amp; Apartments for Rent in {formattedSector}, Noida
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--brand-muted)]">
            Browse verified rental properties in {formattedSector}.
          </p>
        </div>
      </section>

      <section className="container-app py-12">
        <div className="mb-10">
          <h2 className="text-2xl font-extrabold text-[var(--brand-text)]">
            Popular areas in Noida
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {popularSectors.map((s) => {
              const slug = s.toLowerCase().replace(/\s+/g, "-");
              return (
                <Link
                  key={s}
                  href={`/rent/noida/${slug}`}
                  className="rounded-full border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-text)] transition-all hover:-translate-y-0.5 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                >
                  {s}
                </Link>
              );
            })}
          </div>
        </div>

        <PropertyList properties={paginated.items} />

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
            <span className="text-sm font-medium text-[var(--brand-muted)]">
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
      </section>

      <Footer />
    </main>
  );
}