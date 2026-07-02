/**
 * Service-role Supabase client.
 *
 * SERVER-ONLY. Never import this from a Client Component or any file with
 * a "use client" directive — it would leak the service-role key to the
 * browser bundle.
 *
 * Use this only for admin-only server routes (e.g. `app/admin/page.tsx`).
 * It bypasses Row Level Security, so every row is visible. Treat the
 * calling code as if it had full database access.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for admin client. See README.md → Making yourself an admin."
    );
  }

  _admin = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _admin;
}

// Back-compat named export used by existing call sites.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getSupabaseAdmin(), prop);
  },
});
