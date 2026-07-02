"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileMenu({
  navItems,
}: {
  navItems: { label: string; href: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--brand-border)] bg-white text-[var(--brand-text)] hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {isOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full border-b border-[var(--brand-border)] bg-white p-4 shadow-lg animate-fade-in-up">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-3 text-base font-semibold text-[var(--brand-text)] hover:bg-stone-50 hover:text-[var(--brand-primary)]"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
