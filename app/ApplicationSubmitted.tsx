import Link from "next/link";
import Footer from "./Footer";

export default function ApplicationSubmitted() {
  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="container-app py-16 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <div className="card overflow-hidden">
            {/* Header */}
            <div className="relative bg-slate-900 px-8 py-12 text-center text-white">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/20 shadow-inner animate-scale-in">
                <svg
                  width="42"
                  height="42"
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
              </div>
              <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl">
                Application Submitted
              </h1>
              <p className="mt-3 text-white/90">
                Thanks for registering with RenterEasy.
              </p>
            </div>

            <div className="p-8">
              <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-6">
                <p className="leading-7 text-[var(--brand-text)]">
                  Our team is reviewing your agency. Approval usually takes
                  less than 24 hours. We&apos;ll notify you once your account has
                  been verified.
                </p>
              </div>

              {/* Timeline */}
              <div className="mt-8">
                <p className="mb-5 text-sm font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                  Review status
                </p>
                <ol className="relative space-y-6 border-l-2 border-dashed border-[var(--brand-border)] pl-6">
                  <li className="relative">
                    <span className="absolute -left-[33px] grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white shadow">
                      <svg
                        width="14"
                        height="14"
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
                    <p className="text-base font-bold text-[var(--brand-text)]">
                      Account created
                    </p>
                    <p className="text-sm text-[var(--brand-muted)]">
                      Your agency profile has been submitted successfully.
                    </p>
                  </li>

                  <li className="relative">
                    <span className="absolute -left-[33px] grid h-7 w-7 place-items-center rounded-full bg-amber-500 text-white shadow animate-pulse">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </span>
                    <p className="text-base font-bold text-[var(--brand-text)]">
                      Under review
                    </p>
                    <p className="text-sm text-[var(--brand-muted)]">
                      Our team is verifying your details — typically within
                      24 hours.
                    </p>
                  </li>

                  <li className="relative">
                    <span className="absolute -left-[33px] grid h-7 w-7 place-items-center rounded-full bg-stone-200 text-[var(--brand-muted)]">
                      <span className="h-2 w-2 rounded-full bg-[var(--brand-muted)]" />
                    </span>
                    <p className="text-base font-bold text-[var(--brand-text)]">
                      Approved &amp; live
                    </p>
                    <p className="text-sm text-[var(--brand-muted)]">
                      You can start publishing properties once verification
                      is complete.
                    </p>
                  </li>
                </ol>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/" className="btn-primary flex-1">
                  Return home
                </Link>
                <a
                  href="mailto:support@rentereasy.in"
                  className="btn-secondary flex-1"
                >
                  Contact support
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}