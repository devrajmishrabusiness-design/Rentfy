import Footer from "@/app/Footer";

export default function SectorLoading() {
  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <div className="container-app py-10">
        <div className="mb-8 space-y-2">
          <div className="skeleton h-6 w-44 rounded-full" />
          <div className="skeleton h-10 w-80 rounded" />
          <div className="skeleton h-5 w-64 rounded" />
        </div>

        <div className="space-y-6">
          <div className="card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="skeleton h-12 flex-1 rounded-xl" />
              <div className="skeleton h-12 w-32 rounded-xl" />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
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
        </div>
      </div>
      <Footer />
    </main>
  );
}