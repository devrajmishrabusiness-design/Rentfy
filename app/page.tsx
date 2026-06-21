import { supabase } from "@/lib/supabase";
import PropertyList from "./PropertyList";
import Navbar from "./Navbar";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const { data: properties } = await supabase
     .from("properties")
     .select(`
      *,
      agencies!inner (
       verified
      )
    `)
      .eq("agencies.verified", true)
      .eq("status", "approved");

  const activeListings = properties?.length || 0;
  const featuredProperty = properties?.[0];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-x-0 top-0 h-72 bg-slate-100" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <span className="mb-5 w-fit rounded border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              Trusted by verified rental agencies
            </span>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              Find a rental home with clearer choices and verified listings.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Explore apartments, flats, villas, and houses across Noida and
              NCR from agencies reviewed before they publish.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#listings"
                className="inline-flex justify-center rounded bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Browse listings
              </Link>
              <Link
                href="/login"
                className="inline-flex justify-center rounded border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Login / Signup
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-slate-200 pt-6">
              <div>
                <p className="text-2xl font-bold text-slate-950">
                  {activeListings}
                </p>
                <p className="text-sm text-slate-500">Active listings</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-950">100%</p>
                <p className="text-sm text-slate-500">Verified agencies</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-950">NCR</p>
                <p className="text-sm text-slate-500">Local coverage</p>
              </div>
            </div>
          </div>

          <div className="rounded bg-slate-950 p-4 shadow-2xl">
            <div className="overflow-hidden rounded bg-white">
              {featuredProperty?.image_url && (
                <Image
                  src={featuredProperty.image_url}
                  alt={featuredProperty.title || "Featured rental property"}
                  width={720}
                  height={360}
                  unoptimized
                  className="h-56 w-full object-cover"
                />
              )}
              <div className="border-b border-slate-200 px-5 py-4">
                <p className="text-sm font-semibold text-slate-500">
                  Rental search snapshot
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                  Move from shortlist to site visit faster
                </h2>
              </div>
              <div className="grid gap-3 p-5">
                {[
                  "Verified agency profiles",
                  "Location, rent, furnishing, and parking filters",
                  "Detailed property pages with direct contact flow",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded border border-slate-200 bg-slate-50 p-4"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
              About Rentfy
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">
              A focused rental marketplace for serious home searches.
            </h2>
          </div>
          <div className="grid gap-5 text-slate-600 md:grid-cols-2">
            <p className="leading-7">
              Rentfy helps tenants compare rental homes from verified agencies
              without sorting through stale or unclear listings.
            </p>
            <p className="leading-7">
              Agencies get a professional place to publish approved properties,
              manage leads, and build trust with better presentation.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-950">
                Simple steps from search to contact.
              </h2>
            </div>
            <Link
              href="/signup"
              className="inline-flex w-fit rounded border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-100"
            >
              List as an agency
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Search verified homes",
                text: "Filter available rentals by location, type, bedrooms, furnishing, and parking.",
              },
              {
                title: "Review the details",
                text: "Open a listing to compare rent, photos, location, and property specifications.",
              },
              {
                title: "Connect with the agency",
                text: "Contact the verified agency directly when a property matches your needs.",
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="rounded border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="grid h-10 w-10 place-items-center rounded bg-slate-950 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-xl font-bold text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="listings" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                Available properties
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-950">
                Browse current rentals
              </h2>
            </div>
            <p className="max-w-xl text-slate-600">
              Use the filters to narrow the list and open a property for full
              details.
            </p>
          </div>

          <PropertyList properties={properties || []} />
        </div>
      </section>

      <section id="contact" className="bg-slate-950 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-300">
              Contact us
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Need help finding or listing a rental?
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              Reach out to the Rentfy team for agency onboarding, listing
              support, or tenant questions about verified rentals.
            </p>
          </div>

          <div className="rounded border border-white/10 bg-white/5 p-6">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-400">Email</p>
                <a
                  href="mailto:support@rentfy.in"
                  className="mt-1 block text-lg font-semibold text-white hover:text-emerald-200"
                >
                  support@rentfy.in
                </a>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400">
                  Service area
                </p>
                <p className="mt-1 text-lg font-semibold">Noida and NCR</p>
              </div>
              <Link
                href="/signup"
                className="inline-flex rounded bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Create agency account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
