import Link from "next/link";

export default function PropertyNotFound() {
  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <div className="container-app py-32">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-stone-100 to-orange-50 text-4xl">
            🏠
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--brand-text)]">
            Property not found
          </h1>
          <p className="mt-3 text-base text-[var(--brand-muted)]">
            The property you&apos;re looking for may have been removed, sold,
            or the link might be incorrect.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/rent" className="btn-primary">
              Browse Rentals
            </Link>
            <Link href="/" className="btn-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}