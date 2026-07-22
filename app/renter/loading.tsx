import Footer from "../Footer";

export default function RenterLoading() {
  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="border-b border-[var(--brand-border)] bg-white">
        <div className="container-app py-6 sm:py-8 space-y-3">
          <div className="skeleton h-5 w-28 rounded-full" />
          <div className="skeleton h-8 w-64 rounded" />
          <div className="skeleton h-4 w-56 rounded" />
        </div>
      </section>

      <section className="border-b border-[var(--brand-border)] bg-white/95">
        <div className="container-app py-3 flex gap-2">
          <div className="skeleton h-9 w-28 rounded-full" />
          <div className="skeleton h-9 w-28 rounded-full" />
          <div className="skeleton h-9 w-28 rounded-full" />
        </div>
      </section>

      <section className="container-app py-6 sm:py-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-96 rounded-3xl" />
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}