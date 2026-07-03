"use client";

/**
 * RenterSessionProvider
 *
 * Single source of truth for the renter's auth state at runtime. Lives
 * at the layout level so every page can read it via `useRenterSession`.
 *
 * Responsibilities:
 *   1. Track the Supabase session (a renter is just a Supabase auth user
 *      with an email identity; the same JWT is used for agency auth).
 *   2. Hydrate the `renter_profiles` row for the current user, if any.
 *   3. Expose `openAuthDialog(intent)` to open the renter auth dialog with a
 *      given intent (`contact` | `favorite` | `general`).
 *   4. After successful sign-in, consume any pendingAction from
 *      localStorage and notify listeners via a custom event so the
 *      originating component re-fires its action.
 *
 * Design note: we deliberately do NOT separate the renter session from
 * the agency session at the Supabase layer. A renter logs in with phone
 * email/password, as does an agency. Both produce an
 * `auth.users` row and a JWT. The two domains are kept apart by table
 * separation (`renter_profiles` vs `agencies`) and RLS, not by separate
 * Supabase projects.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";
import type { RenterProfile } from "../types";
import { consumePendingAction, type PendingAction } from "./pendingAction";

export type AuthIntent = "contact" | "favorite" | "general";

type RenterContextValue = {
  /** True until the first session check has resolved. */
  isLoading: boolean;
  /** Current Supabase session, or null. Renter or agency. */
  session: Session | null;
  /** Whether the current user has a renter_profiles row. */
  isRenter: boolean;
  /** Hydrated renter profile, or null. */
  profile: RenterProfile | null;
  /** Open the renter email-auth dialog with a given intent. */
  openAuthDialog: (intent?: AuthIntent) => Promise<void>;
  /** True while the renter auth dialog is open. */
  isAuthOpen: boolean;
  /** Close the renter auth dialog. */
  closeAuthDialog: () => void;
  /** Notify that a profile just updated (e.g. full_name was set). */
  refreshProfile: (userId?: string) => Promise<void>;
};

const RenterContext = createContext<RenterContextValue | null>(null);

export function useRenterSession(): RenterContextValue {
  const ctx = useContext(RenterContext);
  if (!ctx) {
    throw new Error(
      "useRenterSession must be used within a RenterSessionProvider"
    );
  }
  return ctx;
}

type Props = {
  children: ReactNode;
};

/**
 * Custom event the provider fires after successful renter authentication when
 * there is a pending action to replay. Listeners (ContactAgencyButton,
 * FavoriteButton) attach a window-level handler to re-fire their
 * action. We use a custom event rather than React state because the
 * originating component may have unmounted during the OTP round trip.
 */
export const RENTER_PENDING_EVENT = "rentereasy:renter-pending-action";
export type RenterPendingEvent = CustomEvent<PendingAction>;

export function RenterSessionProvider({ children }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<RenterProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const authResolverRef = useRef<(() => void) | null>(null);

  // The client we read profile with. We keep a ref to avoid stale
  // closures inside the onAuthStateChange handler.
  const clientRef = useRef<SupabaseClient>(supabase);

  const fetchProfile = useCallback(
    async (userId: string): Promise<RenterProfile | null> => {
      const { data, error } = await clientRef.current
        .from("renter_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle<RenterProfile>();
      if (error) {
        // RLS hides rows that don't exist; treat any error as "no profile".
        return null;
      }
      return data ?? null;
    },
    []
  );

  const refreshProfile = useCallback(async (userId?: string) => {
    const resolvedUserId = userId ?? session?.user?.id;
    if (!resolvedUserId) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(resolvedUserId);
    setProfile(p);
  }, [session?.user?.id, fetchProfile]);

  // Returns a promise that resolves when the auth dialog closes.
  const openAuthDialog = useCallback((intent: AuthIntent = "general") => {
    void intent;
    setIsAuthOpen(true);
    return new Promise<void>((resolve) => {
      authResolverRef.current = resolve;
    });
  }, []);

  const closeAuthDialog = useCallback(() => {
    setIsAuthOpen(false);
    if (authResolverRef.current) {
      authResolverRef.current();
      authResolverRef.current = null;
    }
  }, []);

  // Auth state subscription.
  useEffect(() => {
    let mounted = true;

    clientRef.current.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = clientRef.current.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setProfile(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Whenever the session changes, hydrate the renter profile.
  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }
    let cancelled = false;
    fetchProfile(session.user.id).then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, fetchProfile]);

  // Replay only after onboarding has completed and the dialog has
  // closed. The auth session arrives before a first-time profile does.
  useEffect(() => {
    if (profile && !isAuthOpen) {
      const pending = consumePendingAction();
      if (pending) {
        // Defer one tick so consumers that mount on the same render
        // have a chance to attach their listener.
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent(RENTER_PENDING_EVENT, { detail: pending })
          );
        }, 0);
      }
    }
  }, [profile, isAuthOpen]);

  const value = useMemo<RenterContextValue>(
    () => ({
      isLoading,
      session,
      isRenter: !!profile,
      profile,
      openAuthDialog,
      isAuthOpen,
      closeAuthDialog,
      refreshProfile,
    }),
    [
      isLoading,
      session,
      profile,
      openAuthDialog,
      isAuthOpen,
      closeAuthDialog,
      refreshProfile,
    ]
  );

  return (
    <RenterContext.Provider value={value}>{children}</RenterContext.Provider>
  );
}
