/**
 * GET /api/health
 *
 * Returns application health status suitable for uptime monitoring
 * (Vercel, UptimeRobot, etc.). Does NOT expose secrets, service-role
 * keys, or database contents.
 *
 * Checks:
 *   - Supabase Anon API connectivity (light SELECT)
 *   - Required environment variables are present
 *
 * Status codes:
 *   - 200: healthy
 *   - 503: unhealthy (Supabase unreachable or env missing)
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { readAll } from "@/lib/metrics";

export async function GET() {
  const version =
    process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";

  const checks: Record<string, "ok" | "fail"> = {};

  // Check 1: environment variables present
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  checks.env_supabase_url = supabaseUrl ? "ok" : "fail";
  checks.env_supabase_anon_key = supabaseAnonKey ? "ok" : "fail";

  // Check 2: Supabase connectivity — lightweight read-only SELECT
  let supabaseOk: "ok" | "fail" = "fail";
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .limit(1);

    supabaseOk = error ? "fail" : "ok";
  } catch {
    supabaseOk = "fail";
  }
  checks.supabase_connectivity = supabaseOk;

  const isHealthy = Object.values(checks).every((v) => v === "ok");

  // Load current metrics to include in the response.
  const metrics = readAll();

  return NextResponse.json(
    {
      ok: isHealthy,
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version,
      environment: process.env.NODE_ENV ?? "development",
      checks,
      metrics,
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}