/**
 * Crawler Run API Route
 *
 * POST /api/crawler/run
 *
 * Starts a breadth-first crawl from the provided URL.
 * Returns discovered pages, site map, and aggregate statistics.
 *
 * Status code policy:
 *   - 200: successful crawl
 *   - 400: malformed JSON or missing/invalid `url` field
 *   - 405: non-POST request
 *   - 500: unexpected crawler failure
 */

import { NextRequest, NextResponse } from "next/server";
import { runCrawl } from "@/lib/crawler/adapter";

export async function POST(request: NextRequest) {
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