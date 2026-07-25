"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function PropertyDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    console.error("Property detail page error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <div className="container-app py-20">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--brand-text)]">
            Failed to load property
          </h2>
          <p className="mt-2 text-sm text-[var(--brand-muted)]">
            {error.message || "Something went wrong while loading this property."}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="btn-primary"
            >
              Retry
            </button>
            <a
              href={`/property${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
              className="btn-secondary"
            >
              Reload page
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}