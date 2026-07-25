"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface RentPaginationProps {
  totalPages: number;
  currentPage: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function RentPagination({ totalPages, currentPage, hasPrev, hasNext }: RentPaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const baseParams = new URLSearchParams(searchParams.toString());

  const createPageLink = (page: number) => {
    const params = new URLSearchParams(baseParams.toString());
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    return params.toString();
  };

  const pagesToShow: (number | "ellipsis")[] = [];
  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);

  let start = Math.max(1, currentPage - half);
  const end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= start && i <= end)) {
      pagesToShow.push(i);
    } else if (
      (i === start - 1 && start > 2) ||
      (i === end + 1 && end < totalPages - 1)
    ) {
      if (pagesToShow[pagesToShow.length - 1] !== "ellipsis") {
        pagesToShow.push("ellipsis");
      }
    }
  }

  return (
    <nav
      className="flex items-center justify-center gap-2"
      aria-label="Property listings pagination"
    >
      {hasPrev && (
        <Link
          href={`?${createPageLink(currentPage - 1)}`}
          className="btn-secondary"
          aria-label="Previous page"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </Link>
      )}

      <div className="flex items-center gap-1" role="navigation" aria-label="Page numbers">
        {pagesToShow.map((page, index) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-2 text-[var(--brand-muted)]" aria-hidden="true">
              …
            </span>
          ) : (
            <Link
              key={page}
              href={`?${createPageLink(page)}`}
              className={`btn-secondary px-3 py-2 min-w-[40px] ${page === currentPage ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white" : ""}`}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </Link>
          )
        )}
      </div>

      {hasNext && (
        <Link
          href={`?${createPageLink(currentPage + 1)}`}
          className="btn-secondary"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      )}
    </nav>
  );
}