import { supabase } from "@/lib/supabase";
import Footer from "@/app/Footer";
import PropertyList from "@/app/PropertyList";
import Link from "next/link";
import type { Metadata } from "next";
import type { Property } from "../../types";

export const metadata: Metadata = {
  title: "Flats & Apartments for Rent in Noida | RenterEasy",
  description:
    "Browse verified rental flats, apartments, houses and villas in Noida.",
};

const popularSectors = [
  "Sector 5",
  "Sector 18",
  "Sector 50",
  "Sector 51",
  "Sector 62",
  "Sector 70",
  "Sector 78",
  "Sector 137",
];

export default async function NoidaRentPage() {
  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "approved")
    .ilike("city", "noida")
    .returns<Property[]>();

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="border-b border-[var(--brand-border)] bg-gradient-to-br from-slate-50 to-indigo-50 py-14">
        <div className="container-app">
          <span className="badge-info mb-3">Noida rentals</span>
          <h1 className="text-3xl font-extrabold text-[var(--brand-text)] sm:text-4xl">
            Flats &amp; Apartments for Rent in Noida
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--brand-muted)]">
            Browse verified rental properties across all sectors of Noida.
          </p>
        </div>
      </section>

      <section className="container-app py-12">
        <div className="mb-10">
          <h2 className="text-2xl font-extrabold text-[var(--brand-text)]">
            Popular areas in Noida
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {popularSectors.map((sector) => {
              const slug = sector.toLowerCase().replace(/\s+/g, "-");
              return (
                <Link
                  key={sector}
                  href={`/rent/noida/${slug}`}
                  className="rounded-full border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-text)] transition-all hover:-translate-y-0.5 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                >
                  {sector}
                </Link>
              );
            })}
          </div>
        </div>

        <PropertyList properties={properties || []} />
      </section>

      <Footer />
    </main>
  );
}
