"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const propertyTypes = [
  "All Types",
  "Apartment",
  "Flat",
  "Villa",
  "House",
];

const bedroomOptions = [
  "Any BHK",
  "1 BHK",
  "2 BHK",
  "3 BHK",
  "4+ BHK",
];

const rentOptions = [
  "Any Budget",
  "Under 15K",
  "15K - 25K",
  "25K - 35K",
  "35K - 50K",
  "50K - 75K",
  "75K - 1L",
  "1L+",
];

const popularSectors = [
  "Sector 18",
  "Sector 44",
  "Sector 50",
  "Sector 62",
  "Sector 70",
  "Sector 78",
  "Sector 93",
  "Sector 137",
  "Sector 150",
  "Greater Noida West",
  "Noida Extension",
];

export default function HeroSearch() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [showSectors, setShowSectors] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSectors(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("search", location.trim());
    if (propertyType && propertyType !== "All Types") params.set("type", propertyType);
    if (bedrooms && bedrooms !== "Any BHK") {
      const bhkNum = bedrooms.replace(" BHK", "").replace("+", "");
      if (bhkNum === "Any") {
        // no filter
      } else if (bhkNum === "4") {
        params.set("bedrooms_min", "4");
      } else {
        params.set("bedrooms", bhkNum);
      }
    }
    if (maxRent && maxRent !== "Any Budget") {
      const rentMap: Record<string, number> = {
        "Under 15K": 15000,
        "15K - 25K": 25000,
        "25K - 35K": 35000,
        "35K - 50K": 50000,
        "50K - 75K": 75000,
        "75K - 1L": 100000,
        "1L+": 999999,
      };
      if (rentMap[maxRent]) {
        params.set("rent_max", String(rentMap[maxRent]));
      }
    }
    const url = `/rent?${params.toString()}`;
    router.push(url);
    setShowSectors(false);
  };

  const handleSectorClick = (sector: string) => {
    setLocation(sector);
    setShowSectors(false);
  };

  const handleInputChange = (value: string) => {
    setLocation(value);
    if (value.length > 0) {
      setShowSectors(true);
    } else {
      setShowSectors(false);
    }
  };

  const renderSelect = ({
    value,
    options,
    onChange,
    label,
    placeholder,
  }: {
    value: string;
    options: string[];
    onChange: (v: string) => void;
    label: string;
    placeholder: string;
  }) => (
    <div className="flex-1 min-w-[140px]">
      <label className="sr-only">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full appearance-none rounded-xl border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--brand-text)] placeholder:text-[var(--brand-muted)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-orange-100 focus:ring-offset-0 shadow-sm"
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt} value={opt === placeholder ? "" : opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSearch} className="w-full space-y-4" role="search" aria-label="Property search">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none flex h-full items-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-[var(--brand-muted)]"
              aria-hidden="true"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="search"
            value={location}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (location.length > 0 || popularSectors.length > 0) setShowSectors(true);
            }}
            onBlur={() => setTimeout(() => setShowSectors(false), 200)}
            placeholder="City, sector, or landmark..."
            className="h-12 w-full rounded-xl border border-[var(--brand-border)] bg-white px-12 py-2 pl-10 text-base font-medium text-[var(--brand-text)] placeholder:text-[var(--brand-muted)] outline-none transition-all duration-200 focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-orange-100 focus:ring-offset-0 shadow-sm"
            autoComplete="off"
            aria-label="Location"
            aria-controls="sector-dropdown"
            aria-expanded={showSectors}
          />
        </div>

        {renderSelect({
          value: propertyType,
          options: propertyTypes,
          onChange: setPropertyType,
          label: "Property Type",
          placeholder: "All Types",
        })}

        {renderSelect({
          value: bedrooms,
          options: bedroomOptions,
          onChange: setBedrooms,
          label: "Bedrooms",
          placeholder: "Any BHK",
        })}

        {renderSelect({
          value: maxRent,
          options: rentOptions,
          onChange: setMaxRent,
          label: "Max Rent",
          placeholder: "Any Budget",
        })}
      </div>

      <button
        type="submit"
        className="btn-primary w-full sm:w-auto h-12 shrink-0 rounded-xl px-6 text-base font-semibold shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/40"
        aria-label="Search properties"
      >
        Search
      </button>

      {/* Sector Dropdown */}
      {showSectors && (
        <div
          ref={dropdownRef}
          id="sector-dropdown"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-[var(--brand-border)] bg-white shadow-xl animate-fade-in"
          role="listbox"
        >
          {location.trim() ? (
            <div className="px-4 py-3 text-sm text-[var(--brand-muted)]">
              Searching for &ldquo;{location}&rdquo;...
            </div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-[var(--brand-border)]">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)]">
                  Popular sectors in Noida
                </p>
              </div>
              <ul className="py-1" role="listbox">
                {popularSectors.map((sector) => (
                  <li key={sector}>
                    <button
                      type="button"
                      onClick={() => handleSectorClick(sector)}
                      role="option"
                      aria-selected={false}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-[var(--brand-text)] transition-colors hover:bg-orange-50 hover:text-[var(--brand-primary)]"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[var(--brand-primary)]"
                        aria-hidden="true"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {sector}, Noida
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Selected Location Chip */}
      {location && !showSectors && (
        <div className="mt-2 flex items-center gap-2 animate-fade-in">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-[var(--brand-primary)]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {location}, Noida
            <button
              type="button"
              onClick={() => {
                setLocation("");
                setShowSectors(true);
              }}
              className="ml-1 rounded-full p-0.5 hover:bg-orange-100"
              aria-label="Remove location filter"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </span>
        </div>
      )}
    </form>
  );
}