"use client";

import { useEffect } from "react";
import Link from "next/link";
import Footer from "./Footer";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="container-app py-24 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-red-50 text-4xl text-red-600">
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
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h1 className="text-3xl font-extrabold text-[var(--brand-text)] sm:text-4xl">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--brand-muted)]">
            We encountered an unexpected error while loading this page. Please
            try again, or come back later.
          </p>

          {error.digest && (
            <p className="mt-3 text-xs font-mono text-[var(--brand-muted)]">
              Reference: {error.digest}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={reset}
              className="btn-primary"
            >
              Try again
            </button>
            <Link href="/" className="btn-secondary">
              Back to home
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}