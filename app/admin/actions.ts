"use server";

/**
 * Admin-only Server Actions.
 *
 * Every action here:
 *  1. Confirms the caller is signed in.
 *  2. Confirms the caller's agency row has `is_admin = true`.
 *  3. Writes through `supabaseAdmin` (service role) so RLS can't block us.
 *  4. Revalidates the affected page so the UI reflects the new state.
 */

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireUser, type ActionResult } from "@/lib/auth";

type RequireAdminResult = { ok: true; userId: string } | { ok: false; error: string };

async function requireAdmin(): Promise<RequireAdminResult> {
  const userResult = await requireUser();
  if (!userResult.ok) return { ok: false, error: userResult.error };

  const { data: agencyRow } = await supabaseAdmin
    .from("agencies")
    .select("is_admin")
    .eq("auth_user_id", userResult.user.id)
    .maybeSingle();

  if (!agencyRow?.is_admin) {
    return { ok: false, error: "You don't have admin access." };
  }

  return { ok: true, userId: userResult.user.id };
}

export async function verifyAgency(agencyId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const { error } = await supabaseAdmin
    .from("agencies")
    .update({ verified: true })
    .eq("id", agencyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

export async function unverifyAgency(agencyId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const { error } = await supabaseAdmin
    .from("agencies")
    .update({ verified: false })
    .eq("id", agencyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

export async function deletePropertyAdmin(
  propertyId: string,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const { error } = await supabaseAdmin
    .from("properties")
    .delete()
    .eq("id", propertyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

export async function approveProperty(propertyId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const { error } = await supabaseAdmin
    .from("properties")
    .update({ status: "approved" })
    .eq("id", propertyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

export async function rejectProperty(propertyId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const { error } = await supabaseAdmin
    .from("properties")
    .update({ status: "rejected" })
    .eq("id", propertyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteAgency(agencyId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const { error } = await supabaseAdmin
    .from("agencies")
    .delete()
    .eq("id", agencyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}
