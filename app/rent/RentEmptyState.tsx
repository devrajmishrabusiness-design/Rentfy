"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface RentEmptyStateProps {
  hasFilters: boolean;
}

export default function RentEmptyState({ hasFilters }: RentEmptyStateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    [
      "search",
      "type",
      "bedrooms",
      "minRent",
      "maxRent",
      "furnishing",
      "parking",
      "verified",
      "page",
    ].forEach((key) => params.delete(key));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  if (hasFilters) {
    return (
      <div className="container-app py-20">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-background)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--brand-muted)]" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--brand-text)]">No properties found</h2>
          <p className="mt-2 text-sm text-[var(--brand-muted)]">
            Try adjusting your filters or search terms to find more properties.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="btn-primary mt-6"
          >
            Clear all filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-20">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-background)]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--brand-muted)]" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--brand-text)]">No properties available</h2>
        <p className="mt-2 text-sm text-[var(--brand-muted)]">
          There are no verified rental properties listed right now. Check back soon or explore our other pages.
        </p>
      </div>
    </div>
  );
}