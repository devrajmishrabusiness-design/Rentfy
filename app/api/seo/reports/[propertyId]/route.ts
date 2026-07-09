/**
 * SEO Report Retrieve API route.
 *
 * GET /api/seo/reports/:propertyId - Retrieve a stored SEO report
 *
 * Returns the stored report without re-running analysis.
 */

import { NextRequest, NextResponse } from "next/server";
import { getReportByPropertyId } from "@/lib/seo/report-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
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
    console.error("Failed to retrieve SEO report:", error);
    return NextResponse.json(
      { error: "Failed to retrieve SEO report." },
      { status: 500 }
    );
  }
}