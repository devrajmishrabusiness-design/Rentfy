import Footer from "../Footer";

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="container-app py-10">
        <div className="mb-4 space-y-2">
          <div className="skeleton h-5 w-28 rounded-full" />
          <div className="skeleton h-9 w-72 rounded" />
          <div className="skeleton h-4 w-48 rounded" />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-8 w-28 rounded" />
              <div className="skeleton h-3 w-32 rounded" />
            </div>
          ))}
        </div>

        <div className="mt-10 card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="skeleton h-5 w-32 rounded" />
            <div className="skeleton h-6 w-20 rounded-full" />
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skeleton h-48 w-full" />
                <div className="space-y-3 p-5">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-4 w-1/2 rounded" />
                  <div className="skeleton h-6 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}