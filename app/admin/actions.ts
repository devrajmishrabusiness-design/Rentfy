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
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ActionResult = { ok: true } | { ok: false; error: string };
type RequireAdminResult = { ok: true; userId: string } | { ok: false; error: string };

async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not signed in." };

  // Read the caller's agency row through the service-role client so that
  // an admin can still be located even if their own RLS policy would mask it.
  const { data: agencyRow } = await supabaseAdmin
    .from("agencies")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!agencyRow?.is_admin) {
    return { ok: false, error: "You don't have admin access." };
  }

  return { ok: true, userId: user.id };
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
