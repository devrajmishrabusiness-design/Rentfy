/**
 * SEO Analyze API route.
 *
 * Receives a Rentfy property payload, validates it, delegates to the
 * SEO integration adapter, and returns a structured JSON report.
 *
 * Status code policy:
 *   - 200: successful analysis
 *   - 400: malformed body or missing required fields
 *   - 405: non-POST request (Next.js handles this automatically via
 *     the explicit POST export; other methods return 405)
 *   - 500: unexpected engine failure (adapter already returns a
 *     structured failure for known validation errors, so this only
 *     fires for truly unexpected exceptions)
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzePropertySeo } from "@/lib/seo/adapter";

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

  return NextResponse.json(
    {
      report: result.report,
      runId: result.runId,
    },
    { status: 200 }
  );
}
