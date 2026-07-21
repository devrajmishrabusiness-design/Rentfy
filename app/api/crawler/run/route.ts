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
import { runCrawl } from "@/lib/crawler/adapter";
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { REQUEST_ID_HEADER, createRequestLogger, generateRequestId } from "@/lib/observability";
import { DefaultStructuredLogger, ConsoleLogTransport } from "@rentfy/engine-sdk";
import { requireVerifiedAgency } from "@/lib/auth";

const logger = new DefaultStructuredLogger({
  source: "api/crawler/run",
  transports: [new ConsoleLogTransport()],
});

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, RateLimitPresets.strict);
  if (limit.blocked) return limit.response;

  const auth = await requireVerifiedAgency();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();
  const rlog = createRequestLogger(logger, {
    requestId,
    method: request.method,
    path: "/api/crawler/run",
    userId: auth.user.id,
    agencyId: auth.agencyId,
    renterId: null,
  });

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
    rlog.warn("Crawl failed", {
      error: result.error?.message ?? "unknown",
    });
    return NextResponse.json(
      { error: "Crawl failed. Please check the URL and try again." },
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