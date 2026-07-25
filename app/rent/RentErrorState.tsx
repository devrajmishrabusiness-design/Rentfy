"use client";

interface RentErrorStateProps {
  error?: string;
  onRetry?: () => void;
}

export default function RentErrorState({ error, onRetry }: RentErrorStateProps) {
  return (
    <div className="container-app py-20">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--brand-text)]">Failed to load properties</h2>
        <p className="mt-2 text-sm text-[var(--brand-muted)]">
          {error || "Something went wrong while loading listings. Please try again."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn-primary mt-6"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}