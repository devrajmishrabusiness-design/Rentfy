"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useCallback } from "react";

interface RentFiltersProps {
  defaultValues?: {
    search?: string;
    type?: string;
    bedrooms?: string;
    minRent?: string;
    maxRent?: string;
    furnishing?: string;
    parking?: string;
    verified?: string;
  };
  className?: string;
}

const propertyTypes = [
  { value: "Apartment", label: "Apartment" },
  { value: "Independent House", label: "Independent House" },
  { value: "Villa", label: "Villa" },
  { value: "PG", label: "PG / Co-living" },
  { value: "Studio", label: "Studio" },
];

const bedroomOptions = [
  { value: "1", label: "1 BHK" },
  { value: "2", label: "2 BHK" },
  { value: "3", label: "3 BHK" },
  { value: "4", label: "4+ BHK" },
];

const furnishingOptions = [
  { value: "Furnished", label: "Furnished" },
  { value: "Semi-Furnished", label: "Semi-Furnished" },
  { value: "Unfurnished", label: "Unfurnished" },
];

const rentRanges = [
  { value: "0-10000", label: "Under ₹10K", min: 0, max: 10000 },
  { value: "10000-15000", label: "₹10K - ₹15K", min: 10000, max: 15000 },
  { value: "15000-25000", label: "₹15K - ₹25K", min: 15000, max: 25000 },
  { value: "25000-35000", label: "₹25K - ₹35K", min: 25000, max: 35000 },
  { value: "35000-50000", label: "₹35K - ₹50K", min: 35000, max: 50000 },
  { value: "50000-75000", label: "₹50K - ₹75K", min: 50000, max: 75000 },
  { value: "75000-100000", label: "₹75K - ₹1L", min: 75000, max: 100000 },
  { value: "100000-", label: "₹1L+", min: 100000, max: null },
];

export default function RentFilters({
  defaultValues = {},
  className = "",
}: RentFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const updateUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      params.delete("page");
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const handleChange = (key: string, value: string) => {
    updateUrl({ [key]: value });
  };

  const clearAll = () => {
    updateUrl({
      search: undefined,
      type: undefined,
      bedrooms: undefined,
      minRent: undefined,
      maxRent: undefined,
      furnishing: undefined,
      parking: undefined,
      verified: undefined,
    });
  };

  const hasActiveFilters =
    defaultValues.search ||
    defaultValues.type ||
    defaultValues.bedrooms ||
    defaultValues.minRent ||
    defaultValues.maxRent ||
    defaultValues.furnishing ||
    defaultValues.parking ||
    defaultValues.verified;

  return (
    <>
      <button
        type="button"
        className="btn-secondary lg:hidden w-full justify-between"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-controls="mobile-filters-drawer"
      >
        <span className="flex items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="badge-info">{Object.keys(defaultValues).filter((k) => defaultValues[k as keyof typeof defaultValues]).length}</span>
          )}
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <aside
        id="mobile-filters-drawer"
        className={`fixed inset-0 z-50 lg:hidden transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Filter properties"
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} aria-hidden="true" />
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
          <div className="sticky top-0 flex items-center justify-between p-4 border-b border-[var(--brand-border)] bg-white">
            <h2 className="text-lg font-bold text-[var(--brand-text)]">Filters</h2>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  className="text-sm font-medium text-[var(--brand-primary)] hover:underline"
                  onClick={clearAll}
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                className="p-2 rounded-lg text-[var(--brand-muted)] hover:bg-[var(--brand-background)]"
                onClick={() => setIsOpen(false)}
                aria-label="Close filters"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-4 space-y-6" role="form" aria-label="Property filters">
            <FilterSection title="Property Type" keyName="type" options={propertyTypes} value={defaultValues.type} onChange={handleChange} />
            <FilterSection title="Bedrooms" keyName="bedrooms" options={bedroomOptions} value={defaultValues.bedrooms} onChange={handleChange} />
            <FilterSection title="Furnishing" keyName="furnishing" options={furnishingOptions} value={defaultValues.furnishing} onChange={handleChange} />
            <RentRangeSection keyNameMin="minRent" keyNameMax="maxRent" minValue={defaultValues.minRent} maxValue={defaultValues.maxRent} onChange={handleChange} />
            <CheckboxFilter keyName="parking" label="Parking available" checked={defaultValues.parking === "true"} onChange={handleChange} />
            <CheckboxFilter keyName="verified" label="Verified agencies only" checked={defaultValues.verified === "true"} onChange={handleChange} />
          </div>
          <div className="sticky bottom-0 p-4 border-t border-[var(--brand-border)] bg-white">
            <button type="button" className="btn-primary w-full" onClick={() => setIsOpen(false)}>
              Apply Filters
            </button>
          </div>
        </div>
      </aside>

      <div className={`hidden lg:block ${className}`}>
        <div className="card p-5 space-y-6" role="form" aria-label="Property filters">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--brand-text)]">Filters</h2>
            {hasActiveFilters && (
              <button type="button" className="text-sm font-medium text-[var(--brand-primary)] hover:underline" onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>
          <FilterSection title="Property Type" keyName="type" options={propertyTypes} value={defaultValues.type} onChange={handleChange} />
          <FilterSection title="Bedrooms" keyName="bedrooms" options={bedroomOptions} value={defaultValues.bedrooms} onChange={handleChange} />
          <FilterSection title="Furnishing" keyName="furnishing" options={furnishingOptions} value={defaultValues.furnishing} onChange={handleChange} />
          <RentRangeSection keyNameMin="minRent" keyNameMax="maxRent" minValue={defaultValues.minRent} maxValue={defaultValues.maxRent} onChange={handleChange} />
          <CheckboxFilter keyName="parking" label="Parking available" checked={defaultValues.parking === "true"} onChange={handleChange} />
          <CheckboxFilter keyName="verified" label="Verified agencies only" checked={defaultValues.verified === "true"} onChange={handleChange} />
        </div>
      </div>
    </>
  );
}

function FilterSection({
  title,
  keyName,
  options,
  value,
  onChange,
}: {
  title: string;
  keyName: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="label text-xs uppercase tracking-wider text-[var(--brand-muted)]">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(keyName, opt.value)}
            className={`btn-secondary text-sm ${value === opt.value ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white" : ""}`}
            aria-pressed={value === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function RentRangeSection({
  keyNameMin,
  keyNameMax,
  minValue,
  maxValue,
  onChange,
}: {
  keyNameMin: string;
  keyNameMax: string;
  minValue?: string;
  maxValue?: string;
  onChange: (key: string, value: string) => void;
}) {
  const handleRangeSelect = (range: string) => {
    if (!range) {
      onChange(keyNameMin, "");
      onChange(keyNameMax, "");
      return;
    }
    const [min, max] = range.split("-");
    onChange(keyNameMin, min);
    if (max) {
      onChange(keyNameMax, max);
    } else {
      onChange(keyNameMax, "");
    }
  };

  return (
    <fieldset className="space-y-3">
      <legend className="label text-xs uppercase tracking-wider text-[var(--brand-muted)]">Monthly Rent</legend>
      <div className="flex flex-wrap gap-2">
        {rentRanges.map((range) => (
          <button
            key={range.value}
            type="button"
            onClick={() => handleRangeSelect(range.value)}
            className={`btn-secondary text-sm ${minValue === String(range.min) && (range.max === null || maxValue === String(range.max)) ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white" : ""}`}
            aria-pressed={minValue === String(range.min) && (range.max === null || maxValue === String(range.max))}
          >
            {range.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function CheckboxFilter({
  keyName,
  label,
  checked,
  onChange,
}: {
  keyName: string;
  label: string;
  checked: boolean;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(keyName, e.target.checked ? "true" : "")}
          className="h-4 w-4 rounded border-[var(--brand-border)] text-[var(--brand-primary)] focus:ring-2 focus:ring-orange-100"
          aria-label={label}
        />
        <span className="text-sm font-medium text-[var(--brand-text)]">{label}</span>
      </label>
    </fieldset>
  );
}