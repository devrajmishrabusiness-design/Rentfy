"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { useRenterSession } from "./renter/useRenterSession";

interface ProfileDropdownProps {
  userName: string;
  userInitial: string;
  isRenter: boolean;
  isAgency: boolean;
  isVerifiedAgency: boolean;
}

export default function ProfileDropdown({
  userName,
  userInitial,
  isRenter,
  isAgency,
  isVerifiedAgency,
}: ProfileDropdownProps) {
  void userName;
  void userInitial;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { profile: renterProfile } = useRenterSession();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const getInitials = () => {
    if (isRenter && renterProfile?.full_name) {
      return renterProfile.full_name.charAt(0).toUpperCase();
    }
    if (isAgency) {
      return "A";
    }
    return "U";
  };

  const getDisplayName = () => {
    if (isRenter && renterProfile?.full_name) {
      return renterProfile.full_name.split(" ")[0];
    }
    if (isAgency) {
      return "Agency";
    }
    return "User";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--brand-border)] bg-white text-[var(--brand-text)] transition hover:border-[var(--brand-primary)] hover:bg-[var(--brand-background)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-sm font-semibold">
          {getInitials()}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-2xl border border-[var(--brand-border)] bg-white py-2 shadow-lg animate-fade-in-up">
          <div className="px-3 py-2 border-b border-[var(--brand-border)]">
            <p className="text-sm font-semibold text-[var(--brand-text)]">
              {getDisplayName()}
            </p>
            {isRenter && renterProfile?.full_name && (
              <p className="text-xs text-[var(--brand-muted)] truncate">
                {renterProfile.full_name}
              </p>
            )}
            {isAgency && isVerifiedAgency && (
              <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Verified Agency
              </span>
            )}
          </div>

          <nav className="py-1">
            {isRenter && (
              <>
                <Link
                  href="/renter"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--brand-text)] hover:bg-[var(--brand-background)]"
                  onClick={() => setIsOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile
                </Link>
                <Link
                  href="/renter?tab=favorites"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--brand-text)] hover:bg-[var(--brand-background)]"
                  onClick={() => setIsOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  Shortlisted Properties
                </Link>
                <Link
                  href="/renter?tab=settings"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--brand-text)] hover:bg-[var(--brand-background)]"
                  onClick={() => setIsOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </Link>
              </>
            )}

            {isAgency && (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--brand-text)] hover:bg-[var(--brand-background)]"
                  onClick={() => setIsOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile
                </Link>
                <Link
                  href="/profile?tab=account"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--brand-text)] hover:bg-[var(--brand-background)]"
                  onClick={() => setIsOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8" />
                    <path d="M12 17v4" />
                  </svg>
                  Account
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--brand-text)] hover:bg-[var(--brand-background)]"
                  onClick={() => setIsOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                  My Listings
                </Link>
                <Link
                  href="/dashboard#leads"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--brand-text)] hover:bg-[var(--brand-background)]"
                  onClick={() => setIsOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  Leads
                </Link>
              </>
            )}

            <hr className="my-1 border-[var(--brand-border)]" />

            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--brand-text)] hover:bg-[var(--brand-background)]"
              onClick={() => setIsOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--brand-error)] hover:bg-[var(--brand-background)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}