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
import { analyzePropertySeo } from "@/lib/seo/adapter";
import { upsertReport } from "@/lib/seo/report-service";
import { DefaultStructuredLogger, ConsoleLogTransport } from "@rentfy/engine-sdk";
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { requireVerifiedAgency, requirePropertyOwnership } from "@/lib/auth";

const logger = new DefaultStructuredLogger({
  source: "api/seo/analyze",
  transports: [new ConsoleLogTransport()],
});

const ANALYZER_VERSION = "0.1.0-core";

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, RateLimitPresets.strict);
  if (limit.blocked) return limit.response;

  const auth = await requireVerifiedAgency();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const propertyId = typeof body === "object" && body !== null
    ? (body as Record<string, unknown>).propertyId
    : undefined;

  // If a propertyId is supplied and we are about to persist, verify the
  // calling agency owns that property before writing the report. This
  // prevents one verified agency from clobbering another agency's report
  // by guessing the propertyId.
  if (
    propertyId &&
    typeof propertyId === "string" &&
    propertyId.length > 0
  ) {
    const ownership = await requirePropertyOwnership(
      propertyId,
      auth.agencyId,
      auth.supabase
    );
    if (!ownership.ok) {
      return NextResponse.json(
        { error: ownership.error },
        { status: ownership.status }
      );
    }
  }

  const result = await analyzePropertySeo(body);

  if (!result.ok) {
    const status = result.error?.message?.includes("required")
      ? 400
      : 500;
    logger.warn("SEO analysis failed", {
      error: result.error?.message ?? "unknown",
    });
    return NextResponse.json(
      { error: "SEO analysis failed. Please check the property data and try again." },
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