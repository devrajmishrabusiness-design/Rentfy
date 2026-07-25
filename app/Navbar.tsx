import Link from "next/link";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import ProfileDropdown from "./ProfileDropdown";
import DesktopNavLinks from "./nav/DesktopNavLinks";
import { requireUser } from "@/lib/auth";

const PUBLIC_LINKS = [
  { label: "Home", href: "/" },
  { label: "Browse Rentals", href: "/rent" },
  { label: "Popular Areas", href: "/#areas" },
  { label: "For Agencies", href: "/#agencies" },
  { label: "Contact", href: "/#contact" },
];

export default async function Navbar() {
  const userResult = await requireUser();

  if (!userResult.ok) {
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

  const user = userResult.user;
  const supabase = userResult.supabase;

  let isVerifiedAgency = false;
  let isAgency = false;
  let isRenter = false;
  let isAdmin = false;
  let agencyName: string | undefined;

  const [{ data: agencyRow }, { data: renterRow }] = await Promise.all([
    supabase.from("agency_profiles").select("id, verified, is_admin, agency_name").eq("auth_user_id", user.id).maybeSingle(),
    supabase.from("renter_profiles").select("id, full_name").eq("user_id", user.id).maybeSingle(),
  ]);

  isAgency = Boolean(agencyRow);
  isVerifiedAgency = agencyRow?.verified === true;
  isAdmin = agencyRow?.is_admin === true;
  isRenter = Boolean(renterRow);
  agencyName = agencyRow?.agency_name ?? undefined;

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