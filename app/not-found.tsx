import Link from "next/link";
import Footer from "./Footer";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="container-app py-24 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-orange-50 text-[var(--brand-primary)]">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <p className="text-sm font-bold uppercase tracking-wider text-[var(--brand-primary)]">
            404
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[var(--brand-text)] sm:text-4xl">
            Page not found
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--brand-muted)]">
            The page you&apos;re looking for might have been removed, renamed,
            or doesn&apos;t exist.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className="btn-primary">
              Back to home
            </Link>
            <Link href="/#listings" className="btn-secondary">
              Browse listings
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}