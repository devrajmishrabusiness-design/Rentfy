import Footer from "../Footer";

export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <div className="flex flex-col lg:flex-row">
        <div className="hidden lg:block lg:w-64 xl:w-72 shrink-0">
          <div className="sticky top-[57px]">
            <div className="card p-4 space-y-3">
              <div className="skeleton h-5 w-20 rounded" />
              {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
                <div key={item} className="skeleton h-9 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="border-b border-[var(--brand-border)] bg-white">
            <div className="container-app py-6 space-y-3">
              <div className="skeleton h-8 w-64 rounded" />
              <div className="skeleton h-4 w-48 rounded" />
            </div>
          </div>

          <section className="container-app py-6 sm:py-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="card p-5 space-y-3">
                  <div className="skeleton h-4 w-24 rounded" />
                  <div className="skeleton h-8 w-16 rounded" />
                  <div className="skeleton h-3 w-32 rounded" />
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <div className="card p-6 space-y-3">
                  <div className="skeleton h-5 w-32 rounded" />
                  <div className="skeleton h-4 w-56 rounded" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[0, 1, 2, 3].map((item) => (
                      <div key={item} className="skeleton h-20 rounded-xl" />
                    ))}
                  </div>
                </div>
                <div className="card overflow-hidden">
                  <div className="border-b border-[var(--brand-border)] px-6 py-4">
                    <div className="skeleton h-5 w-32 rounded" />
                  </div>
                  <div className="p-6 space-y-3">
                    {[0, 1, 2].map((item) => (
                      <div key={item} className="skeleton h-12 w-full rounded-xl" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="card p-6 space-y-3">
                  <div className="skeleton h-5 w-32 rounded" />
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="skeleton h-16 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
