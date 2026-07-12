/**
 * Crawler Run API Route
 *
 * POST /api/crawler/run
 *
 * Starts a breadth-first crawl from the provided URL.
 * Requires authentication. Returns discovered pages, site map, and
 * aggregate statistics.
 *
 * Status code policy:
 *   - 200: successful crawl
 *   - 400: malformed JSON or missing/invalid `url` field
 *   - 401: not authenticated
 *   - 403: not a verified agency
 *   - 405: non-POST request
 *   - 500: unexpected crawler failure
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { runCrawl } from "@/lib/crawler/adapter";
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, RateLimitPresets.strict);
  if (limit.blocked) return limit.response;

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

  const { data: agency } = await supabase
    .from("agencies")
    .select("id, verified")
    .eq("auth_user_id", user.id)
    .single();

  if (!agency || !agency.verified) {
    return NextResponse.json(
      { error: "Only verified agencies can run crawls." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const result = await runCrawl(body);

  if (!result.ok) {
    const status = result.error?.message?.includes("required")
      ? 400
      : 500;
    return NextResponse.json(
      { error: result.error?.message ?? "Crawl failed." },
      { status }
    );
  }

  const crawl = result.result;
  if (!crawl) {
    return NextResponse.json(
      { error: "Crawl completed but produced no result." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      startUrl: crawl.startUrl,
      engine: crawl.engine,
      pages: crawl.pages,
      siteMap: crawl.siteMap,
      stats: crawl.stats,
    },
    { status: 200 }
  );
}