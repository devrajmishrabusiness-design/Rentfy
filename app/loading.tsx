import Footer from "./Footer";

export default function GlobalLoading() {
  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="container-app py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-[var(--brand-primary)]">
            <svg
              className="h-8 w-8 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--brand-text)]">
            Loading RenterEasy...
          </h1>
          <p className="mt-2 text-sm text-[var(--brand-muted)]">
            We&apos;re fetching the latest verified rentals for you.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-white"
            >
              <div className="skeleton h-56 w-full" />
              <div className="space-y-3 p-5">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-6 w-2/3 rounded" />
                <div className="flex gap-2">
                  <div className="skeleton h-6 w-16 rounded-full" />
                  <div className="skeleton h-6 w-16 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}