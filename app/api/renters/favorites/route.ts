/**
 * /api/renters/favorites
 *
 * GET — list the current renter's favorite property IDs.
 *   RLS-only. Service role is not used. RLS filters to own rows.
 *
 * POST — add a favorite.
 *   Body: { property_id: string }
 *   RLS INSERT. The renter_id is derived from renter_profiles by
 *   looking up the JWT's user_id; we never trust the client to set
 *   renter_id.
 *
 * DELETE — remove a favorite.
 *   Body or query: { property_id: string }
 *   RLS DELETE.
 *
 * Anon callers (no session) get 401. The client-side useFavorites hook
 * handles the "no session" case by opening the renter auth dialog before
 * attempting any of this, so 401 here means something genuinely wrong.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type PostBody = { property_id?: string };

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("renter_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Renter profile not found." },
      { status: 404 }
    );
  }

  const { data, error } = await supabase
    .from("renter_favorites")
    .select("property_id, created_at")
    .eq("renter_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ favorites: data });
}

export async function POST(request: Request) {
  let body: PostBody = {};
  try {
    body = (await request.json()) as PostBody;
  } catch {
    // fall through
  }
  const propertyId = body.property_id;
  if (!propertyId || typeof propertyId !== "string") {
    return NextResponse.json(
      { error: "property_id is required." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("renter_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Renter profile not found." },
      { status: 404 }
    );
  }

  // RLS INSERT. renter_id is derived from the JWT, not the body.
  const { error } = await supabase
    .from("renter_favorites")
    .insert({ renter_id: profile.id, property_id: propertyId });

  if (error) {
    // 23505 = unique_violation. Idempotent: if the row already exists,
    // treat as success.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const propertyId =
    url.searchParams.get("property_id") ??
    (await request.json().catch(() => ({}))).property_id;

  if (!propertyId || typeof propertyId !== "string") {
    return NextResponse.json(
      { error: "property_id is required." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("renter_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Renter profile not found." },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("renter_favorites")
    .delete()
    .eq("renter_id", profile.id)
    .eq("property_id", propertyId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
