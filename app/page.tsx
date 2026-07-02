import { createClient } from "@/lib/supabase-server";
import PropertyList from "./PropertyList";
import Footer from "./Footer";
import Link from "next/link";
import Image from "next/image";
import type { Property } from "./types";

const whyItems = [
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    title: "Verified Agencies",
    text: "Every agency is reviewed before they can publish a listing.",
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
    title: "Safe Rentals",
    text: "Real photos, real owners, real listings — no surprises later.",
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: "Simple Process",
    text: "Search, compare, contact — without the typical rental chase.",
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: "Local Coverage",
    text: "Focused on Noida and NCR with curated rental inventory.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Search verified homes",
    text: "Filter available rentals by location, type, bedrooms, furnishing and parking.",
  },
  {
    step: "02",
    title: "Review the details",
    text: "Open a listing to compare rent, photos, location and specifications.",
  },
  {
    step: "03",
    title: "Connect with the agency",
    text: "Share your details once and chat directly with the verified agency.",
  },
];

const popularAreas = [
  { label: "Sector 18", href: "/rent/noida/sector-18" },
  { label: "Sector 50", href: "/rent/noida/sector-50" },
  { label: "Sector 62", href: "/rent/noida/sector-62" },
  { label: "Sector 70", href: "/rent/noida/sector-70" },
  { label: "Sector 78", href: "/rent/noida/sector-78" },
  { label: "Sector 137", href: "/rent/noida/sector-137" },
];

const testimonials = [
  {
    name: "Aman Verma",
    role: "Tenant · Sector 62",
    text: "Found a clean 2 BHK in two weekends. The agency was already verified, which made me trust the listing instantly.",
  },
  {
    name: "Priya Sharma",
    role: "Agency Owner",
    text: "RenterEasy brought me serious, high-intent tenants. The dashboard makes lead tracking effortless.",
  },
  {
    name: "Rahul Khanna",
    role: "Tenant · Sector 50",
    text: "Honestly the cleanest rental experience I've had in Noida. Photos matched reality, agent was responsive.",
  },
];

const faqs = [
  {
    q: "Are the agencies verified?",
    a: "Yes. Every agency goes through a manual verification step before they can publish any property.",
  },
  {
    q: "How do I contact a property owner?",
    a: "Click WhatsApp or Contact on any property. We'll save your details and immediately connect you with the verified agency.",
  },
  {
    q: "Is RenterEasy free for tenants?",
    a: "Completely free for tenants. Agencies pay only when they publish listings.",
  },
  {
    q: "Which cities are covered?",
    a: "Today we focus on Noida and surrounding NCR sectors. We'll expand to more cities soon.",
  },
];

const trustItems = [
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M9 12l2 2 4-4" />
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    label: "ID-verified agencies",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    label: "Zero brokerage for tenants",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      </svg>
    ),
    label: "Direct agency chat",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: "Listings reviewed within 24h",
  },
];

export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select(
      `
      *,
      agencies!inner (
       verified
      )
    `
    )
    .eq("agencies.verified", true)
    .eq("status", "approved")
    .returns<Property[]>();

  const activeListings = properties?.length || 0;
  const featuredProperty = properties?.[0];

  return (
    <main className="min-h-screen bg-[var(--brand-background)] text-[var(--brand-text)]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--brand-border)]">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-orange-50/30 to-[var(--brand-background)]" />

        <div className="container-app grid gap-16 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div className="flex flex-col justify-center">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--brand-border)] bg-white px-4 py-1.5 text-sm font-semibold text-[var(--brand-primary)] shadow-sm">
              <span className="grid h-2 w-2 place-items-center rounded-full bg-[var(--brand-primary)]" />
              Trusted by verified rental agencies
            </span>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[var(--brand-text)] sm:text-5xl lg:text-6xl">
              Find a rental home
              <span className="block bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] bg-clip-text text-transparent">
                you&apos;ll love to live in.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--brand-muted)]">
              Browse apartments, flats, villas and houses across Noida &amp;
              NCR — only from agencies reviewed before they publish.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#listings" className="btn-primary">
                Browse listings
                <span aria-hidden>→</span>
              </Link>
              <Link href="/signup" className="btn-secondary">
                List as an agency
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-6 border-t border-[var(--brand-border)] pt-6">
              <div>
                <p className="text-3xl font-extrabold text-[var(--brand-text)]">
                  {activeListings}
                </p>
                <p className="text-sm text-[var(--brand-muted)]">
                  Active listings
                </p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[var(--brand-text)]">
                  100%
                </p>
                <p className="text-sm text-[var(--brand-muted)]">
                  Verified agencies
                </p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[var(--brand-text)]">
                  NCR
                </p>
                <p className="text-sm text-[var(--brand-muted)]">
                  Local coverage
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-orange-200 to-orange-100 opacity-40 blur-3xl" />
            <div className="card overflow-hidden p-3">
              {featuredProperty?.image_url ? (
                <Image
                  src={featuredProperty.image_url}
                  alt={featuredProperty.title || "Featured rental property"}
                  width={720}
                  height={420}
                  unoptimized
                  className="h-72 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="grid h-72 w-full place-items-center rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 text-sm font-medium text-[var(--brand-muted)]">
                  Featured rental
                </div>
              )}
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                  Rental search snapshot
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-text)]">
                  Move from shortlist to site visit faster
                </h2>
                <ul className="mt-5 space-y-3">
                  {[
                    "Verified agency profiles",
                    "Location, rent, furnishing, and parking filters",
                    "Direct contact flow with lead tracking",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-background)] px-4 py-3 text-sm font-medium text-[var(--brand-text)]"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--brand-success)] text-white">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-[var(--brand-border)] bg-white">
        <div className="container-app py-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {trustItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 text-sm font-semibold text-[var(--brand-text)]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-orange-50 text-[var(--brand-primary)]">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why RenterEasy */}
      <section id="why" className="bg-white py-20">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--brand-primary)]">
              Why RenterEasy
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-[var(--brand-text)] sm:text-4xl">
              A premium rental marketplace built on trust.
            </h2>
            <p className="mt-4 text-[var(--brand-muted)]">
              We make renting in Noida &amp; NCR simple, safe and
              predictable — for both tenants and verified agencies.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyItems.map((item) => (
              <div
                key={item.title}
                className="card-hover p-7"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-orange-50 text-[var(--brand-primary)]">
                  {item.icon}
                </span>
                <h3 className="mt-5 text-lg font-bold text-[var(--brand-text)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--brand-muted)]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container-app">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-extrabold text-[var(--brand-text)] sm:text-4xl">
                Simple steps from search to contact.
              </h2>
            </div>
            <Link href="/signup" className="btn-secondary">
              List as an agency
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {howItWorks.map((step) => (
              <div key={step.step} className="card p-7">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-base font-extrabold text-white shadow-sm shadow-orange-500/20">
                  {step.step}
                </span>
                <h3 className="mt-5 text-xl font-bold text-[var(--brand-text)]">
                  {step.title}
                </h3>
                <p className="mt-3 leading-7 text-[var(--brand-muted)]">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Listings */}
      <section
        id="listings"
        className="bg-white py-20"
      >
        <div className="container-app">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                Available properties
              </p>
              <h2 className="mt-3 text-3xl font-extrabold text-[var(--brand-text)] sm:text-4xl">
                Browse current rentals
              </h2>
              <p className="mt-3 text-[var(--brand-muted)]">
                Use the filters to narrow the list and open a property for
                full details.
              </p>
            </div>
          </div>

          <PropertyList properties={properties || []} />
        </div>
      </section>

      {/* Popular areas */}
      <section className="py-20">
        <div className="container-app">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                Popular areas
              </p>
              <h2 className="mt-3 text-3xl font-extrabold text-[var(--brand-text)] sm:text-4xl">
                Explore top Noida sectors
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {popularAreas.map((area) => (
              <Link
                key={area.label}
                href={area.href}
                className="card-hover flex items-center justify-between gap-3 px-6 py-5"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-[var(--brand-primary)]">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-bold text-[var(--brand-text)]">
                      {area.label}, Noida
                    </p>
                    <p className="text-xs text-[var(--brand-muted)]">
                      Browse verified rentals
                    </p>
                  </div>
                </div>
                <span aria-hidden className="text-[var(--brand-primary)]">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-20">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--brand-primary)]">
              Testimonials
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-[var(--brand-text)] sm:text-4xl">
              Loved by tenants and agencies
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="card p-7">
                <div className="flex items-center gap-1 text-amber-500">
                  {"★★★★★".split("").map((s, i) => (
                    <span key={i} aria-hidden>
                      {s}
                    </span>
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-7 text-[var(--brand-text)]">
                  “{t.text}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--brand-primary)] text-sm font-bold text-white">
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[var(--brand-text)]">
                      {t.name}
                    </p>
                    <p className="text-xs text-[var(--brand-muted)]">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="py-20">
        <div className="container-app">
          <div className="rounded-3xl bg-[var(--brand-primary)] px-8 py-12 text-white shadow-xl shadow-orange-500/20">
            <div className="grid gap-8 md:grid-cols-4">
              {[
                { num: `${activeListings}+`, label: "Active rentals" },
                { num: "100%", label: "Verified agencies" },
                { num: "24h", label: "Approval turnaround" },
                { num: "10k+", label: "Tenant searches" },
              ].map((stat) => (
                <div key={stat.label} className="text-center md:text-left">
                  <p className="text-4xl font-extrabold sm:text-5xl">{stat.num}</p>
                  <p className="mt-1 text-sm font-medium text-orange-100">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20">
        <div className="container-app">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                FAQ
              </p>
              <h2 className="mt-3 text-3xl font-extrabold text-[var(--brand-text)] sm:text-4xl">
                Frequently asked questions
              </h2>
              <p className="mt-4 text-[var(--brand-muted)]">
                Still curious? Reach our team at{" "}
                <a
                  href="mailto:support@rentereasy.in"
                  className="font-semibold text-[var(--brand-primary)] hover:underline"
                >
                  support@rentereasy.in
                </a>
                .
              </p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-[var(--brand-border)] bg-white p-6 transition-all duration-200 hover:border-[var(--brand-primary)] open:shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-[var(--brand-text)]">
                    {faq.q}
                    <span
                      aria-hidden
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-stone-100 text-[var(--brand-primary)] transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-[var(--brand-muted)]">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        className="bg-[var(--brand-text)] py-20 text-white"
      >
        <div className="container-app grid gap-12 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-orange-300">
              Contact us
            </p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Need help finding or listing a rental?
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-stone-300">
              Reach the RenterEasy team for agency onboarding, listing
              support, or tenant questions about verified rentals.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Email
                </p>
                <a
                  href="mailto:support@rentereasy.in"
                  className="mt-1 block text-lg font-semibold text-white hover:text-orange-300"
                >
                  support@rentereasy.in
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Service area
                </p>
                <p className="mt-1 text-lg font-semibold">Noida &amp; NCR</p>
              </div>
              <Link
                href="/signup"
                className="inline-flex w-full justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-stone-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-50"
              >
                Create agency account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
