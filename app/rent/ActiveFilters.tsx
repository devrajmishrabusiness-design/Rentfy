"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface ActiveFiltersProps {
  filters: Record<string, string | undefined>;
  className?: string;
}

const filterLabels: Record<string, string> = {
  search: "Search",
  type: "Property Type",
  bedrooms: "Bedrooms",
  minRent: "Min Rent",
  maxRent: "Max Rent",
  furnishing: "Furnishing",
  parking: "Parking",
  verified: "Verified Only",
};

const filterValueLabels: Record<string, Record<string, string>> = {
  bedrooms: {
    "1": "1 BHK",
    "2": "2 BHK",
    "3": "3 BHK",
    "4": "4+ BHK",
  },
  minRent: {
    "0": "₹0",
    "10000": "₹10K",
    "15000": "₹15K",
    "25000": "₹25K",
    "35000": "₹35K",
    "50000": "₹50K",
    "75000": "₹75K",
    "100000": "₹1L",
  },
  maxRent: {
    "10000": "₹10K",
    "15000": "₹15K",
    "25000": "₹25K",
    "35000": "₹35K",
    "50000": "₹50K",
    "75000": "₹75K",
    "100000": "₹1L",
  },
};

export default function ActiveFilters({ filters, className = "" }: ActiveFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const removeFilter = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      params.delete("page");
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    Object.keys(filters).forEach((key) => params.delete(key));
    params.delete("page");
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router, pathname, searchParams, filters]);

  const activeFilters = Object.entries(filters)
    .filter(([, value]) => value && value !== "all" && value !== "")
    .map(([key, value]) => ({
      key,
      label: filterLabels[key] || key,
      value: filterValueLabels[key]?.[value || ""] || value,
    }));

  if (activeFilters.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="group" aria-label="Active filters">
      {activeFilters.map(({ key, label, value }) => (
        <span key={key} className="badge-info flex items-center gap-1.5">
          <span className="font-medium">{label}:</span>
          <span>{value}</span>
          <button
            type="button"
            onClick={() => removeFilter(key)}
            className="ml-1 p-0.5 rounded hover:bg-orange-200 transition-colors"
            aria-label={`Remove ${label} filter`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </span>
      ))}
      {activeFilters.length > 1 && (
        <button
          type="button"
          onClick={clearAll}
          className="badge-muted hover:bg-stone-200 transition-colors"
          aria-label="Clear all filters"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mr-1">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Clear all
        </button>
      )}
    </div>
  );
}