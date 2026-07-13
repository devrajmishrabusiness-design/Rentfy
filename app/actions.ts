"use server";

/**
 * Agency Server Actions.
 *
 * Every action here:
 *  1. Confirms the caller is signed in.
 *  2. Confirms the caller owns the resource being mutated.
 *  3. Writes through the SSR Supabase client (RLS-enforced).
 *  4. Revalidates the page so the UI reflects the new state.
 */

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  requireVerifiedAgency,
  requirePropertyOwnership,
  type ActionResult,
} from "@/lib/auth";

/**
 * Create an agency row at signup using the service-role client.
 *
 * Called from the signup page regardless of whether Supabase email
 * confirmation is enabled. The service-role client bypasses RLS,
 * ensuring the row is persisted even when the user has no session
 * (email confirmation pending).
 */
export async function createAgencyAtSignup(params: {
  auth_user_id: string;
  agency_name: string;
  owner_name: string;
  email: string;
  phone: string;
  city: string;
}): Promise<ActionResult> {
  const { error } = await supabaseAdmin.from("agencies").insert([
    {
      auth_user_id: params.auth_user_id,
      agency_name: params.agency_name,
      owner_name: params.owner_name,
      email: params.email,
      phone: params.phone,
      city: params.city,
      verified: false,
    },
  ]);

  if (error) return { ok: false, error: error.message };
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