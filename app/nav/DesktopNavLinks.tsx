"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  label: string;
  href: string;
}

const PUBLIC_LINKS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Browse Rentals", href: "/rent" },
  { label: "Popular Areas", href: "/#areas" },
  { label: "For Agencies", href: "/#agencies" },
  { label: "Contact", href: "/#contact" },
];

export default function DesktopNavLinks() {
  const pathname = usePathname();

  return (
    <div className="hidden items-center gap-8 text-sm font-semibold text-[var(--brand-muted)] md:flex">
      {PUBLIC_LINKS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href.replace(/\/#.*$/, "")));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`transition-colors hover:text-[var(--brand-primary)] ${
              isActive ? "text-[var(--brand-primary)]" : ""
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}