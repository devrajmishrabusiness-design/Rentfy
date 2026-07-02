import Link from "next/link";
import Logo from "./Logo";
import { createClient } from "@/lib/supabase-server";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isVerifiedAgency = false;
  if (user) {
    const { data: agencyRow } = await supabase
      .from("agencies")
      .select("verified")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    isVerifiedAgency = agencyRow?.verified === true;
  }

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Listings", href: "/#listings" },
    { label: "Why RenterEasy", href: "/#why" },
    { label: "Contact", href: "/#contact" },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--brand-border)] bg-white/85 shadow-sm backdrop-blur-md">
      <div className="container-app flex items-center justify-between py-3">
        <Logo />

        <div className="hidden items-center gap-8 text-sm font-semibold text-[var(--brand-muted)] md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-[var(--brand-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isVerifiedAgency ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-100"
            >
              <span className="grid h-2 w-2 place-items-center rounded-full bg-emerald-500" />
              Dashboard
              <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                Verified
              </span>
            </Link>
          ) : user ? (
            <Link
              href="/dashboard"
              className="rounded-xl border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-text)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="hidden rounded-xl border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-text)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] sm:inline-flex"
            >
              Dashboard
            </Link>
          )}
          {!user && (
            <Link
              href="/login"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/30"
            >
              Login / Signup
            </Link>
          )}
          {user && (
            <Link
              href="/login"
              className="rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--brand-muted)] transition-all duration-200 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            >
              Switch account
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
