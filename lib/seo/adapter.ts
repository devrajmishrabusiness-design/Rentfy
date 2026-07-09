/**
 * SEO Integration Adapter
 *
 * Bridges Rentfy `Property` data and the framework-agnostic SEO Engine.
 *
 * Responsibilities (orchestration only — no analyzer logic):
 *   - Translate Rentfy `Property` rows into the SEO Engine's `PageSignals`
 *   - Run the analyzer phase across all registered analyzers
 *   - Run the report phase to aggregate analyzer outputs
 *   - Return the final `SeoReportOutput` to the caller
 *
 * Non-responsibilities:
 *   - Knowing anything about HTTP, Next.js route handlers, or Supabase
 *   - Knowing the rules used by any individual analyzer
 *   - Storing or persisting reports
 *
 * The adapter depends only on:
 *   - `seo-agent` for the engine, plugins, and report types
 *   - the `Property` type from the host project
 *
 * It is the single integration point between Rentfy domain types and
 * the SEO Engine contract.
 */

import type {
  EngineRunResult,
  PageSignals,
  PluginOutput,
  SeoCheckResult,
  SeoEngine,
  SeoPlugin,
  SeoReportOutput,
} from "../../seo-agent";
import {
  SeoEngine as DefaultSeoEngine,
  createImagePlugin,
  createKeywordPlugin,
  createMetaDescriptionPlugin,
  createReportPlugin,
  createSchemaPlugin,
  createTitlePlugin,
  createUrlPlugin,
  createHeadingPlugin,
} from "../../seo-agent";
import type { Property } from "../../app/types";

/**
 * The minimal subset of `Property` fields the adapter needs.
 *
 * Accepting a structural shape (rather than the concrete `Property`
 * type) keeps the adapter testable without mocking Supabase rows and
 * lets callers pass partially populated inputs.
 */
export interface PropertyForSeo {
  id: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  cover_image_url?: string | null;
  city?: string | null;
  location?: string | null;
  property_type?: string | null;
  rent?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqft?: number | null;
}

/**
 * Result returned by the adapter. The HTTP layer (or any other
 * caller) decides how to surface this — the adapter stays a pure
 * orchestrator.
 */
export interface SeoIntegrationResult {
  ok: boolean;
  report?: SeoReportOutput;
  /** Stable, engine-generated run id (also present in `report.metadata.runId`). */
  runId?: string;
  /** Engine-supplied error when `ok = false`. */
  error?: { message: string; pluginId?: string; phase?: string };
}

/**
 * Dependencies the adapter accepts for injection. Production code uses
 * the defaults; tests can substitute a stub engine.
 */
export interface SeoAdapterDeps {
  engine: SeoEngine;
}

const emptyProperty: PropertyForSeo = Object.freeze({ id: "" }) as PropertyForSeo;

function toImageMetadata(property: PropertyForSeo): Array<{ src: string; alt?: string; isHero?: boolean }> | undefined {
  const images: Array<{ src: string; alt?: string; isHero?: boolean }> = [];
  if (property.cover_image_url) {
    images.push({ src: property.cover_image_url, isHero: true });
  }
  if (property.image_url && property.image_url !== property.cover_image_url) {
    images.push({ src: property.image_url });
  }
  return images.length > 0 ? images : undefined;
}

/**
 * Build the URL slug the URL Analyzer expects. The host project stores
 * locality in `location`; we compose a canonical slug in the same
 * shape used elsewhere in the codebase (`/rent/{city}/{locality}`).
 */
function buildUrlSlug(property: PropertyForSeo): string | undefined {
  if (!property.city) return undefined;
  const locality = property.location?.trim();
  const base = locality
    ? `/rent/${slugify(property.city)}/${slugify(locality)}`
    : `/rent/${slugify(property.city)}`;
  return base;
}

/**
 * Local slugify matching the SEO Engine's URL Analyzer expectations
 * (lowercase, hyphen-separated, alphanumerics only). Kept local to
 * avoid importing the engine's utility into the host-typed layer.
 */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildHeadings(property: PropertyForSeo): Array<{ level: number; text: string }> | undefined {
  if (!property.title) return undefined;
  return [{ level: 1, text: property.title }];
}

/**
 * Translate a Rentfy `Property` into the SEO Engine's `PageSignals`
 * contract. Pure function — does not mutate the input.
 */
export function propertyToPageSignals(property: PropertyForSeo): PageSignals {
  const title = property.title ?? undefined;
  const description = property.description ?? undefined;
  const images = toImageMetadata(property);
  const slug = buildUrlSlug(property);
  const headings = buildHeadings(property);

  return {
    title,
    titleLength: title?.length,
    metaDescription: description,
    metaDescriptionLength: description?.length,
    canonical: slug,
    headings,
    content: description,
    wordCount: description ? description.split(/\s+/).filter(Boolean).length : undefined,
    images,
  };
}

function isPropertyForSeo(value: unknown): value is PropertyForSeo {
  if (!value || typeof value !== "object") return false;
  const id = (value as { id?: unknown }).id;
  return typeof id === "string" && id.length > 0;
}

/**
 * Validate the input shape. Returns an error message string on
 * failure, `null` on success. The adapter never throws on validation
 * — it returns a structured failure result so the API layer can
 * surface a 400 without try/catch.
 */
export function validatePropertyInput(input: unknown): string | null {
  if (input === null || input === undefined) {
    return "Request body is required.";
  }
  if (typeof input !== "object") {
    return "Request body must be a JSON object.";
  }
  if (!isPropertyForSeo(input)) {
    return "Property `id` is required and must be a non-empty string.";
  }
  return null;
}

function buildAnalyzerCheckResults(
  outputs: Record<string, PluginOutput<unknown>>
): SeoCheckResult[] {
  const checks: SeoCheckResult[] = [];
  for (const output of Object.values(outputs)) {
    if (output.kind === "issues") {
      checks.push(output.value as SeoCheckResult);
    }
  }
  return checks;
}

function buildExecutionInfo(
  outputs: Record<string, PluginOutput<unknown>>,
  skipped: ReadonlyArray<{ pluginId: string; reason: string }>
): Array<{
  checkId: string;
  status: "success" | "failed" | "timeout" | "skipped" | "disabled";
  errorMessage?: string;
}> {
  const info: Array<{
    checkId: string;
    status: "success" | "failed" | "timeout" | "skipped" | "disabled";
    errorMessage?: string;
  }> = [];
  for (const [pluginId, output] of Object.entries(outputs)) {
    info.push({ checkId: pluginId, status: "success" });
    void output;
  }
  for (const entry of skipped) {
    info.push({
      checkId: entry.pluginId,
      status: "skipped",
      errorMessage: entry.reason,
    });
  }
  return info;
}

/**
 * Run a fully-configured `SeoEngine` across the analyzer and report
 * phases for the given property. Returns a structured result — the
 * adapter never throws.
 */
async function runAnalysis(
  engine: SeoEngine,
  payload: PageSignals,
  propertyId: string
): Promise<{ analyzerResult: EngineRunResult<unknown>; report: SeoReportOutput }> {
  const analyzerResult = await engine.run({
    capability: "analyzer",
    payload,
  });

  const checks = buildAnalyzerCheckResults(analyzerResult.outputs);
  const executionInfo = buildExecutionInfo(
    analyzerResult.outputs,
    analyzerResult.skipped
  );

  const reportResult = await engine.run({
    capability: "report",
    payload: {
      propertyId,
      checks,
      executionInfo,
    },
  });

  if (!reportResult.ok || !reportResult.outputs["report.generator"]) {
    throw new Error(
      reportResult.error?.message ?? "Report plugin did not produce a result."
    );
  }

  const reportOutput = reportResult.outputs["report.generator"];
  if (reportOutput.kind !== "artifact") {
    throw new Error("Report plugin produced an unexpected output kind.");
  }

  return {
    analyzerResult,
    report: reportOutput.value as SeoReportOutput,
  };
}

/**
 * Build the default engine with the seven analyzers + report plugin
 * registered. The adapter owns this construction so callers do not
 * need to know the plugin list.
 */
export function createDefaultEngine(): SeoEngine {
  const engine = new DefaultSeoEngine();
  const targetKeywords: string[] = [];
  const city = undefined;
  const propertyType = undefined;
  const locality = undefined;

  engine.use(
    createTitlePlugin({ targetKeywords }),
    createMetaDescriptionPlugin({
      city,
      propertyType,
      targetKeywords,
    }),
    createUrlPlugin({ city, locality, propertyType }),
    createHeadingPlugin({ city, locality, propertyType, targetKeywords }),
    createImagePlugin(),
    createSchemaPlugin(),
    createKeywordPlugin({ primaryKeyword: "" })
  );
  engine.use(createReportPlugin());
  return engine;
}

/**
 * Convert a fully-populated `Property` row from the host project into
 * the adapter input shape. Exists for API route convenience; the
 * adapter accepts any `PropertyForSeo` so it can be unit-tested
 * without Supabase.
 */
export function propertyRowToSeoInput(property: Property): PropertyForSeo {
  return {
    id: property.id,
    title: property.title,
    description: property.description,
    image_url: property.image_url,
    cover_image_url: property.cover_image_url,
    city: property.city,
    location: property.location,
    property_type: property.property_type,
    rent: property.rent,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area_sqft: property.area_sqft,
  };
}

/**
 * Run the SEO analysis for a Rentfy property.
 *
 * This is the single entry point the API route (or any other caller)
 * uses. It:
 *   1. Validates the input shape
 *   2. Maps it to `PageSignals`
 *   3. Runs the analyzer + report phases
 *   4. Returns a structured `SeoIntegrationResult`
 *
 * Never throws — failures are surfaced as `{ ok: false, error: ... }`.
 */
export async function analyzePropertySeo(
  input: unknown,
  deps: Partial<SeoAdapterDeps> = {}
): Promise<SeoIntegrationResult> {
  const validationError = validatePropertyInput(input);
  if (validationError) {
    return { ok: false, error: { message: validationError } };
  }

  const property = input as PropertyForSeo;
  const engine = deps.engine ?? createDefaultEngine();
  const payload = propertyToPageSignals(property);

  try {
    const { analyzerResult, report } = await runAnalysis(
      engine,
      payload,
      property.id
    );

    return {
      ok: true,
      report,
      runId: analyzerResult.runId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      runId: undefined,
      error: { message: `SEO analysis failed: ${message}` },
    };
  }
}

/**
 * Pluggable entry point for tests that want to swap the engine. Kept
 * exported so future routes (e.g. a batch endpoint) can share the
 * construction logic.
 */
export type { SeoPlugin };
export { emptyProperty };
