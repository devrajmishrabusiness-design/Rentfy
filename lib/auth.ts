/**
 * Shared authentication & authorization helpers.
 *
 * Every helper optionally accepts a Supabase client so the caller
 * can reuse a single client across auth checks + data queries.
 * When no client is provided the helper creates one internally.
 */

import { createClient } from "@/lib/supabase-server";
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

// ---------------------------------------------------------------------------
// requireUser
// ---------------------------------------------------------------------------

/**
 * Confirm the caller is signed in AND has confirmed their email.
 *
 * Returns the `User` and the `SupabaseClient` so the caller can
 * reuse the same client for data queries without creating a second one.
 */
export async function requireUser(
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
}

// ---------------------------------------------------------------------------
// requireVerifiedAgency
// ---------------------------------------------------------------------------

/**
 * Confirm the caller is a verified agency.
 *
 * Calls `requireUser()` first, then looks up the agency row using
 * the same client. Returns `user`, `agencyId`, and `supabase`.
 */
export async function requireVerifiedAgency(
  existingClient?: SupabaseClient,
): Promise<RequireVerifiedAgencyResult> {
  const userResult = await requireUser(existingClient);
  if (!userResult.ok) return userResult;

  const { data: agency } = await userResult.supabase
    .from("agencies")
    .select("id, verified")
    .eq("auth_user_id", userResult.user.id)
    .single();

  if (!agency) return { ok: false, error: "Agency not found.", status: 404 };
  if (!agency.verified) {
    return { ok: false, error: "Agency not verified yet.", status: 403 };
  }

  return { ok: true, user: userResult.user, agencyId: agency.id, supabase: userResult.supabase };
}

// ---------------------------------------------------------------------------
// requirePropertyOwnership
// ---------------------------------------------------------------------------

/**
 * Verify the property exists and belongs to the given agency.
 *
 * Does NOT verify the agency itself — call `requireVerifiedAgency()`
 * first and pass its `supabase` client to avoid creating a new one.
 */
export async function requirePropertyOwnership(
  propertyId: string,
  agencyId: string,
  existingClient?: SupabaseClient,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const supabase = existingClient ?? (await createClient());

  const { data: property, error } = await supabase
    .from("properties")
    .select("agency_id")
    .eq("id", propertyId)
    .maybeSingle<{ agency_id: string }>();

  if (error || !property) {
    return { ok: false, error: "Property not found.", status: 404 };
  }

  if (property.agency_id !== agencyId) {
    return { ok: false, error: "You do not own this property.", status: 403 };
  }

  return { ok: true };
}