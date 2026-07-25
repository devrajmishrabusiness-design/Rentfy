/**
 * Shared authentication & authorization helpers.
 *
 * Every helper optionally accepts a Supabase client so the caller
 * can reuse a single client across auth checks + data queries.
 * When no client is provided the helper creates one internally.
 *
 * Agency accounts use agency_profiles table.
 * Renter accounts use renter_profiles table.
 * These are completely isolated — a user can NEVER have both.
 */

import { createClient } from "@/lib/supabase-server";
import { cache } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Reusable result type for server actions. */
export type ActionResult = { ok: true } | { ok: false; error: string };

export type RequireUserResult =
  | { ok: true; user: User; supabase: SupabaseClient }
  | { ok: false; error: string; status: number };

export type RequireVerifiedAgencyResult =
  | { ok: true; user: User; agencyId: string; supabase: SupabaseClient }
  | { ok: false; error: string; status: number };

export type RequireRenterResult =
  | { ok: true; user: User; renterId: string; supabase: SupabaseClient }
  | { ok: false; error: string; status: number };

// ---------------------------------------------------------------------------
// requireUser
// ---------------------------------------------------------------------------

export const requireUser = cache(async function requireUser(
  existingClient?: SupabaseClient,
): Promise<RequireUserResult> {
  const supabase = existingClient ?? (await createClient());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authenticated.", status: 401 };

  if (!user.email_confirmed_at) {
    return {
      ok: false,
      error: "Email not verified. Please confirm your email first.",
      status: 403,
    };
  }

  return { ok: true, user, supabase };
});

// ---------------------------------------------------------------------------
// requireVerifiedAgency
// ---------------------------------------------------------------------------

export const requireVerifiedAgency = cache(async function requireVerifiedAgency(
  existingClient?: SupabaseClient,
): Promise<RequireVerifiedAgencyResult> {
  const userResult = await requireUser(existingClient);
  if (!userResult.ok) return userResult;

  const { data: agency } = await userResult.supabase
    .from("agency_profiles")
    .select("id, verified")
    .eq("auth_user_id", userResult.user.id)
    .single();

  if (!agency) return { ok: false, error: "Agency not found.", status: 404 };
  if (!agency.verified) {
    return { ok: false, error: "Agency not verified yet.", status: 403 };
  }

  return { ok: true, user: userResult.user, agencyId: agency.id, supabase: userResult.supabase };
});

// ---------------------------------------------------------------------------
// requireRenter
// ---------------------------------------------------------------------------

export const requireRenter = cache(async function requireRenter(
  existingClient?: SupabaseClient,
): Promise<RequireRenterResult> {
  const userResult = await requireUser(existingClient);
  if (!userResult.ok) return userResult;

  const { data: renterProfile } = await userResult.supabase
    .from("renter_profiles")
    .select("id")
    .eq("user_id", userResult.user.id)
    .single();

  if (!renterProfile) {
    return { ok: false, error: "Renter profile not found.", status: 404 };
  }

  return { ok: true, user: userResult.user, renterId: renterProfile.id, supabase: userResult.supabase };
});

// ---------------------------------------------------------------------------
// requirePropertyOwnership
// ---------------------------------------------------------------------------

export async function requirePropertyOwnership(
  propertyId: string,
  agencyId: string,
  existingClient?: SupabaseClient,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const supabase = existingClient ?? (await createClient());

  const { data: property, error } = await supabase
    .from("properties")
    .select("agency_profile_id")
    .eq("id", propertyId)
    .maybeSingle<{ agency_profile_id: string }>();

  if (error || !property) {
    return { ok: false, error: "Property not found.", status: 404 };
  }

  if (property.agency_profile_id !== agencyId) {
    return { ok: false, error: "You do not own this property.", status: 403 };
  }

  return { ok: true };
}