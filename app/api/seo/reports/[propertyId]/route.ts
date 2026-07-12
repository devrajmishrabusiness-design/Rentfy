/**
 * SEO Report Retrieve API route.
 *
 * GET /api/seo/reports/:propertyId - Retrieve a stored SEO report
 *
 * Requires authentication. Returns the stored report without re-running
 * analysis.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getReportByPropertyId } from "@/lib/seo/report-service";
import { DefaultStructuredLogger, ConsoleLogTransport } from "@rentfy/engine-sdk";
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit";

const logger = new DefaultStructuredLogger({
  source: "api/seo/reports",
  transports: [new ConsoleLogTransport()],
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const limit = await rateLimit(request, RateLimitPresets.standard);
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
      { error: "Only verified agencies can view SEO reports." },
      { status: 403 }
    );
  }

  const { propertyId } = await params;

  if (!propertyId) {
    return NextResponse.json(
      { error: "Property ID is required." },
      { status: 400 }
    );
  }

  try {
    const report = await getReportByPropertyId(propertyId);

    if (!report) {
      return NextResponse.json(
        { error: "No SEO report found for this property." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        report: report.report_json,
        analyzerVersion: report.analyzer_version,
        lastAnalyzed: report.updated_at,
        score: report.overall_score,
        grade: report.overall_grade,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Failed to retrieve SEO report", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to retrieve SEO report." },
      { status: 500 }
    );
  }
}