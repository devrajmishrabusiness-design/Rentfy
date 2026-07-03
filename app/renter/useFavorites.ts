"use client";

/**
 * useFavorites
 *
 * RLS-only favorites API. All reads and writes go through the browser
 * Supabase client; Row Level Security on `renter_favorites` ensures a
 * renter can only see/toggle their own rows.
 *
 * Anonymous users (no Supabase session) get an empty list and any
 * `toggle()` call opens the renter auth dialog. We do NOT throw — the
 * UI relies on `isFavorite` returning false for anon.
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useRenterSession } from "./useRenterSession";
import { setPendingAction } from "./pendingAction";

export function useFavorites() {
  const { session, isRenter, openAuthDialog, profile } = useRenterSession();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Hydrate the set whenever the renter session changes.
  useEffect(() => {
    if (!session?.user?.id || !isRenter) {
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("renter_favorites")
        .select("property_id")
        .eq("renter_id", profile?.id ?? "");
      if (cancelled) return;
      if (!error && data) {
        setFavoriteIds(new Set(data.map((r) => r.property_id)));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, isRenter, profile?.id]);

  const isFavorite = useCallback(
    (propertyId: string) => isRenter && favoriteIds.has(propertyId),
    [favoriteIds, isRenter]
  );

  const toggle = useCallback(
    async (propertyId: string) => {
      if (!session?.user?.id) {
        // Queue a favorite add and prompt for OTP.
        setPendingAction({ kind: "favorite", propertyId, next: "add" });
        await openAuthDialog("favorite");
        return;
      }
      if (!isRenter || !profile?.id) {
        // Session exists but no profile yet. Same UX.
        setPendingAction({ kind: "favorite", propertyId, next: "add" });
        await openAuthDialog("favorite");
        return;
      }

      const isFav = favoriteIds.has(propertyId);
      // Optimistic update.
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(propertyId);
        else next.add(propertyId);
        return next;
      });

      if (isFav) {
        const { error } = await supabase
          .from("renter_favorites")
          .delete()
          .eq("renter_id", profile.id)
          .eq("property_id", propertyId);
        if (error) {
          // Roll back.
          setFavoriteIds((prev) => new Set(prev).add(propertyId));
        }
      } else {
        const { error } = await supabase
          .from("renter_favorites")
          .insert({ renter_id: profile.id, property_id: propertyId });
        if (error) {
          // Roll back.
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(propertyId);
            return next;
          });
        }
      }
    },
    [session?.user?.id, isRenter, profile, favoriteIds, openAuthDialog]
  );

  return { favoriteIds, isFavorite, toggle, loading };
}
