import Link from "next/link";

export default function Navbar() {
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Listings", href: "/#listings" },
    { label: "About", href: "/#about" },
    { label: "Contact", href: "/#contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label="Rentfy home"
        >
          <span className="grid h-10 w-10 place-items-center rounded bg-slate-950 text-lg font-bold text-white shadow-sm">
            R
          </span>
          <span>
            <span className="block text-xl font-bold tracking-normal text-slate-950">
              Rentfy
            </span>
            <span className="hidden text-xs font-medium text-slate-500 sm:block">
              Verified rentals in Noida & NCR
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className="hidden rounded border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:inline-flex"
          >
            Dashboard
          </Link>
          <Link
            href="/login"
            className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Login / Signup
          </Link>
        </div>
      </div>
    </nav>
  );
}
