"use client";

/**
 * FavoriteButton
 *
 * Heart toggle for property cards. Click → if renter is signed in,
 * toggles via RLS. If not, queues a `pendingAction` and opens the
 * renter auth dialog. After successful sign-in, the
 * RenterSessionProvider dispatches RENTER_PENDING_EVENT, which we
 * listen for to re-fire the toggle.
 */

import { useEffect } from "react";
import { useFavorites } from "./useFavorites";
import { RENTER_PENDING_EVENT } from "./useRenterSession";
import { setPendingAction } from "./pendingAction";

type Props = {
  propertyId: string;
  className?: string;
  /** Optional label for screen readers. */
  label?: string;
};

export default function FavoriteButton({
  propertyId,
  className,
  label = "Toggle favorite",
}: Props) {
  const { isFavorite, toggle, loading } = useFavorites();

  // Re-fire the toggle after successful renter sign-in if this button
  // was the one that triggered it.
  useEffect(() => {
    const onPending = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { kind: string; propertyId: string; next: "add" | "remove" }
        | undefined;
      if (!detail) return;
      if (detail.kind !== "favorite") return;
      if (detail.propertyId !== propertyId) return;
      // Re-fire the toggle. Since the user just signed in, the toggle
      // will go through the RLS path.
      void toggle(detail.propertyId);
    };
    window.addEventListener(RENTER_PENDING_EVENT, onPending);
    return () => window.removeEventListener(RENTER_PENDING_EVENT, onPending);
  }, [propertyId, toggle]);

  const fav = isFavorite(propertyId);

  const handleClick = async () => {
    // If we're about to flip to "add" but no session, set a pending
    // action so we re-fire on success.
    if (!fav) {
      setPendingAction({ kind: "favorite", propertyId, next: "add" });
    }
    await toggle(propertyId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={label}
      aria-pressed={fav}
      className={
        className ??
        "grid h-10 w-10 place-items-center rounded-full border border-[var(--brand-border)] bg-white text-[var(--brand-text)] shadow-sm transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] disabled:opacity-60"
      }
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={fav ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={fav ? "text-rose-500" : ""}
        aria-hidden
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    </button>
  );
}
