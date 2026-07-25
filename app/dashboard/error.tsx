"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "../Footer";

interface DashboardErrorProps {
  error: Error;
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await reset();
    setRetrying(false);
  };

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="container-app py-20 text-center">
        <div className="mx-auto max-w-lg rounded-3xl border border-[var(--brand-border)] bg-white p-8 shadow-sm sm:p-10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-2xl text-rose-600">⚠️</div>
          <h1 className="mt-5 text-3xl font-extrabold text-[var(--brand-text)]">Something went wrong</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--brand-muted)]">
            {error.message || "We couldn't load your dashboard. Please try again."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={handleRetry} disabled={retrying} className="btn-primary">
              {retrying ? "Retrying..." : "Try Again"}
            </button>
            <Link href="/" className="btn-secondary">Return Home</Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
