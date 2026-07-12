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
import { createClient } from "@/lib/supabase-server";

type ActionResult = { ok: true } | { ok: false; error: string };

async function getVerifiedAgency(): Promise<
  { ok: true; agencyId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not signed in." };

  const { data: agency } = await supabase
    .from("agencies")
    .select("id, verified")
    .eq("auth_user_id", user.id)
    .single();

  if (!agency) return { ok: false, error: "Agency not found." };
  if (!agency.verified) return { ok: false, error: "Agency not verified yet." };

  return { ok: true, agencyId: agency.id };
}

export async function deleteOwnProperty(propertyId: string): Promise<ActionResult> {
  const auth = await getVerifiedAgency();
  if (!auth.ok) return auth;

  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("agency_id")
    .eq("id", propertyId)
    .single();

  if (!property || property.agency_id !== auth.agencyId) {
    return { ok: false, error: "You do not own this property." };
  }

  const { error } = await supabase
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
  const auth = await getVerifiedAgency();
  if (!auth.ok) return auth;

  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("agency_id")
    .eq("id", leadId)
    .single();

  if (!lead || lead.agency_id !== auth.agencyId) {
    return { ok: false, error: "You do not own this lead." };
  }

  const { error } = await supabase
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
  const auth = await getVerifiedAgency();
  if (!auth.ok) return auth;

  if (auth.agencyId !== agencyId) {
    return { ok: false, error: "You do not own this agency profile." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("agencies")
    .update(updates)
    .eq("id", agencyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  return { ok: true };
}