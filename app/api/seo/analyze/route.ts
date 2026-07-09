/**
 * SEO Analyze API route.
 *
 * Receives a Rentfy property payload, validates it, delegates to the
 * SEO integration adapter, and returns a structured JSON report.
 *
 * If a valid propertyId is provided, the report is persisted to the database.
 *
 * Status code policy:
 *   - 200: successful analysis
 *   - 201: successful analysis with report persisted
 *   - 400: malformed body or missing required fields
 *   - 405: non-POST request
 *   - 500: unexpected engine failure
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzePropertySeo } from "@/lib/seo/adapter";
import { upsertReport } from "@/lib/seo/report-service";

const ANALYZER_VERSION = "0.1.0-core";

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
      console.error("Failed to persist SEO report:", error);
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