/**
 * SEO Analyze API route.
 *
 * Receives a Rentfy property payload, validates it, delegates to the
 * SEO integration adapter, and returns a structured JSON report.
 *
 * Requires authentication. If a valid propertyId is provided, the
 * report is persisted to the database.
 *
 * Status code policy:
 *   - 200: successful analysis
 *   - 201: successful analysis with report persisted
 *   - 400: malformed body or missing required fields
 *   - 401: not authenticated
 *   - 405: non-POST request
 *   - 500: unexpected engine failure
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { analyzePropertySeo } from "@/lib/seo/adapter";
import { upsertReport } from "@/lib/seo/report-service";
import { DefaultStructuredLogger, ConsoleLogTransport } from "@rentfy/engine-sdk";
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit";

const logger = new DefaultStructuredLogger({
  source: "api/seo/analyze",
  transports: [new ConsoleLogTransport()],
});

const ANALYZER_VERSION = "0.1.0-core";

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
      { error: "Only verified agencies can run SEO analysis." },
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

  const result = await analyzePropertySeo(body);

  if (!result.ok) {
    const status = result.error?.message?.includes("required")
      ? 400
      : 500;
    return NextResponse.json(
      {
        error: result.error?.message ?? "SEO analysis failed.",
      },
      { status }
    );
  }

  const report = result.report;
  const runId = result.runId;

  if (!report) {
    return NextResponse.json(
      { report, runId },
      { status: 200 }
    );
  }

  const propertyId = typeof body === "object" && body !== null
    ? (body as Record<string, unknown>).propertyId
    : undefined;

  let persisted = false;

  if (propertyId && typeof propertyId === "string" && propertyId.length > 0) {
    try {
      await upsertReport({
        propertyId,
        report,
        analyzerVersion: ANALYZER_VERSION,
      });
      persisted = true;
    } catch (error) {
      logger.error("Failed to persist SEO report", { error: String(error) });
    }
  }

  const status = persisted ? 201 : 200;

  return NextResponse.json(
    {
      report,
      runId,
      persisted,
    },
    { status }
  );
}