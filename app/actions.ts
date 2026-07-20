"use server";

import { revalidatePath } from "next/cache";
import {
  requireUser,
  requireVerifiedAgency,
  requirePropertyOwnership,
  type ActionResult,
} from "@/lib/auth";

/**
 * Complete agency onboarding for the currently authenticated user.
 *
 * Called from /onboarding/agency AFTER the user has verified their email
 * and has a real session. The authenticated user's id (auth.uid()) is
 * the only source of identity; the client cannot influence which agency
 * row is created.
 *
 * Writes go through `auth.supabase` (the user's JWT client), so RLS
 * is the security boundary. Migration 0009 grants the INSERT policy
 * `WITH CHECK (auth.uid() = auth_user_id)`.
 *
 * Refuses if the user already has an agency profile — onboarding is a
 * one-shot flow. Refuses if the email is not yet confirmed.
 */
export async function completeAgencyOnboarding(params: {
  agency_name: string;
  owner_name: string;
  phone: string;
  city: string;
}): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  if (!auth.user.email_confirmed_at) {
    return {
      ok: false,
      error: "Please verify your email before completing onboarding.",
    };
  }

  const agencyName = params.agency_name?.trim() ?? "";
  const ownerName = params.owner_name?.trim() ?? "";
  const phone = params.phone?.trim() ?? "";
  const city = params.city?.trim() ?? "";

  if (agencyName.length < 2 || agencyName.length > 120) {
    return { ok: false, error: "Agency name must be 2–120 characters." };
  }
  if (ownerName.length < 2 || ownerName.length > 120) {
    return { ok: false, error: "Owner name must be 2–120 characters." };
  }
  if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    return { ok: false, error: "Please enter a valid contact number." };
  }
  if (city.length < 2 || city.length > 80) {
    return { ok: false, error: "City must be 2–80 characters." };
  }

  // Idempotency: if the user already has an agency row, treat as success.
  const { data: existing } = await auth.supabase
    .from("agencies")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle<{ id: string }>();

  if (existing) {
    return { ok: true };
  }

  const email = auth.user.email ?? "";

  const { error } = await auth.supabase.from("agencies").insert({
    auth_user_id: auth.user.id,
    agency_name: agencyName,
    owner_name: ownerName,
    email,
    phone,
    city,
    verified: false,
  });

  if (error) {
    // 23505 = unique_violation. A racing second tab could trigger this.
    if (error.code === "23505") {
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteOwnProperty(propertyId: string): Promise<ActionResult> {
  const auth = await requireVerifiedAgency();
  if (!auth.ok) return auth;

  const ownership = await requirePropertyOwnership(propertyId, auth.agencyId, auth.supabase);
  if (!ownership.ok) return ownership;

  const { error } = await auth.supabase
    .from("properties")
    .delete()
    .eq("id", propertyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateLeadStatus(
  leadId: string,
  status: string
): Promise<ActionResult> {
  const auth = await requireVerifiedAgency();
  if (!auth.ok) return auth;

  const { data: lead } = await auth.supabase
    .from("leads")
    .select("agency_id")
    .eq("id", leadId)
    .single();

  if (!lead || lead.agency_id !== auth.agencyId) {
    return { ok: false, error: "You do not own this lead." };
  }

  const { error } = await auth.supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateAgencyProfile(
  agencyId: string,
  updates: {
    agency_name?: string;
    owner_name?: string;
    phone?: string;
    city?: string;
  }
): Promise<ActionResult> {
  const auth = await requireVerifiedAgency();
  if (!auth.ok) return auth;

  if (auth.agencyId !== agencyId) {
    return { ok: false, error: "You do not own this agency profile." };
  }

  const { error } = await auth.supabase
    .from("agencies")
    .update(updates)
    .eq("id", agencyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  return { ok: true };
}
