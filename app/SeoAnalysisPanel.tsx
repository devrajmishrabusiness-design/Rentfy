"use client";

import { useState } from "react";
import ErrorMessage from "./ErrorMessage";
import type { IssueCategory } from "../seo-agent/types";
import type { SeoReportOutput } from "../seo-agent/report/types";

/**
 * The shape of a problem reported by the SEO API:
 *   - { report, runId }   on success (HTTP 200)
 *   - { error }            on failure  (HTTP 4xx/5xx)
 *
 * `report` mirrors the engine's `SeoReportOutput` contract — see
 * `seo-agent/report/types.ts`. Kept as a local structural type so the
 * panel does not import server-only report types transitively.
 */
export interface SeoAnalyzeApiResponse {
  report?: SeoReportOutput;
  runId?: string;
  error?: string;
}

/**
 * Property form values the Add Property page hands to the panel. The
 * panel only reads them — it never mutates them.
 */
export interface SeoPanelPropertyInput {
  title?: string | null;
  description?: string | null;
  city?: string | null;
  location?: string | null;
  property_type?: string | null;
  rent?: string | number | null;
  bedrooms?: string | number | null;
  bathrooms?: string | number | null;
  image_url?: string | null;
  cover_image_url?: string | null;
}

type LoadState = "idle" | "loading" | "success" | "error";

/**
 * Generate a throwaway id for a property whose row has not been
 * inserted yet. The SEO adapter requires a non-empty `id` to run the
 * report phase (it's the report's `propertyId`); we synthesize a
 * client-side id at click time so we never need to wait for Supabase.
 */
const scratchId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `scratch-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Map the Add Property form payload into the contract the SEO analyzer
 * route expects (see `lib/seo/adapter.ts` → `PropertyForSeo`). Empty
 * strings → `undefined` so the engine sees those fields as missing
 * rather than as zero-length text.
 */
const buildPayload = (form: SeoPanelPropertyInput) => {
  const clean = (v: unknown): string | undefined => {
    if (typeof v === "string" && v.trim().length > 0) return v;
    return undefined;
  };
  return {
    id: scratchId(),
    title: clean(form.title),
    description: clean(form.description),
    city: clean(form.city),
    location: clean(form.location),
    property_type: clean(form.property_type),
    rent:
      typeof form.rent === "number"
        ? form.rent
        : typeof form.rent === "string" && form.rent.trim().length > 0
        ? Number(form.rent)
        : undefined,
    bedrooms:
      typeof form.bedrooms === "number"
        ? form.bedrooms
        : typeof form.bedrooms === "string" && form.bedrooms.trim().length > 0
        ? Number(form.bedrooms)
        : undefined,
    bathrooms:
      typeof form.bathrooms === "number"
        ? form.bathrooms
        : typeof form.bathrooms === "string" && form.bathrooms.trim().length > 0
        ? Number(form.bathrooms)
        : undefined,
    image_url: clean(form.image_url),
    cover_image_url: clean(form.cover_image_url),
  };
};

const GRADE_LABEL: Record<NonNullable<SeoReportOutput["scoreGrade"]>, string> = {
  excellent: "Excellent",
  good: "Good",
  "needs-improvement": "Needs improvement",
  poor: "Poor",
};

const GRADE_BADGE: Record<NonNullable<SeoReportOutput["scoreGrade"]>, string> = {
  excellent: "badge-success",
  good: "badge-info",
  "needs-improvement": "badge-warning",
  poor: "badge-error",
};

const CATEGORY_ORDER: IssueCategory[] = [
  "meta",
  "headings",
  "content",
  "keywords",
  "images",
  "structured-data",
  "links",
  "technical",
  "performance",
  "accessibility",
  "mobile",
];

const CATEGORY_LABEL: Record<IssueCategory, string> = {
  meta: "Meta tags",
  headings: "Headings",
  content: "Content",
  keywords: "Keywords",
  images: "Images",
  "structured-data": "Structured data",
  links: "Links",
  technical: "Technical",
  performance: "Performance",
  accessibility: "Accessibility",
  mobile: "Mobile",
};

const scoreColorClass = (score: number): string => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
};

const barColorClass = (score: number): string => {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
};

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
  success: "bg-emerald-500",
};

const IssueRow = ({
  issue,
}: {
  issue: SeoReportOutput["criticalIssues"][number];
}) => (
  <li className="flex gap-3 text-sm">
    <span
      aria-hidden
      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
        SEVERITY_DOT[issue.severity] ?? "bg-stone-400"
      }`}
    />
    <div className="min-w-0">
      <p className="font-semibold text-[var(--brand-text)]">{issue.title}</p>
      {issue.description && (
        <p className="mt-0.5 text-[var(--brand-muted)]">{issue.description}</p>
      )}
      {issue.recommendation && (
        <p className="mt-1 text-[var(--brand-muted)]">
          <span className="font-semibold text-[var(--brand-text)]">
            Fix:&nbsp;
          </span>
          {issue.recommendation}
        </p>
      )}
    </div>
  </li>
);

const ScoreBlock = ({
  label,
  score,
}: {
  label: string;
  score: number;
}) => (
  <div>
    <div className="flex items-baseline justify-between">
      <span className="text-sm font-semibold text-[var(--brand-text)]">
        {label}
      </span>
      <span className={`text-sm font-bold ${scoreColorClass(score)}`}>
        {Math.round(score)}
      </span>
    </div>
    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
      <div
        className={`h-full rounded-full ${barColorClass(score)}`}
        style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
      />
    </div>
  </div>
);

const NonIdealState = ({
  title,
  body,
}: {
  title: string;
  body: string;
}) => (
  <div className="rounded-2xl border border-dashed border-[var(--brand-border)] bg-stone-50 px-5 py-8 text-center">
    <p className="text-sm font-semibold text-[var(--brand-text)]">{title}</p>
    <p className="mt-1 text-xs text-[var(--brand-muted)]">{body}</p>
  </div>
);

export interface SeoAnalysisPanelProps {
  /** Live form values from the Add Property page (read-only). */
  property: SeoPanelPropertyInput;
  /** Whether the property form is considered minimally complete. */
  canAnalyze: boolean;
  /** Disabled reason surfaced as the button title / panel hint. */
  disabledReason?: string;
  /** Optional className applied to the outer <section>. */
  className?: string;
}

/**
 * Self-contained SEO analysis panel for the Add Property page.
 *
 * - Pure consumer of the form state; never mutates property fields.
 * - Calls `POST /api/seo/analyze` only on explicit user click.
 * - Never writes SEO reports back to the database.
 * - Renders a collapsible <details> summary plus the full report.
 */
export default function SeoAnalysisPanel({
  property,
  canAnalyze,
  disabledReason,
  className = "",
}: SeoAnalysisPanelProps) {
  const [state, setState] = useState<LoadState>("idle");
  const [report, setReport] = useState<SeoReportOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);

  const reset = () => {
    setReport(null);
    setErrorMsg(null);
    setAnalyzedAt(null);
  };

  const runAnalysis = async () => {
    if (!canAnalyze) return;
    setState("loading");
    setErrorMsg(null);

    const payload = buildPayload(property);

    try {
      const res = await fetch("/api/seo/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      let body: SeoAnalyzeApiResponse | null = null;
      try {
        body = (await res.json()) as SeoAnalyzeApiResponse;
      } catch {
        body = null;
      }

      if (!res.ok || !body) {
        const message =
          body?.error ??
          (res.status === 400
            ? "Property is missing required fields for SEO analysis."
            : "SEO analysis is unavailable right now. Please try again.");
        setErrorMsg(message);
        setState("error");
        return;
      }

      if (!body.report) {
        setErrorMsg("SEO analysis returned an empty report.");
        setState("error");
        return;
      }

      setReport(body.report);
      setAnalyzedAt(new Date().toLocaleString());
      setState("success");
    } catch (err) {
      const message =
        err instanceof Error
          ? `Unable to reach the SEO analyzer: ${err.message}`
          : "Unable to reach the SEO analyzer.";
      setErrorMsg(message);
      setState("error");
    }
  };

  const loading = state === "loading";
  const buttonLabel = loading
    ? "Analyzing…"
    : state === "success"
    ? "Analyze again"
    : "Analyze SEO";

  const buttonTitle = canAnalyze
    ? undefined
    : disabledReason ?? "Fill in the required property fields first";

  const counts = report
    ? {
        critical: report.criticalIssues.length,
        warnings: report.highIssues.length,
        recommendations: report.recommendations.length,
        passed: report.passedChecks,
        failed: report.failedChecks,
        total: report.totalChecks,
      }
    : null;

  const categoryScores: Partial<Record<IssueCategory, number>> =
    report?.categoryScores ?? {};
  const categoriesPresent = CATEGORY_ORDER.filter(
    (k) => typeof categoryScores[k] === "number"
  );

  return (
    <section className={`card p-6 ${className}`} aria-label="SEO analysis">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--brand-text)]">
            SEO analysis
          </h2>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">
            Preview the SEO quality of this listing before publishing. Nothing
            is saved until you publish.
          </p>
        </div>
        <button
          type="button"
          onClick={runAnalysis}
          disabled={!canAnalyze || loading}
          title={buttonTitle}
          className="btn-secondary disabled:cursor-not-allowed"
        >
          {buttonLabel}
        </button>
      </div>

      {/* Disabled hint — only when the form is incomplete */}
      {!canAnalyze && state === "idle" && (
        <p className="mt-3 text-xs text-[var(--brand-muted)]">
          {disabledReason ?? "Fill in title, description, city, and location to enable analysis."}
        </p>
      )}

      {/* Inline transient error */}
      {(state === "error" || (state === "loading" && errorMsg)) && errorMsg && (
        <div className="mt-4">
          <ErrorMessage message={errorMsg} />
        </div>
      )}

      {/* Loading skeleton */}
      {loading && state === "loading" && !errorMsg && (
        <div className="mt-5 animate-pulse space-y-3" aria-live="polite">
          <div className="h-3 w-2/3 rounded-full bg-stone-200" />
          <div className="h-3 w-1/2 rounded-full bg-stone-200" />
          <div className="h-3 w-3/4 rounded-full bg-stone-200" />
          <p className="pt-2 text-xs text-[var(--brand-muted)]">
            Running analyzers…
          </p>
        </div>
      )}

      {/* Result */}
      {state === "success" && report && counts && (
        <div className="mt-5 space-y-5">
          {/* Overall score + grade */}
          <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-stone-50 px-5 py-4">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-4xl font-extrabold ${scoreColorClass(
                  report.overallScore
                )}`}
              >
                {Math.round(report.overallScore)}
              </span>
              <span className="text-sm font-semibold text-[var(--brand-muted)]">
                / 100
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={GRADE_BADGE[report.scoreGrade]}>
                {GRADE_LABEL[report.scoreGrade]}
              </span>
              <span
                className={
                  report.passed ? "badge-success" : "badge-warning"
                }
              >
                {report.passed ? "Above threshold" : "Below threshold"}
              </span>
              <span className="badge-muted">
                Threshold: {report.passedThreshold}
              </span>
            </div>
            {analyzedAt && (
              <span className="ml-auto text-xs text-[var(--brand-muted)]">
                Analyzed {analyzedAt}
              </span>
            )}
          </div>

          {/* Counts row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--brand-border)] bg-white px-4 py-3">
              <p className="text-xs font-semibold text-[var(--brand-muted)]">
                Critical issues
              </p>
              <p
                className={`mt-1 text-2xl font-extrabold ${
                  counts.critical > 0 ? "text-red-600" : "text-stone-700"
                }`}
              >
                {counts.critical}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--brand-border)] bg-white px-4 py-3">
              <p className="text-xs font-semibold text-[var(--brand-muted)]">
                Warnings
              </p>
              <p
                className={`mt-1 text-2xl font-extrabold ${
                  counts.warnings > 0 ? "text-amber-600" : "text-stone-700"
                }`}
              >
                {counts.warnings}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--brand-border)] bg-white px-4 py-3">
              <p className="text-xs font-semibold text-[var(--brand-muted)]">
                Checks passed
              </p>
              <p className="mt-1 text-2xl font-extrabold text-stone-700">
                {counts.passed}
                <span className="text-sm font-semibold text-[var(--brand-muted)]">
                  {" "}
                  / {counts.total}
                </span>
              </p>
            </div>
          </div>

          {/* Category scores */}
          <details open className="group rounded-2xl border border-[var(--brand-border)] bg-white p-5 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-[var(--brand-text)]">
              Category scores
              <span
                aria-hidden
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-stone-100 text-[var(--brand-primary)] transition group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {categoriesPresent.length === 0 && (
                <NonIdealState
                  title="No category scores"
                  body="The analyzers returned no per-category scores."
                />
              )}
              {categoriesPresent.map((k) => (
                <ScoreBlock
                  key={k}
                  label={CATEGORY_LABEL[k]}
                  score={categoryScores[k] ?? 0}
                />
              ))}
            </div>
          </details>

          {/* Critical issues */}
          <details open className="group rounded-2xl border border-[var(--brand-border)] bg-white p-5 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-[var(--brand-text)]">
              Critical issues ({counts.critical})
              <span
                aria-hidden
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-stone-100 text-[var(--brand-primary)] transition group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="mt-4">
              {report.criticalIssues.length === 0 ? (
                <NonIdealState
                  title="No critical issues"
                  body="This listing passed all critical SEO checks."
                />
              ) : (
                <ul className="space-y-3">
                  {report.criticalIssues.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} />
                  ))}
                </ul>
              )}
            </div>
          </details>

          {/* Warnings */}
          <details className="group rounded-2xl border border-[var(--brand-border)] bg-white p-5 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-[var(--brand-text)]">
              Warnings ({counts.warnings})
              <span
                aria-hidden
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-stone-100 text-[var(--brand-primary)] transition group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="mt-4">
              {report.highIssues.length === 0 ? (
                <NonIdealState
                  title="No warnings"
                  body="No should-fix issues were reported."
                />
              ) : (
                <ul className="space-y-3">
                  {report.highIssues.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} />
                  ))}
                </ul>
              )}
            </div>
          </details>

          {/* Recommendations */}
          <details className="group rounded-2xl border border-[var(--brand-border)] bg-white p-5 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-[var(--brand-text)]">
              Recommendations ({counts.recommendations})
              <span
                aria-hidden
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-stone-100 text-[var(--brand-primary)] transition group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="mt-4">
              {report.recommendations.length === 0 ? (
                <NonIdealState
                  title="No recommendations"
                  body="The analyzer does not suggest any changes."
                />
              ) : (
                <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--brand-text)]">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ol>
              )}
            </div>
          </details>

          {/* Reset / Analyze again footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-xs text-[var(--brand-muted)]">
              Edit the form above and click “Analyze again” to re-run.
            </p>
            <button
              type="button"
              onClick={reset}
              className="btn-ghost text-xs"
            >
              Clear results
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
