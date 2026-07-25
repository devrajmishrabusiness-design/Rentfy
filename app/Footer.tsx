import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-[var(--brand-border)] bg-white" role="contentinfo">
      <div className="container-app py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex" aria-label="RenterEasy home">
              <Logo />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-7 text-[var(--brand-muted)]">
              RenterEasy is a premium rental marketplace connecting tenants
              with verified agencies in Noida and NCR. Discover homes you can
              trust.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--brand-text)]">
              Explore
            </h4>
            <ul className="space-y-3 text-sm text-[var(--brand-muted)]">
              <li>
                <Link
                  href="/"
                  className="transition hover:text-[var(--brand-primary)]"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/rent/noida"
                  className="transition hover:text-[var(--brand-primary)]"
                >
                  Rentals in Noida
                </Link>
              </li>
              <li>
                <Link
                  href="/login/agency"
                  className="transition hover:text-[var(--brand-primary)]"
                >
                  Agency login
                </Link>
              </li>
              <li>
                <Link
                  href="/signup/agency"
                  className="transition hover:text-[var(--brand-primary)]"
                >
                  List your agency
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--brand-text)]">
              Support
            </h4>
            <ul className="space-y-3 text-sm text-[var(--brand-muted)]">
              <li>
                <Link
                  href="/support"
                  className="transition hover:text-[var(--brand-primary)]"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition hover:text-[var(--brand-primary)]"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@rentereasy.in"
                  className="transition hover:text-[var(--brand-primary)]"
                >
                  support@rentereasy.in
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--brand-text)]">
              Legal
            </h4>
            <ul className="space-y-3 text-sm text-[var(--brand-muted)]">
              <li>
                <Link
                  href="/privacy"
                  className="transition hover:text-[var(--brand-primary)]"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition hover:text-[var(--brand-primary)]"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--brand-border)] pt-6 text-xs text-[var(--brand-muted)] md:flex-row">
          <p>© {year} RenterEasy. All rights reserved.</p>
          <p>Built with care for verified rental experiences.</p>
        </div>
      </div>
    </footer>
  );
}
