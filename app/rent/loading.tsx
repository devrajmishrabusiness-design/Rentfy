import Footer from "@/app/Footer";

export default function RentLoading() {
  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <div className="container-app py-10">
        <div className="mb-8 space-y-2">
          <div className="skeleton h-6 w-44 rounded-full" />
          <div className="skeleton h-10 w-80 rounded" />
          <div className="skeleton h-5 w-64 rounded" />
        </div>

        <div className="mb-6">
          <div className="skeleton h-12 max-w-3xl rounded-xl" />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
            <div className="card p-5 space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="skeleton h-4 w-24 rounded" />
                  <div className="flex flex-wrap gap-2">
                    <div className="skeleton h-9 w-20 rounded-lg" />
                    <div className="skeleton h-9 w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-4 space-y-2">
              <div className="skeleton h-5 w-48 rounded" />
              <div className="flex gap-2">
                <div className="skeleton h-8 w-32 rounded-lg" />
                <div className="skeleton h-8 w-32 rounded-lg" />
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
      </div>
      <Footer />
    </main>
  );
}