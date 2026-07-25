"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { useRenterSession } from "./renter/useRenterSession";
import { RenterMenuItems, AgencyMenuItems } from "./nav/ProfileMenuItems";

interface ProfileDropdownProps {
  isRenter: boolean;
  isAgency: boolean;
  isVerifiedAgency: boolean;
  agencyName?: string;
}

export default function ProfileDropdown({
  isRenter,
  isAgency,
  isVerifiedAgency,
  agencyName,
}: ProfileDropdownProps) {
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  const getInitials = () => {
    if (isRenter && renterProfile?.full_name) {
      return renterProfile.full_name.charAt(0).toUpperCase();
    }
    if (isAgency) {
      return agencyName?.charAt(0).toUpperCase() || "A";
    }
    return "U";
  };

  const getDisplayName = () => {
    if (isRenter && renterProfile?.full_name) {
      return renterProfile.full_name.split(" ")[0];
    }
    if (isAgency) {
      return agencyName || "Agency";
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
            {isAgency && agencyName && (
              <p className="text-xs text-[var(--brand-muted)] truncate">
                {agencyName}
              </p>
            )}
            {isVerifiedAgency && (
              <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Verified Agency
              </span>
            )}
          </div>

          <nav className="py-1">
            {isRenter && !isAgency && (
              <RenterMenuItems closeMenu={() => setIsOpen(false)} onSignOut={handleSignOut} />
            )}
            {isAgency && !isRenter && (
              <AgencyMenuItems closeMenu={() => setIsOpen(false)} onSignOut={handleSignOut} />
            )}
            {!isRenter && !isAgency && (
              <>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--brand-error)] hover:bg-[var(--brand-background)]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}