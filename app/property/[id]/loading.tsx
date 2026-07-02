import Footer from "@/app/Footer";

export default function PropertyDetailLoading() {
  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <div className="container-app py-10">
        {/* Image gallery skeleton */}
        <div className="mb-10">
          <div className="skeleton h-[420px] w-full rounded-2xl sm:h-[480px]" />
          <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-xl sm:h-24" />
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main column */}
          <div className="space-y-8">
            {/* Title card */}
            <div className="card p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <div className="skeleton h-6 w-20 rounded-full" />
                    <div className="skeleton h-6 w-16 rounded-full" />
                  </div>
                  <div className="skeleton h-9 w-3/4 rounded" />
                  <div className="skeleton h-5 w-1/2 rounded" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="skeleton ml-auto h-3 w-24 rounded" />
                  <div className="skeleton ml-auto h-10 w-32 rounded" />
                </div>
              </div>
              <div className="mt-6 space-y-2 border-t border-[var(--brand-border)] pt-6">
                <div className="skeleton h-5 w-40 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-5/6 rounded" />
              </div>
            </div>

            {/* Highlights */}
            <div className="card p-7">
              <div className="skeleton h-6 w-40 rounded" />
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4"
                  >
                    <div className="skeleton h-5 w-5 rounded" />
                    <div className="skeleton mt-3 h-3 w-16 rounded" />
                    <div className="skeleton mt-2 h-4 w-20 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="card p-7">
              <div className="skeleton h-6 w-32 rounded" />
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton h-14 rounded-2xl"
                  />
                ))}
              </div>
            </div>

            {/* Agency */}
            <div className="card p-7">
              <div className="skeleton h-6 w-28 rounded" />
              <div className="mt-5 flex items-center gap-4">
                <div className="skeleton h-14 w-14 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-48 rounded" />
                  <div className="skeleton h-4 w-32 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky contact sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <div className="skeleton h-24 rounded-2xl" />
              <div className="mt-5 space-y-3">
                <div className="skeleton h-12 rounded-xl" />
                <div className="skeleton h-12 rounded-xl" />
              </div>
              <div className="mt-5 space-y-2 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="skeleton h-4 w-16 rounded" />
                    <div className="skeleton h-4 w-20 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  );
}