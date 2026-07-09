"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const popularSectors = [
  "Sector 18",
  "Sector 50",
  "Sector 62",
  "Sector 70",
  "Sector 78",
  "Sector 137",
  "Sector 44",
  "Sector 150",
  "Greater Noida West",
  "Sector 93",
];

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [showSectors, setShowSectors] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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
    let url = "/#listings";
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    if (selectedSector) params.set("sector", selectedSector);
    if (params.toString()) url += `?${params.toString()}`;
    router.push(url);
    setShowSectors(false);
  };

  const handleSectorClick = (sector: string) => {
    setSelectedSector(sector);
    setQuery("");
    setShowSectors(false);
    handleSearch(new Event("submit") as unknown as React.FormEvent);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (value.length > 0) {
      setShowSectors(true);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <div className="relative">
        <div className="relative flex items-center gap-2">
          <div className="absolute left-4 z-10 pointer-events-none flex h-full items-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-[var(--brand-muted)]"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (query.length > 0 || popularSectors.length > 0) setShowSectors(true);
            }}
            onBlur={() => setTimeout(() => setShowSectors(false), 200)}
            placeholder="Search city, sector, or property..."
            className="h-14 w-full rounded-2xl border bg-white/95 bg-[var(--brand-background)]/50 px-12 py-3 pl-10 text-base font-medium text-[var(--brand-text)] placeholder:text-[var(--brand-muted)] outline-none transition-all duration-200 focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-orange-100 focus:ring-offset-0 shadow-sm shadow-black/5"
            autoComplete="off"
            aria-label="Search properties"
            aria-controls="sector-dropdown"
          />

          <button
            type="submit"
            className="btn-primary h-14 shrink-0 rounded-xl px-6 text-base font-semibold shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/40"
            aria-label="Search"
          >
            Search
          </button>
        </div>

        {/* Sector Dropdown */}
        {showSectors && (
          <div
            ref={dropdownRef}
            id="sector-dropdown"
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-[var(--brand-border)] bg-white shadow-xl animate-fade-in"
            role="listbox"
          >
            {query.trim() ? (
              <div className="px-4 py-3 text-sm text-[var(--brand-muted)]">
                Searching for &ldquo;{query}&rdquo;...
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
                          aria-hidden
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

        {/* Selected Sector Chip */}
        {selectedSector && !query && (
          <div className="mt-3 flex items-center gap-2 animate-fade-in">
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
                aria-hidden
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {selectedSector}, Noida
              <button
                type="button"
                onClick={() => {
                  setSelectedSector("");
                  setShowSectors(true);
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-orange-100"
                aria-label="Remove sector filter"
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
                  aria-hidden
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Quick Filters Row - Mobile Optimized */}
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Quick filters">
        <Link
          href="/rent/noida"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--brand-muted)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          All Noida
        </Link>
        <Link
          href="/rent/noida/sector-18"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--brand-muted)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Sector 18
        </Link>
        <Link
          href="/rent/noida/sector-62"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--brand-muted)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Sector 62
        </Link>
        <Link
          href="/rent/noida/sector-137"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--brand-muted)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Sector 137
        </Link>
      </div>
    </form>
  );
}