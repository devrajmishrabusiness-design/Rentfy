"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import ProfileDropdown from "./ProfileDropdown";
import DesktopNavLinks from "./nav/DesktopNavLinks";
import { supabase } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

const PUBLIC_LINKS = [
  { label: "Home", href: "/" },
  { label: "Browse Rentals", href: "/rent" },
  { label: "Popular Areas", href: "/#areas" },
  { label: "For Agencies", href: "/#agencies" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isAgency, setIsAgency] = useState(false);
  const [isVerifiedAgency, setIsVerifiedAgency] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRenter, setIsRenter] = useState(false);
  const [agencyName, setAgencyName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;

      const currentUser = data.user;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const [{ data: agencyRow }, { data: renterRow }] = await Promise.all([
        supabase.from("agency_profiles").select("id, verified, is_admin, agency_name").eq("auth_user_id", currentUser.id).maybeSingle(),
        supabase.from("renter_profiles").select("id").eq("user_id", currentUser.id).maybeSingle(),
      ]);

      if (cancelled) return;

      setIsAgency(Boolean(agencyRow));
      setIsVerifiedAgency(agencyRow?.verified === true);
      setIsAdmin(agencyRow?.is_admin === true);
      setIsRenter(Boolean(renterRow));
      setAgencyName(agencyRow?.agency_name ?? undefined);
      setLoading(false);
    }

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <nav className="sticky top-0 z-40 border-b border-[var(--brand-border)] bg-white/85 shadow-sm backdrop-blur-md" role="navigation" aria-label="Main navigation">
        <div className="container-app flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center" aria-label="RenterEasy home">
              <Logo />
            </Link>
          </div>
          <DesktopNavLinks />
        </div>
      </nav>
    );
  }

  if (!user) {
    return (
      <nav className="sticky top-0 z-40 border-b border-[var(--brand-border)] bg-white/85 shadow-sm backdrop-blur-md" role="navigation" aria-label="Main navigation">
        <div className="container-app flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center" aria-label="RenterEasy home">
              <Logo />
            </Link>
          </div>

          <DesktopNavLinks />

          <div className="flex items-center gap-2 sm:gap-3">
            <MobileMenu
              navItems={PUBLIC_LINKS}
              isRenter={false}
              isAgency={false}
              isVerifiedAgency={false}
              isAdmin={false}
            />
            <Link href="/login/renter" className="text-sm font-semibold text-[var(--brand-primary)] hover:underline hidden sm:inline-flex">
              Renter Login
            </Link>
            <Link href="/signup/renter" className="btn-secondary hidden sm:inline-flex">
              Renter Sign Up
            </Link>
            <Link href="/login/agency" className="text-sm font-semibold text-[var(--brand-primary)] hover:underline hidden sm:inline-flex">
              Agency Login
            </Link>
            <Link href="/signup/agency" className="btn-primary hidden sm:inline-flex">
              Agency Sign Up
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--brand-border)] bg-white/85 shadow-sm backdrop-blur-md" role="navigation" aria-label="Main navigation">
      <div className="container-app flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center" aria-label="RenterEasy home">
            <Logo />
          </Link>
        </div>

        <DesktopNavLinks />

        <div className="flex items-center gap-2 sm:gap-3">
          <MobileMenu
            navItems={PUBLIC_LINKS}
            isRenter={isRenter}
            isAgency={isAgency}
            isVerifiedAgency={isVerifiedAgency}
            isAdmin={isAdmin}
          />

          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm font-semibold text-[var(--brand-primary)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-100 hidden sm:flex"
            >
              <span className="grid h-2 w-2 place-items-center rounded-full bg-emerald-500" />
              Admin Panel
              <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                Admin
              </span>
            </Link>
          )}

          {isAgency && !isAdmin && (
            isVerifiedAgency ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm font-semibold text-[var(--brand-primary)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-100 hidden sm:flex"
              >
                <span className="grid h-2 w-2 place-items-center rounded-full bg-emerald-500" />
                Dashboard
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                  Verified
                </span>
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--brand-text)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] hidden sm:flex"
              >
                Dashboard
                <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
                  Pending
                </span>
              </Link>
            )
          )}

          {(isRenter || isAgency || isAdmin) ? (
            <ProfileDropdown
              isRenter={isRenter}
              isAgency={isAgency}
              isVerifiedAgency={isVerifiedAgency}
              agencyName={agencyName}
            />
          ) : (
            <Link href="/login/renter" className="btn-primary py-2 text-sm hidden sm:inline-flex">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
