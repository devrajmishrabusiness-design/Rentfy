"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
}

interface MobileMenuProps {
  navItems: NavItem[];
  isRenter?: boolean;
  isAgency?: boolean;
  isVerifiedAgency?: boolean;
  isAdmin?: boolean;
  agencyName?: string;
}

export default function MobileMenu({
  navItems,
  isRenter = false,
  isAgency = false,
  isVerifiedAgency = false,
  isAdmin = false,
  agencyName,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const router = useRouter();

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setIsOpen(false);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
    close();
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="grid h-12 w-12 place-items-center rounded-xl border border-[var(--brand-border)] bg-white text-[var(--brand-text)] hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
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
        <div
          id="mobile-menu"
          className="fixed inset-0 z-50 md:hidden animate-slide-in-right"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--brand-border)]">
              <span className="text-lg font-semibold text-[var(--brand-text)]">Menu</span>
              <button
                type="button"
                onClick={close}
                className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--brand-border)] bg-white text-[var(--brand-text)] hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                aria-label="Close menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href.replace(/\/#.*$/, "")));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center h-12 px-4 rounded-xl text-base font-semibold hover:bg-stone-50 hover:text-[var(--brand-primary)] ${
                      isActive ? "text-[var(--brand-primary)] bg-stone-50" : "text-[var(--brand-text)]"
                    }`}
                    onClick={close}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {(isRenter || isAgency || isAdmin) && (
              <div className="border-t border-[var(--brand-border)] p-4 space-y-2">
                <p className="px-4 text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)]">
                  Account
                </p>

                {isRenter && (
                  <>
                    <p className="px-4 text-[11px] font-medium uppercase tracking-wider text-[var(--brand-primary)]">
                      Renter
                    </p>
                    <MobileMenuLink href="/renter" icon={<UserIcon />} label="Profile" onClick={close} />
                    <MobileMenuLink href="/renter?tab=favorites" icon={<HeartIcon />} label="Saved Properties" onClick={close} />
                    <MobileMenuLink href="/renter?tab=visits" icon={<CalendarIcon />} label="Scheduled Visits" onClick={close} />
                    <MobileMenuLink href="/renter?tab=settings" icon={<SettingsIcon />} label="Settings" onClick={close} />
                  </>
                )}

                {isAgency && (
                  <>
                    <MobileMenuLink href="/profile" icon={<UserIcon />} label="Agency Profile" onClick={close} />
                    <MobileMenuLink href="/dashboard" icon={<GridIcon />} label="Dashboard" onClick={close} badge={isVerifiedAgency ? { text: "Verified", color: "emerald" } : undefined} />
                    <MobileMenuLink href="/dashboard#listings" icon={<ListIcon />} label="My Listings" onClick={close} />
                    <MobileMenuLink href="/dashboard#leads" icon={<DocIcon />} label="Leads" onClick={close} />
                    <MobileMenuLink href="/dashboard#visits" icon={<CalendarIcon />} label="Visits" onClick={close} />
                    <MobileMenuLink href="/profile?tab=settings" icon={<SettingsIcon />} label="Settings" onClick={close} />
                  </>
                )}

                {isAdmin && (
                  <>
                    <MobileMenuLink href="/admin" icon={<GridIcon />} label="Admin Panel" onClick={close} badge={{ text: "Admin", color: "emerald" }} />
                  </>
                )}

                <hr className="border-[var(--brand-border)]" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full h-12 px-4 rounded-xl text-base font-semibold text-[var(--brand-error)] hover:bg-red-50"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileMenuLink({
  href,
  icon,
  label,
  onClick,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: { text: string; color: "emerald" | "amber" };
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 h-12 px-4 rounded-xl text-base font-semibold text-[var(--brand-text)] hover:bg-stone-50 hover:text-[var(--brand-primary)]"
      onClick={onClick}
    >
      {icon}
      {label}
      {badge && (
        <span className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
          badge.color === "emerald"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        }`}>
          {badge.text}
        </span>
      )}
    </Link>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}