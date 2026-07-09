'use strict';

/**
 * SEO Report Service - Persistence layer for analytics reports.
 *
 * This service handles:
 *   - create / update reports
 *   - retrieve reports by property
 *   - retrieve reports by agency (for dashboard list)
 *   - delete reports (if needed)
 *   - basic error handling for corrupted data
 *
 * It uses the supabase Admin client for direct DB access.
 * All writes must happen in server actions / API routes with proper auth.
 */

import { supabaseAdmin } from "@/lib/supabase-admin";
import type { SeoReportOutput } from "@/seo-agent/report/types";
import type { SeoReport } from "@/app/types";

/**
 * Insert or update a SEO report for a property.
 *
 * @param params - The report data to store
 * @param params.propertyId - UUID of the property
 * @param params.report - The report output from the SEO engine
 * @param params.analyzerVersion - The SEO agent version
 * @returns The stored report
 */
export async function upsertReport(params: {
  propertyId: string;
  report: SeoReportOutput;
  analyzerVersion: string;
}): Promise<SeoReport> {
  const { propertyId, report, analyzerVersion } = params;

  const { data, error } = await supabaseAdmin
    .from("seo_reports")
    .upsert(
      {
        property_id: propertyId,
        overall_score: report.overallScore,
        overall_grade: report.scoreGrade,
        report_json: report,
        analyzer_version: analyzerVersion,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "property_id" }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SeoReport;
}

/**
 * Retrieve a SEO report by property ID.
 *
 * @param propertyId - UUID of the property
 * @returns The stored report or null if none exists
 */
export async function getReportByPropertyId(
  propertyId: string
): Promise<SeoReport | null> {
  const { data, error } = await supabaseAdmin
    .from("seo_reports")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as SeoReport) ?? null;
}

/**
 * Get all reports for an agency's properties (for dashboard view).
 *
 * @param agencyId - UUID of the agency
 * @returns Array of reports with property metadata
 */
export async function getReportsByAgency(
  agencyId: string
): Promise<SeoReport[]> {
  // First get the property IDs for this agency
  const { data: properties, error: propError } = await supabaseAdmin
    .from("properties")
    .select("id")
    .eq("agency_id", agencyId);

  if (propError || !properties || properties.length === 0) {
    return [];
  }

  const propertyIds = properties.map((p: { id: string }) => p.id);

  const { data: reports, error } = await supabaseAdmin
    .from("seo_reports")
    .select("*")
    .in("property_id", propertyIds)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (reports as SeoReport[]) ?? [];
}

/**
 * Check if a report exists for a property.
 *
 * @param propertyId - UUID of the property
 * @returns Boolean
 */
export async function hasReport(propertyId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("seo_reports")
    .select("id")
    .eq("property_id", propertyId)
    .limit(1)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

/**
 * Delete a report for a property (used for cleanup/testing).
 *
 * @param propertyId - UUID of the property
 */
export async function deleteReport(propertyId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("seo_reports")
    .delete()
    .eq("property_id", propertyId);

  if (error) {
    throw error;
  }
}