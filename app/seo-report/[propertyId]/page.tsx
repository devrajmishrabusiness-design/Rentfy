"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { SeoReportOutput } from "@/seo-agent/report/types";

type LoadState = "idle" | "loading" | "success" | "error";

interface StoredReport {
  report: SeoReportOutput;
  analyzerVersion: string;
  lastAnalyzed: string;
  score: number;
  grade: string;
}

const GRADE_LABEL: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  "needs-improvement": "Needs improvement",
  poor: "Poor",
};

const GRADE_BADGE: Record<string, string> = {
  excellent: "badge-success",
  good: "badge-info",
  "needs-improvement": "badge-warning",
  poor: "badge-error",
};

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
  success: "bg-emerald-500",
};

const scoreColorClass = (score: number): string => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
};

const IssueRow = ({ issue }: { issue: SeoReportOutput["criticalIssues"][number] }) => (
  <li className="flex gap-3 text-sm">
    <span
      aria-hidden
      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${SEVERITY_DOT[issue.severity] ?? "bg-stone-400"}`}
    />
    <div className="min-w-0">
      <p className="font-semibold text-[var(--brand-text)]">{issue.title}</p>
      {issue.description && (
        <p className="mt-0.5 text-[var(--brand-muted)]">{issue.description}</p>
      )}
      {issue.recommendation && (
        <p className="mt-1 text-[var(--brand-muted)]">
          <span className="font-semibold text-[var(--brand-text)]">Fix: </span>
          {issue.recommendation}
        </p>
      )}
    </div>
  </li>
);

const NonIdealState = ({ title, body }: { title: string; body: string }) => (
  <div className="rounded-2xl border border-dashed border-[var(--brand-border)] bg-stone-50 px-5 py-8 text-center">
    <p className="text-sm font-semibold text-[var(--brand-text)]">{title}</p>
    <p className="mt-1 text-xs text-[var(--brand-muted)]">{body}</p>
  </div>
);

export default function ViewSeoReportPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;

  const [state, setState] = useState<LoadState>("loading");
  const [report, setReport] = useState<StoredReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) {
      setTimeout(() => {
        setErrorMsg("Property ID is missing.");
        setState("error");
      }, 0);
      return;
    }

    const fetchReport = async () => {
      setState("loading");
      try {
        const res = await fetch(`/api/seo/reports/${propertyId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to fetch report");
        }

        setReport(data);
        setState("success");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load report";
        setErrorMsg(message);
        setState("error");
      }
    };

    fetchReport();
  }, [propertyId]);

  if (state === "loading") {
    return (
      <main className="min-h-screen bg-[var(--brand-background)]">
        <section className="container-app py-16">
          <div className="card p-10 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[var(--brand-border)] border-t-[var(--brand-primary)]" />
            <p className="mt-4 text-sm font-semibold text-[var(--brand-text)]">Loading SEO report...</p>
          </div>
        </section>
      </main>
    );
  }

  if (state === "error" || !report) {
    return (
      <main className="min-h-screen bg-[var(--brand-background)]">
        <section className="container-app py-16">
          <div className="card p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-bold text-[var(--brand-text)]">Failed to load report</h1>
            <p className="mt-2 text-sm text-[var(--brand-muted)]">{errorMsg ?? "Unknown error"}</p>
            <Link href="/dashboard" className="btn-primary mt-6">
              Back to Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { report: reportData, score, grade, lastAnalyzed, analyzerVersion } = report;
  const counts = {
    critical: reportData.criticalIssues.length,
    warnings: reportData.highIssues.length,
    recommendations: reportData.recommendations.length,
    passed: reportData.passedChecks,
    failed: reportData.failedChecks,
    total: reportData.totalChecks,
  };

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="container-app py-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-sm font-semibold text-[var(--brand-primary)] hover:underline">
              ← Back to Dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-extrabold text-[var(--brand-text)]">SEO Report</h1>
            <p className="mt-1 text-sm text-[var(--brand-muted)]">
              Analyzed on {new Date(lastAnalyzed).toLocaleString("en-IN")} · Version {analyzerVersion}
            </p>
          </div>
        </div>

        {/* Overall Score */}
        <div className="card mb-6 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-extrabold ${scoreColorClass(score)}`}>
                {Math.round(score)}
              </span>
              <span className="text-lg font-semibold text-[var(--brand-muted)]">/ 100</span>
            </div>
            <span className={GRADE_BADGE[grade] ?? "badge-muted"}>
              {GRADE_LABEL[grade] ?? "Unknown"}
            </span>
            <span className={reportData.passed ? "badge-success" : "badge-warning"}>
              {reportData.passed ? "Above threshold" : "Below threshold"}
            </span>
            <span className="badge-muted">Threshold: {reportData.passedThreshold}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="text-xs font-semibold text-[var(--brand-muted)]">Critical Issues</p>
            <p className={`mt-2 text-3xl font-extrabold ${counts.critical > 0 ? "text-red-600" : "text-stone-700"}`}>
              {counts.critical}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-semibold text-[var(--brand-muted)]">Warnings</p>
            <p className={`mt-2 text-3xl font-extrabold ${counts.warnings > 0 ? "text-amber-600" : "text-stone-700"}`}>
              {counts.warnings}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-semibold text-[var(--brand-muted)]">Checks Passed</p>
            <p className="mt-2 text-3xl font-extrabold text-stone-700">
              {counts.passed}
              <span className="text-sm font-semibold text-[var(--brand-muted)]"> / {counts.total}</span>
            </p>
          </div>
        </div>

        {/* Critical Issues */}
        <details open className="card mb-4 p-6 group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-[var(--brand-text)]">
            Critical Issues ({counts.critical})
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-stone-100 text-[var(--brand-primary)] transition group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="mt-4">
            {reportData.criticalIssues.length === 0 ? (
              <NonIdealState title="No critical issues" body="This listing passed all critical SEO checks." />
            ) : (
              <ul className="space-y-3">
                {reportData.criticalIssues.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} />
                ))}
              </ul>
            )}
          </div>
        </details>

        {/* Warnings */}
        <details className="card mb-4 p-6 group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-[var(--brand-text)]">
            Warnings ({counts.warnings})
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-stone-100 text-[var(--brand-primary)] transition group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="mt-4">
            {reportData.highIssues.length === 0 ? (
              <NonIdealState title="No warnings" body="No should-fix issues were reported." />
            ) : (
              <ul className="space-y-3">
                {reportData.highIssues.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} />
                ))}
              </ul>
            )}
          </div>
        </details>

        {/* Recommendations */}
        <details className="card p-6 group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-[var(--brand-text)]">
            Recommendations ({counts.recommendations})
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-stone-100 text-[var(--brand-primary)] transition group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="mt-4">
            {reportData.recommendations.length === 0 ? (
              <NonIdealState title="No recommendations" body="The analyzer does not suggest any changes." />
            ) : (
              <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--brand-text)]">
                {reportData.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ol>
            )}
          </div>
        </details>
      </section>
    </main>
  );
}