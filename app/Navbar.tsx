import Link from "next/link";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import RenterNavButton from "./renter/RenterNavButton";
import ProfileDropdown from "./ProfileDropdown";
import { requireUser } from "@/lib/auth";

export default async function Navbar() {
  const userResult = await requireUser();
  if (!userResult.ok) {
    return (
      <nav className="border-b border-[var(--brand-border)] bg-white">
        <div className="container-app flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="RenterEasy home">
            <Logo className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-[var(--brand-primary)] hover:underline">
              Login
            </Link>
            <Link href="/signup" className="btn-primary">
              Sign up
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

  if (user) {
    const [{ data: agencyRow }, { data: renterRow }] = await Promise.all([
      supabase.from("agencies").select("id, verified, agency_name").eq("auth_user_id", user.id).maybeSingle(),
      supabase.from("renter_profiles").select("id, full_name").eq("user_id", user.id).maybeSingle(),
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
          <MobileMenu navItems={navItems} />

          {/* Agency features — show whenever the user has an agencies row,
              regardless of whether they also have a renter profile. */}
          {isAgency && (
            <>
              {isVerifiedAgency ? (
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
                  className="rounded-xl border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-text)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] hidden sm:flex"
                >
                  Dashboard
                </Link>
              )}
            </>
          )}

          {/* Profile dropdown — capability-based: shows renter and/or
              agency links depending on which profile rows exist. */}
          {isRenter || isAgency ? (
            <ProfileDropdown
              userName={""}
              userInitial={""}
              isRenter={isRenter}
              isAgency={isAgency}
              isVerifiedAgency={isVerifiedAgency}
            />
          ) : (
            <RenterNavButton />
          )}

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