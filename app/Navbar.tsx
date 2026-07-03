import Link from "next/link";
import Logo from "./Logo";
import { createClient } from "@/lib/supabase-server";
import MobileMenu from "./MobileMenu";
import RenterNavButton from "./renter/RenterNavButton";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isVerifiedAgency = false;
  let isAgency = false;
  let isRenter = false;
  if (user) {
    const [{ data: agencyRow }, { data: renterRow }] = await Promise.all([
      supabase.from("agencies").select("id, verified").eq("auth_user_id", user.id).maybeSingle(),
      supabase.from("renter_profiles").select("id").eq("user_id", user.id).maybeSingle(),
    ]);
    isAgency = Boolean(agencyRow);
    isVerifiedAgency = agencyRow?.verified === true;
    isRenter = Boolean(renterRow);
  }

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Listings", href: "/#listings" },
    { label: "Why RenterEasy", href: "/#why" },
    { label: "Contact", href: "/#contact" },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--brand-border)] bg-white/85 shadow-sm backdrop-blur-md">
      <div className="container-app relative flex items-center justify-between py-3">
        <div className="flex items-center gap-4">
          <MobileMenu navItems={navItems} />
          <Logo />
        </div>

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
          {isRenter ? (
            <RenterNavButton />
          ) : isVerifiedAgency ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm font-semibold text-[var(--brand-primary)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-100"
            >
              <span className="grid h-2 w-2 place-items-center rounded-full bg-emerald-500" />
              Dashboard
              <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                Verified
              </span>
            </Link>
          ) : isAgency ? (
            <Link
              href="/dashboard"
              className="rounded-xl border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-text)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            >
              Dashboard
            </Link>
          ) : null}
          {!isRenter && !isAgency && <RenterNavButton />}
          {!user && (
            <Link
              href="/login"
              className="hidden rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--brand-text)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] lg:inline-flex"
            >
              Agency login
            </Link>
          )}
          {user && isAgency && (
            <Link
              href="/login"
              className="rounded-xl border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-muted)] transition-all duration-200 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            >
              Switch account
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
