"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRenterSession } from "./renter/useRenterSession";
import { supabase } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BrowseIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FavoriteIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function LoginIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

/**
 * PDD v1.1 – Mobile Bottom Navigation
 *
 * Role-aware tabs:
 *   Visitor → Home · Browse · Login · Menu
 *   Renter  → Home · Browse · Favorites · Profile
 *   Agency  → Home · Browse · Dashboard · Profile
 */
export default function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/property/")) {
    return null;
  }
  const { profile, isRenter: isRenterSession, isLoading } = useRenterSession();

  const isAuthenticated = !!profile;
  const isRenter = isRenterSession;

  const navItems: NavItem[] = isAuthenticated
    ? [
        {
          href: "/",
          label: "Home",
          icon: <HomeIcon active={false} />,
          activeIcon: <HomeIcon active />,
        },
        {
          href: "/rent",
          label: "Browse",
          icon: <BrowseIcon active={false} />,
          activeIcon: <BrowseIcon active />,
        },
        {
          href: "/renter?tab=favorites",
          label: "Favorites",
          icon: <FavoriteIcon active={false} />,
          activeIcon: <FavoriteIcon active />,
        },
        {
          href: "/profile",
          label: "Profile",
          icon: <ProfileIcon active={false} />,
          activeIcon: <ProfileIcon active />,
        },
      ]
    : [
        {
          href: "/",
          label: "Home",
          icon: <HomeIcon active={false} />,
          activeIcon: <HomeIcon active />,
        },
        {
          href: "/rent",
          label: "Browse",
          icon: <BrowseIcon active={false} />,
          activeIcon: <BrowseIcon active />,
        },
        {
          href: "/login/renter",
          label: "Login",
          icon: <LoginIcon active={false} />,
          activeIcon: <LoginIcon active />,
        },
        {
          href: "/signup/renter",
          label: "Sign Up",
          icon: <ProfileIcon active={false} />,
          activeIcon: <ProfileIcon active />,
        },
      ];

  if (isLoading) {
    return (
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--brand-border)] bg-white/95 backdrop-blur-sm md:hidden safe-bottom"
        role="navigation"
        aria-label="Primary navigation"
      >
        <div className="flex h-16 items-center justify-around">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-10 w-12 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--brand-border)] bg-white/95 backdrop-blur-sm md:hidden safe-bottom"
      role="navigation"
      aria-label="Primary navigation"
    >
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href.split("?")[0]));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-2 transition-colors"
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              <span className={`transition-colors ${isActive ? "text-[var(--brand-primary)]" : "text-[var(--brand-muted)]"}`} aria-hidden="true">
                {isActive ? item.activeIcon : item.icon}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "text-[var(--brand-primary)]"
                    : "text-[var(--brand-muted)]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}