/**
 * /api/renters/profile
 *
 * Fallback server route. The primary path for creating a renter_profiles
 * row is the client (RLS INSERT policy: auth.uid() = user_id). This route
 * exists only for the case where the client insert fails and the user
 * is stuck authenticated-but-no-profile. The route is service-role,
 * so it can write any renter_profiles row — but it verifies the JWT
 * came from the same user before doing so, by reading the auth cookie
 * via the SSR Supabase client.
 *
 * Body: { full_name?: string | null; phone_number?: string }
 * Profile values default to the metadata saved during renter sign-up.
 *   - user_id comes from the JWT (auth.uid()), not the body.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { DefaultStructuredLogger, ConsoleLogTransport } from "@rentfy/engine-sdk";

const logger = new DefaultStructuredLogger({
  source: "api/renters/profile",
  transports: [new ConsoleLogTransport()],
});

type Body = { full_name?: string | null; phone_number?: string };

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, RateLimitPresets.light);
  if (limit.blocked) return limit.response;

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    // Empty body is OK; we may just be ensuring the row exists.
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  const admin = getSupabaseAdmin();
  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(
    user.id
  );

  if (authError || !authUser?.user) {
    return NextResponse.json(
      { error: "Could not resolve auth user." },
      { status: 500 }
    );
  }

  // Fallback route: creates/updates a renter_profile row for any
  // verified user. The dual-capability architecture allows a single auth
  // user to hold both a renter_profile and an agency row, so we no
  // longer gate on user_metadata.role.

  const metadataPhone = authUser.user.user_metadata?.phone_number;
  const phone =
    typeof body.phone_number === "string" && body.phone_number.trim()
      ? body.phone_number.trim()
      : typeof metadataPhone === "string"
        ? metadataPhone.trim()
        : "";
  if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    return NextResponse.json({ error: "A valid contact number is required." }, { status: 400 });
  }

  // Upsert by user_id (UNIQUE). full_name is provided by the body or
  // left as null.
  const fullName =
    typeof body.full_name === "string" && body.full_name.trim().length > 0
      ? body.full_name.trim()
      : typeof authUser.user.user_metadata?.full_name === "string"
        ? authUser.user.user_metadata.full_name.trim()
        : null;

  const { data, error } = await admin
    .from("renter_profiles")
    .upsert(
      {
        user_id: user.id,
        phone_number: phone,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) {
    logger.error("Profile upsert error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to save profile." },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile: data });
}
