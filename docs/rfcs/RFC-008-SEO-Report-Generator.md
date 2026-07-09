# RFC-008: SEO Report Generator

**RFC ID:** RFC-008
**Status:** Draft
**Version:** 1.0.0
**Last Updated:** 2026-07-08
**Author:** SEO Engine Team
**Related:** SEO_ENGINE_SPEC.md (Section 13), RFC-002, RFC-003, RFC-004, RFC-005, RFC-006, RFC-007

---

## 1. Purpose

The SEO Report Generator aggregates the outputs of every registered analyzer into a single, unified SEO report. It does not perform any analysis itself; it only consumes results already produced by analyzers, organizes them, computes aggregate scores, deduplicates findings, prioritizes recommendations, and produces a single deterministic JSON report.

**Problems Solved:**

- No unified report spanning all analyzers
- Inconsistent severity classification across analyzers
- Duplicate findings across analyzers (e.g., "title missing" reported by multiple plugins)
- No single overall score
- No category-level scoring
- No prioritized recommendation list
- No standardized metadata for downstream consumers (UI, API, exports)

**Explicitly Does NOT Do:**

- Perform any SEO analysis (read-only consumer of analyzer results)
- Run analyzers itself (the engine pipeline already executed them)
- Mutate any analyzer output (immutable consumption)
- Make network calls or persist data
- Render HTML/PDF/Markdown (future presentation layer)
- Translate or localize text (receives already-localized content)
- Retry failed analyzers (errors are reported, not resolved)

---

## 2. Scope

**In Scope:**

- Aggregating `SeoCheckResult` outputs from all analyzers
- Computing overall SEO score (0-100)
- Computing category scores (per `IssueCategory`)
- Ranking issues by severity
- Deduplicating identical findings across analyzers
- Prioritizing recommendations
- Producing a single JSON report
- Handling partial failures and edge cases gracefully
- Supporting any number of analyzers (current and future) without code changes

**Out of Scope:**

- Running the engine or pipeline
- Analyzer implementations (already defined in RFC-002 through RFC-007)
- Rendering formats beyond JSON (HTML, PDF, etc. — see Future Extensions)
- Historical/trend analysis
- Caching of past reports
- Internationalization of report content
- Persisting reports to storage
- Authentication / authorization
- Rate limiting
- Configuration UI

---

## 3. Input Contract

The Report Generator consumes an array of `SeoCheckResult` (the existing contract defined in `seo-agent/types/index.ts`) plus minimal report-level metadata.

### 3.1 Primary Input

```
type ReportInput = {
  checks: SeoCheckResult[];   // Required: one per analyzer
  metadata: ReportMetadata;    // Required: contextual data
};
```

### 3.2 ReportMetadata

```
type ReportMetadata = {
  propertyId: string;          // Required: unique property identifier
  url?: string;                // Optional: page URL analyzed
  runId: string;               // Required: engine run ID (from EngineConfig.runId)
  engineVersion: string;       // Required: SEO engine version
  generatedAt: string;         // Required: ISO 8601 timestamp of report generation
  options?: ReportOptions;     // Optional: report-level configuration
};
```

### 3.3 ReportOptions

```
type ReportOptions = {
  includeSuccessIssues?: boolean;   // Default: false. Include success issues in report.
  topIssuesLimit?: number;          // Default: 10. Max issues in topIssues list.
  recommendationLimit?: number;     // Default: 5. Max prioritized recommendations.
  categoryWeights?: Partial<Record<IssueCategory, number>>;  // Optional: custom category weights (0-1).
  dedupeStrategy?: "first" | "best-severity" | "most-specific";  // Default: "best-severity"
};
```

### 3.4 Analyzer Result Contract (Reused)

Each `SeoCheckResult` in the `checks` array must conform to the existing type:

```
SeoCheckResult {
  checkId: string;        // e.g., "title-analyzer", "url-analyzer"
  summary: string;        // Human-readable summary
  issues: SeoIssue[];     // All issues (success, info, warning, critical)
  passed: boolean;        // Convenience flag
}
```

Each `SeoIssue` must conform to:

```
SeoIssue {
  id: string;             // e.g., "TITLE-001", "URL-005"
  title: string;
  description: string;
  severity: "critical" | "warning" | "info" | "success";
  category: IssueCategory;
  recommendation?: string;
  currentValue?: string | number | boolean;
  expectedValue?: string | number | boolean;
  weight?: number;        // 0-10
}
```

### 3.5 Required Fields Per Check

| Field | Type | Required | Behavior if Missing |
|-------|------|----------|---------------------|
| `checkId` | `string` | Yes | Error: skip check, log warning |
| `summary` | `string` | Yes | Default to empty string |
| `issues` | `SeoIssue[]` | Yes | Treat as empty array |
| `passed` | `boolean` | Yes | Compute from issues (no critical/warning) |

### 3.6 Required Fields Per Issue

| Field | Type | Required | Behavior if Missing |
|-------|------|----------|---------------------|
| `id` | `string` | Yes | Use checkId + index: `${checkId}-issue-${i}` |
| `title` | `string` | Yes | Use id |
| `description` | `string` | Yes | Use title |
| `severity` | `SeverityLevel` | Yes | Default to "info" |
| `category` | `IssueCategory` | Yes | Default to "technical" |
| `recommendation` | `string` | No | Omit from recommendations list |
| `weight` | `number` | No | Derive from severity: critical=10, warning=5, info=1, success=0 |

### 3.7 Execution Metadata (Optional)

The Report Generator also receives an optional execution summary describing how each check ran:

```
type ExecutionInfo = {
  checkId: string;
  status: "success" | "failed" | "timeout" | "skipped" | "disabled";
  executionTimeMs?: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
};

type ReportInput = {
  checks: SeoCheckResult[];
  metadata: ReportMetadata;
  executionInfo?: ExecutionInfo[];  // Optional: from engine pipeline
};
```

This metadata enables the report to surface which analyzers ran successfully, which failed, and how long each took.

---

## 4. Output Contract

The Report Generator produces a single JSON-serializable object conforming to `SeoReportOutput`.

### 4.1 Report Structure

```
type SeoReportOutput = {
  // Overall score (0-100, rounded to integer)
  overallScore: number;

  // Score interpretation
  scoreGrade: "excellent" | "good" | "needs-improvement" | "poor";

  // Pass/fail determination
  passed: boolean;
  passedThreshold: number;   // Default: 70

  // Category scores
  categoryScores: Record<IssueCategory, number>;

  // Issues grouped by severity
  criticalIssues: SeoIssue[];
  highIssues: SeoIssue[];
  mediumIssues: SeoIssue[];
  lowIssues: SeoIssue[];

  // Ranked issues (most important first)
  topIssues: SeoIssue[];

  // Prioritized actionable recommendations
  recommendations: string[];

  // Counts
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  totalChecks: number;

  // Analyzer results (full, for debugging/inspection)
  analyzerResults: SeoCheckResult[];

  // Execution summary
  executionSummary: {
    totalExecutionTimeMs: number;
    successfulAnalyzers: number;
    failedAnalyzers: number;
    skippedAnalyzers: number;
    disabledAnalyzers: number;
  };

  // Metadata
  metadata: {
    propertyId: string;
    url?: string;
    runId: string;
    engineVersion: string;
    reportVersion: string;     // "1.0.0"
    generatedAt: string;       // ISO 8601
  };
};
```

### 4.2 Field Semantics

**Overall Score (`overallScore`):**

- Integer 0-100
- Higher is better
- 100 = no issues across all analyzers
- 0 = maximum possible penalty exceeded
- See Section 6 for calculation

**Score Grade (`scoreGrade`):**

- "excellent": 90-100
- "good": 70-89
- "needs-improvement": 50-69
- "poor": 0-49

These thresholds match the existing `SEO_ENGINE_SPEC.md` Section 9.

**Passed (`passed`):**

- `true` if `overallScore >= passedThreshold` AND no critical issues
- `false` otherwise

**Category Scores (`categoryScores`):**

- Record mapping every `IssueCategory` to a 0-100 score
- Categories with no issues default to 100
- See Section 6 for calculation

**Issue Lists by Severity:**

The Report Generator maps analyzer severities to four output buckets:

| Analyzer Severity | Report Bucket | Notes |
|-------------------|---------------|-------|
| `critical` | `criticalIssues` | Must-fix; blocks SEO |
| `warning` | `highIssues` | Should-fix; significant impact |
| `info` | `mediumIssues` | Nice-to-fix; moderate impact |
| `success` | `lowIssues` (optional) | Informational; only if `includeSuccessIssues=true` |

This mapping preserves all analyzer severities but groups them into the report's four output buckets for consumer convenience.

**Top Issues (`topIssues`):**

- Array of `SeoIssue` (excluding success unless `includeSuccessIssues=true`)
- Length: `min(topIssuesLimit, totalNonSuccessIssues)`
- Sorted by: severity (critical > warning > info), then by weight (higher first), then by checkId (alphabetical)

**Recommendations (`recommendations`):**

- Array of strings (extracted from `SeoIssue.recommendation`)
- Length: `min(recommendationLimit, totalRecommendations)`
- Deduplicated: identical strings appear only once
- Sorted by: source issue severity (critical > warning > info), then by source issue weight

**Counts:**

- `passedChecks`: count of checks where `passed === true` and zero issues
- `failedChecks`: count of checks with at least one critical issue
- `warningChecks`: count of checks with at least one warning but no critical
- `totalChecks`: total number of input checks

**Analyzer Results (`analyzerResults`):**

- The full `SeoCheckResult[]` as received (with deduplicated issues applied)
- Preserves all data for downstream consumers

**Execution Summary:**

- Aggregates `ExecutionInfo` (if provided)
- `totalExecutionTimeMs`: sum of all `executionTimeMs` values
- `successfulAnalyzers`: count where `status === "success"`
- `failedAnalyzers`: count where `status === "failed"` or `"timeout"`
- `skippedAnalyzers`: count where `status === "skipped"`
- `disabledAnalyzers`: count where `status === "disabled"`

If `ExecutionInfo` is not provided, all counts default to 0 and `totalExecutionTimeMs` is 0.

**Metadata:**

- `reportVersion`: "1.0.0" (this RFC)
- `generatedAt`: ISO 8601 timestamp at report generation time
- Other fields passed through from input metadata

---

## 5. Aggregation Rules

### 5.1 How Analyzer Scores Combine

Each analyzer returns its own per-check score (computed via the existing `scoreCheck` utility in `seo-agent/utils/scoring.ts`). The Report Generator does not re-implement scoring; it reuses `aggregateScores` to combine check scores into an overall score.

**Default Combination Formula:**

```
overallScore = round(average(allCheckScores))
```

Where `allCheckScores` is the array of per-check scores computed by `scoreCheck`.

**Weighted Combination (if `categoryWeights` provided):**

If `ReportOptions.categoryWeights` is provided, each category's score is weighted according to the provided map. Missing categories default to weight 1.0.

```
weightedScore = sum(categoryScore[cat] * weight[cat]) / sum(weight[cat])
overallScore = round(weightedScore)
```

### 5.2 How Missing Analyzers Affect Score

- A missing analyzer is treated as if it returned a perfect score (100) and zero issues
- Missing analyzers do not penalize the overall score
- Missing analyzers are not included in `totalChecks`
- This avoids penalizing reports when an analyzer is unavailable (graceful degradation)

### 5.3 How Failed Analyzers Affect Score

- A failed analyzer (status: "failed" or "timeout") is treated as a critical issue in the `technical` category
- One critical issue is added to the report with:
  - `id`: `${checkId}-execution-failed`
  - `title`: `Analyzer ${checkId} failed to execute`
  - `description`: Error message from `ExecutionInfo.errorMessage`
  - `severity`: `"critical"`
  - `category`: `"technical"`
  - `recommendation`: "Re-run analysis or investigate analyzer error"
  - `weight`: 10
- Failed analyzers are excluded from the average score calculation (treated as score 0 for that check, but counted in `failedChecks`)

### 5.4 How Disabled Analyzers Affect Score

- Disabled analyzers are excluded from the report entirely
- They are not counted in `totalChecks`, `passedChecks`, `failedChecks`, or `warningChecks`
- They are counted in `executionSummary.disabledAnalyzers`
- The report does not penalize or credit disabled analyzers

### 5.5 How Duplicate Issues Are Merged

Two issues are considered duplicates if **all** of the following match:

- Same `id` (case-sensitive)
- Same `category`
- Same `title` (case-sensitive)

When duplicates are found, the Report Generator applies the `dedupeStrategy` (default: `"best-severity"`):

- `"first"`: keep the first occurrence; discard the rest
- `"best-severity"`: keep the issue with the highest severity; discard others
  - Severity order: `critical > warning > info > success`
  - On tie, keep the first occurrence
- `"most-specific"`: keep the issue with the highest `weight` value
  - On tie, keep the first occurrence

The deduped issue list is used for all downstream calculations (category scores, severity buckets, top issues, recommendations).

### 5.6 How Recommendations Are Merged

- Recommendations are extracted from `SeoIssue.recommendation` fields (issues without `recommendation` are excluded)
- Duplicate recommendation strings (exact match, case-sensitive) are deduplicated
- The source issue of each recommendation is tracked for sorting purposes
- After deduplication, recommendations are sorted by their source issue's severity, then weight

### 5.7 How Categories Are Ordered

- Categories are emitted in `categoryScores` in the canonical order defined by the `IssueCategory` union in `seo-agent/types/index.ts`
- This ensures deterministic JSON output

### 5.8 How Disabled Checks Are Handled

- Disabled checks (present in `executionInfo` with status `"disabled"`) are not included in the report's `analyzerResults`
- They are only reflected in `executionSummary.disabledAnalyzers`

---

## 6. Score Calculation

### 6.1 Per-Check Score

Each `SeoCheckResult` already has a per-check score (0-100) computed by analyzers using `scoreCheck`:

```
scoreCheck(issues) = max(0, 100 - sum(weight for each issue))
```

Where `weight` is `issue.weight` if defined, otherwise derived from severity:

- `critical`: 10
- `warning`: 5
- `info`: 1
- `success`: 0

The Report Generator **reuses** this existing logic; it does not re-compute per-check scores. It only combines them.

### 6.2 Overall Score

**Default (unweighted):**

```
overallScore = round(average(scoreCheck(check.issues) for each check))
```

If there are zero checks, `overallScore = 100`.

**Weighted (if `categoryWeights` provided):**

```
For each category c:
  categoryIssues = all issues where issue.category === c
  categoryPenalty[c] = sum(weight for each issue in categoryIssues)
  categoryCount[c] = len(categoryIssues)
  categoryScore[c] = if categoryCount[c] === 0 then 100 else max(0, round(100 - categoryPenalty[c] / categoryCount[c]))

weights = categoryWeights ∪ { default: 1.0 for missing categories }
totalWeight = sum(weights[c] for each category c)
weightedSum = sum(categoryScore[c] * weights[c] for each category c)
overallScore = round(weightedSum / totalWeight)
```

### 6.3 Category Scores

The Report Generator reuses `aggregateScores` from `seo-agent/utils/scoring.ts` to compute category scores. This ensures consistency with the existing scoring system.

**Output:**

```
categoryScores: Record<IssueCategory, number> = {
  meta: <score>,
  headings: <score>,
  content: <score>,
  performance: <score>,
  accessibility: <score>,
  mobile: <score>,
  "structured-data": <score>,
  links: <score>,
  images: <score>,
  keywords: <score>,
  technical: <score>,
}
```

Every category appears in the output, even if no issues exist in that category (score = 100).

### 6.4 Score Rounding

- All scores are rounded to integers using `Math.round`
- No floating-point scores appear in the output
- This matches the existing behavior of `aggregateScores`

### 6.5 Missing Analyzer Behavior

A missing analyzer is one that does not appear in the `checks` array at all (not in `executionInfo` either).

- Treated as if it returned a perfect score
- Does not affect overall score
- Not counted in `totalChecks`

### 6.6 Unknown Analyzer Behavior

An "unknown" analyzer is one with a `checkId` that does not match any registered analyzer in the system.

- Treated as a regular analyzer
- Its issues are included in the report
- Its score is computed normally
- No special handling or penalty

### 6.7 Example Calculations

**Example 1: Perfect Report**

- 3 analyzers, all with score 100
- `overallScore = round((100 + 100 + 100) / 3) = 100`
- `passed = true`, `scoreGrade = "excellent"`

**Example 2: Mixed Scores**

- Title analyzer: 100
- URL analyzer: 80
- Image analyzer: 60
- `overallScore = round((100 + 80 + 60) / 3) = 80`
- `passed = true`, `scoreGrade = "good"`

**Example 3: Weighted Scores**

- Categories: meta=100, headings=80, images=60
- Weights: meta=1.0, headings=2.0, images=1.5
- `totalWeight = 4.5`
- `weightedSum = 100*1.0 + 80*2.0 + 60*1.5 = 100 + 160 + 90 = 350`
- `overallScore = round(350 / 4.5) = 78`
- `passed = true`, `scoreGrade = "good"`

**Example 4: Critical Issue Present**

- Overall score: 85
- One critical issue in technical category
- `passed = false` (critical overrides score)
- `scoreGrade = "good"` (based on score only)

**Example 5: Failed Analyzer**

- 2 successful analyzers, 1 failed
- Failed analyzer adds a critical issue
- `overallScore = round((100 + 80) / 2) = 90` (failed excluded from average)
- `failedChecks = 1` (the failed one)
- `passed = false` (critical issue present)

---

## 7. Recommendation Prioritization

### 7.1 Extraction

Recommendations are extracted from issues with a non-empty `recommendation` field.

### 7.2 Deduplication

- Identical recommendation strings (case-sensitive, exact match) are deduplicated
- Whitespace is trimmed before comparison
- The first occurrence's source issue is used for sorting

### 7.3 Sorting

Recommendations are sorted by:

1. Source issue severity (critical > warning > info > success)
2. Source issue weight (higher weight first)
3. Source issue id (alphabetical, for determinism)

### 7.4 Limiting

The output `recommendations` array length is:

```
min(recommendationLimit, totalUniqueRecommendations)
```

Default `recommendationLimit` is 5. This keeps the report focused on the most impactful actions.

### 7.5 Example

Given these issues:

```
1. { severity: "critical", weight: 10, recommendation: "Add meta description" }
2. { severity: "warning", weight: 8, recommendation: "Reduce title length" }
3. { severity: "warning", weight: 6, recommendation: "Add meta description" }  // duplicate
4. { severity: "info", weight: 4, recommendation: "Add alt text" }
```

With `recommendationLimit = 2`, the output is:

```
[
  "Add meta description",      // from issue 1 (critical)
  "Reduce title length"        // from issue 2 (warning, higher weight)
]
```

---

## 8. Duplicate Finding Resolution

### 8.1 Identification

Two issues are duplicates if:

- `issue1.id === issue2.id` (case-sensitive, exact match)
- `issue1.category === issue2.category`
- `issue1.title === issue2.title` (case-sensitive, exact match)

All three conditions must hold.

### 8.2 Strategies

The `dedupeStrategy` option selects the merge behavior:

- `"first"`: keep the first occurrence, discard the rest
- `"best-severity"`: keep the issue with the highest severity
  - Severity priority: `critical > warning > info > success`
  - On tie, keep the first occurrence
- `"most-specific"`: keep the issue with the highest `weight` value
  - On tie, keep the first occurrence

Default: `"best-severity"`.

### 8.3 Scope

Deduplication is applied:

- **Per check**: not across checks (different analyzers can report the same finding)
- **Per category**: within the same category only

Cross-analyzer duplicates (same issue reported by two different analyzers) are **not** deduplicated by the Report Generator. Each analyzer's findings are preserved independently in `analyzerResults`.

### 8.4 Example

```
Check 1 (title-analyzer):
  - { id: "TITLE-005", category: "meta", title: "Title too long", severity: "warning", weight: 8 }
  - { id: "TITLE-005", category: "meta", title: "Title too long", severity: "warning", weight: 8 }  // duplicate
  - { id: "TITLE-006", category: "meta", title: "Title too long", severity: "critical", weight: 10 }  // not duplicate (different id)

Check 2 (url-analyzer):
  - { id: "URL-002", category: "meta", title: "Title too long", severity: "info", weight: 4 }  // different check, not deduplicated
```

After dedup with `"best-severity"`, Check 1 issues become:

```
[
  { id: "TITLE-005", ... },
  { id: "TITLE-006", ... }
]
```

The duplicate `TITLE-005` is removed. The `URL-002` from Check 2 is preserved as a separate finding.

---

## 9. Report JSON

### 9.1 Complete Example

```json
{
  "overallScore": 82,
  "scoreGrade": "good",
  "passed": true,
  "passedThreshold": 70,
  "categoryScores": {
    "meta": 90,
    "headings": 100,
    "content": 85,
    "performance": 100,
    "accessibility": 75,
    "mobile": 100,
    "structured-data": 80,
    "links": 100,
    "images": 60,
    "keywords": 88,
    "technical": 100
  },
  "criticalIssues": [],
  "highIssues": [
    {
      "id": "IMG-008",
      "title": "Image dimensions below minimum",
      "description": "Image 1 is 400x300; minimum is 800x600",
      "severity": "warning",
      "category": "images",
      "recommendation": "Use images at least 800x600 pixels",
      "weight": 6
    },
    {
      "id": "URL-009",
      "title": "URL length out of range",
      "description": "URL is 95 characters; recommended range is 20-80",
      "severity": "warning",
      "category": "technical",
      "recommendation": "Shorten URL slug to 20-80 characters",
      "weight": 8
    }
  ],
  "mediumIssues": [
    {
      "id": "KW-008",
      "title": "Insufficient related keywords",
      "description": "Found 1 related keyword; minimum recommended: 2",
      "severity": "info",
      "category": "keywords",
      "recommendation": "Include related terms and synonyms",
      "weight": 4
    }
  ],
  "lowIssues": [],
  "topIssues": [
    {
      "id": "URL-009",
      "title": "URL length out of range",
      "description": "URL is 95 characters; recommended range is 20-80",
      "severity": "warning",
      "category": "technical",
      "recommendation": "Shorten URL slug to 20-80 characters",
      "weight": 8
    },
    {
      "id": "IMG-008",
      "title": "Image dimensions below minimum",
      "description": "Image 1 is 400x300; minimum is 800x600",
      "severity": "warning",
      "category": "images",
      "recommendation": "Use images at least 800x600 pixels",
      "weight": 6
    },
    {
      "id": "KW-008",
      "title": "Insufficient related keywords",
      "description": "Found 1 related keyword; minimum recommended: 2",
      "severity": "info",
      "category": "keywords",
      "recommendation": "Include related terms and synonyms",
      "weight": 4
    }
  ],
  "recommendations": [
    "Shorten URL slug to 20-80 characters",
    "Use images at least 800x600 pixels",
    "Include related terms and synonyms"
  ],
  "passedChecks": 4,
  "failedChecks": 0,
  "warningChecks": 3,
  "totalChecks": 7,
  "analyzerResults": [
    {
      "checkId": "title-analyzer",
      "summary": "Title length: 55 characters (optimal)",
      "issues": [
        {
          "id": "TITLE-001",
          "title": "Title exists",
          "description": "Page title is present",
          "severity": "success",
          "category": "meta",
          "weight": 0
        }
      ],
      "passed": true
    },
    {
      "checkId": "meta-description-analyzer",
      "summary": "Meta description length: 150 characters (optimal)",
      "issues": [
        {
          "id": "MD-001",
          "title": "Meta description exists",
          "description": "Meta description is present",
          "severity": "success",
          "category": "meta",
          "weight": 0
        }
      ],
      "passed": true
    },
    {
      "checkId": "url-analyzer",
      "summary": "URL slug length: 95 characters (out of range)",
      "issues": [
        {
          "id": "URL-001",
          "title": "URL exists",
          "description": "URL slug is present",
          "severity": "success",
          "category": "technical",
          "weight": 0
        },
        {
          "id": "URL-009",
          "title": "URL length out of range",
          "description": "URL is 95 characters; recommended range is 20-80",
          "severity": "warning",
          "category": "technical",
          "recommendation": "Shorten URL slug to 20-80 characters",
          "weight": 8
        }
      ],
      "passed": false
    },
    {
      "checkId": "image-analyzer",
      "summary": "8 images found; 2 below minimum dimensions",
      "issues": [
        {
          "id": "IMG-001",
          "title": "Images exist",
          "description": "Page has 8 images",
          "severity": "success",
          "category": "images",
          "weight": 0
        },
        {
          "id": "IMG-008",
          "title": "Image dimensions below minimum",
          "description": "Image 1 is 400x300; minimum is 800x600",
          "severity": "warning",
          "category": "images",
          "recommendation": "Use images at least 800x600 pixels",
          "weight": 6
        }
      ],
      "passed": false
    },
    {
      "checkId": "schema-analyzer",
      "summary": "Schema.org JSON-LD present with 3 missing properties",
      "issues": [
        {
          "id": "SCH-001",
          "title": "Schema exists",
          "description": "JSON-LD schema is present",
          "severity": "success",
          "category": "structured-data",
          "weight": 0
        },
        {
          "id": "SCH-005",
          "title": "Missing required properties",
          "description": "Schema is missing description, image, offers",
          "severity": "warning",
          "category": "structured-data",
          "recommendation": "Add missing required properties to schema",
          "weight": 6
        }
      ],
      "passed": false
    },
    {
      "checkId": "heading-analyzer",
      "summary": "1 H1, 5 H2 headings; hierarchy valid",
      "issues": [
        {
          "id": "HDG-001",
          "title": "Exactly one H1",
          "description": "Page has exactly one H1",
          "severity": "success",
          "category": "headings",
          "weight": 0
        }
      ],
      "passed": true
    },
    {
      "checkId": "keyword-analyzer",
      "summary": "Keyword '3BHK' found 18 times; density 1.2%",
      "issues": [
        {
          "id": "KW-001",
          "title": "Primary keyword defined",
          "description": "Primary keyword is '3BHK'",
          "severity": "success",
          "category": "keywords",
          "weight": 0
        },
        {
          "id": "KW-008",
          "title": "Insufficient related keywords",
          "description": "Found 1 related keyword; minimum recommended: 2",
          "severity": "info",
          "category": "keywords",
          "recommendation": "Include related terms and synonyms",
          "weight": 4
        }
      ],
      "passed": true
    }
  ],
  "executionSummary": {
    "totalExecutionTimeMs": 1247,
    "successfulAnalyzers": 7,
    "failedAnalyzers": 0,
    "skippedAnalyzers": 0,
    "disabledAnalyzers": 0
  },
  "metadata": {
    "propertyId": "prop-12345",
    "url": "https://example.com/rent/noida/sector-62/3bhk-apartment",
    "runId": "0.1.0-core-1234567890-1",
    "engineVersion": "0.1.0-core",
    "reportVersion": "1.0.0",
    "generatedAt": "2026-07-08T12:34:56.789Z"
  }
}
```

### 9.2 Example: Failed Analyzer

```json
{
  "overallScore": 65,
  "scoreGrade": "needs-improvement",
  "passed": false,
  "passedThreshold": 70,
  "categoryScores": {
    "meta": 90,
    "headings": 100,
    "content": 85,
    "performance": 100,
    "accessibility": 75,
    "mobile": 100,
    "structured-data": 100,
    "links": 100,
    "images": 0,
    "keywords": 88,
    "technical": 0
  },
  "criticalIssues": [
    {
      "id": "image-analyzer-execution-failed",
      "title": "Analyzer image-analyzer failed to execute",
      "description": "Timeout after 2000ms",
      "severity": "critical",
      "category": "technical",
      "recommendation": "Re-run analysis or investigate analyzer error",
      "weight": 10
    }
  ],
  "highIssues": [],
  "mediumIssues": [],
  "lowIssues": [],
  "topIssues": [
    {
      "id": "image-analyzer-execution-failed",
      "title": "Analyzer image-analyzer failed to execute",
      "description": "Timeout after 2000ms",
      "severity": "critical",
      "category": "technical",
      "recommendation": "Re-run analysis or investigate analyzer error",
      "weight": 10
    }
  ],
  "recommendations": [
    "Re-run analysis or investigate analyzer error"
  ],
  "passedChecks": 5,
  "failedChecks": 1,
  "warningChecks": 1,
  "totalChecks": 6,
  "analyzerResults": [
    {
      "checkId": "title-analyzer",
      "summary": "Title is optimal",
      "issues": [],
      "passed": true
    }
  ],
  "executionSummary": {
    "totalExecutionTimeMs": 800,
    "successfulAnalyzers": 5,
    "failedAnalyzers": 1,
    "skippedAnalyzers": 0,
    "disabledAnalyzers": 0
  },
  "metadata": {
    "propertyId": "prop-67890",
    "url": "https://example.com/rent/noida/sector-62/2bhk",
    "runId": "0.1.0-core-1234567890-2",
    "engineVersion": "0.1.0-core",
    "reportVersion": "1.0.0",
    "generatedAt": "2026-07-08T12:40:00.000Z"
  }
}
```

### 9.3 Example: Empty Report

```json
{
  "overallScore": 100,
  "scoreGrade": "excellent",
  "passed": true,
  "passedThreshold": 70,
  "categoryScores": {
    "meta": 100,
    "headings": 100,
    "content": 100,
    "performance": 100,
    "accessibility": 100,
    "mobile": 100,
    "structured-data": 100,
    "links": 100,
    "images": 100,
    "keywords": 100,
    "technical": 100
  },
  "criticalIssues": [],
  "highIssues": [],
  "mediumIssues": [],
  "lowIssues": [],
  "topIssues": [],
  "recommendations": [],
  "passedChecks": 0,
  "failedChecks": 0,
  "warningChecks": 0,
  "totalChecks": 0,
  "analyzerResults": [],
  "executionSummary": {
    "totalExecutionTimeMs": 0,
    "successfulAnalyzers": 0,
    "failedAnalyzers": 0,
    "skippedAnalyzers": 0,
    "disabledAnalyzers": 0
  },
  "metadata": {
    "propertyId": "prop-empty",
    "runId": "0.1.0-core-1234567890-3",
    "engineVersion": "0.1.0-core",
    "reportVersion": "1.0.0",
    "generatedAt": "2026-07-08T12:45:00.000Z"
  }
}
```

---

## 10. Error Handling

### 10.1 Null Analyzer Output

If a check has `issues === null` or `undefined`:

- Treat as empty array
- Log warning
- Continue processing

If a check has `checkId === null` or `undefined`:

- Generate a fallback id: `unknown-analyzer-${index}`
- Log warning
- Continue processing

If a check is `null` or `undefined`:

- Skip the check entirely
- Log warning
- Do not count in totals

### 10.2 Exceptions

The Report Generator must not throw under normal circumstances. If an unexpected exception occurs:

- Catch the exception
- Return a minimal valid report with:
  - `overallScore: 0`
  - `passed: false`
  - One critical issue: `{ id: "report-generation-failed", severity: "critical", category: "technical", description: <error message>, weight: 10 }`
  - All other fields empty/zero
- Do not propagate the exception to the caller

### 10.3 Timeouts

The Report Generator itself does not enforce timeouts (it operates on already-completed analyzer results). However:

- Analyzer timeouts are reflected in `executionInfo` with `status: "timeout"`
- These are treated as failed analyzers (see Section 5.3)
- A critical issue is added for each timed-out analyzer

### 10.4 Unknown Analyzer

An analyzer with a `checkId` not in the registered analyzer list:

- Treated as a regular analyzer
- Its issues and score are included in the report
- No special handling

This ensures the Report Generator works even if new analyzers are added without updating the report code.

### 10.5 Duplicate Analyzer

If the same `checkId` appears multiple times in the `checks` array:

- **All occurrences are kept** in `analyzerResults`
- Each occurrence's issues are included in calculations
- The same `checkId` appearing twice is not a Report Generator error
- It may indicate an engine configuration issue, but the report is still generated

### 10.6 Malformed Results

A malformed issue (missing required fields) is handled as follows:

- Missing `id`: generate `${checkId}-issue-${index}`
- Missing `title`: use the generated id
- Missing `description`: use the title
- Missing `severity`: default to `"info"`
- Missing `category`: default to `"technical"`
- Missing `weight`: derive from severity (critical=10, warning=5, info=1, success=0)

A malformed check (missing required fields) is handled as follows:

- Missing `checkId`: generate `unknown-analyzer-${index}`
- Missing `summary`: use empty string
- Missing `issues`: treat as empty array
- Missing `passed`: compute from issues (true if no critical/warning)

### 10.7 Partial Failures

If some analyzers succeed and others fail:

- Successful analyzers contribute to scores and issues normally
- Failed analyzers contribute a critical issue in the `technical` category
- The overall score reflects both successful and failed analyzers
- `executionSummary` accurately reports the mix

### 10.8 Invalid Options

If `ReportOptions` contains invalid values (e.g., `topIssuesLimit: -1`):

- Negative numbers: use default (0 or 10 depending on field)
- Non-numeric values: use default
- Unknown `dedupeStrategy`: use `"best-severity"`
- Out-of-range `categoryWeights`: clamp to [0, 1]

---

## 11. Performance Requirements

### 11.1 Maximum Execution Time

- **Target**: 50ms for a typical report (10 analyzers, 50 total issues)
- **Maximum**: 200ms even for large reports (50 analyzers, 500 total issues)

### 11.2 Memory Target

- **Target**: 1MB additional memory for a typical report
- **Maximum**: 5MB even for large reports

### 11.3 Complexity

- **Time**: O(n) where n = total number of issues across all checks
- **Space**: O(n) for the report structure

### 11.4 Scalability

- Must handle 1 to 100 analyzers per report without performance degradation
- Must handle 0 to 1000 issues per report
- Must support batch report generation (e.g., 1000 reports/second on a single core)

### 11.5 Determinism

Given the same input:

- Output must be byte-identical
- Category order must be canonical
- Issue order within severity buckets must be deterministic (sorted by id)
- Timestamp in `metadata.generatedAt` is the only non-deterministic field

---

## 12. Test Plan

Approximately 60 meaningful tests covering all behaviors. No test code is included; only test descriptions.

### 12.1 Input Validation (1-8)

1. Empty `checks` array produces a valid empty report
2. Single check with no issues produces score 100
3. Single check with one critical issue produces score 90 (100 - 10)
4. Multiple checks with mixed scores produce correct average
5. Missing `metadata.propertyId` throws or uses fallback
6. Missing `metadata.runId` throws or uses fallback
7. Invalid `metadata.generatedAt` format is normalized
8. `ExecutionInfo` array with mismatched `checkId` is ignored

### 12.2 Score Calculation (9-16)

9. All checks score 100 → overall score 100
10. One check scores 0, others 100 → overall score ≈ 77 (average of 7 checks)
11. Weighted categories with `categoryWeights` produce correct weighted average
12. Missing category in `categoryWeights` defaults to weight 1.0
13. Invalid `categoryWeights` (negative) clamps to 0
14. Invalid `categoryWeights` (>1) clamps to 1
15. Scores are always integers (no floating-point in output)
16. Category scores sum to reported `overallScore` (within rounding)

### 12.3 Severity Bucketing (17-24)

17. `critical` issues appear in `criticalIssues` only
18. `warning` issues appear in `highIssues` only
19. `info` issues appear in `mediumIssues` only
20. `success` issues appear in `lowIssues` when `includeSuccessIssues=true`
21. `success` issues excluded when `includeSuccessIssues=false` (default)
22. Mixed severities are correctly bucketed
23. Issue count in buckets matches input
24. Severity order is critical > warning > info > success

### 12.4 Top Issues (25-30)

25. `topIssues` contains at most `topIssuesLimit` issues
26. `topIssues` sorted by severity (critical first)
27. `topIssues` with same severity sorted by weight (higher first)
28. `topIssues` with same severity and weight sorted by id
29. `topIssues` excludes success issues by default
30. `topIssues` includes success issues when `includeSuccessIssues=true`

### 12.5 Recommendations (31-38)

31. `recommendations` contains at most `recommendationLimit` items
32. `recommendations` sorted by source issue severity
33. Duplicate recommendation strings are deduplicated
34. Issues without `recommendation` are excluded
35. Whitespace-only recommendations are treated as missing
36. Empty `recommendationLimit` (0) produces empty array
37. Default `recommendationLimit` is 5
38. Recommendations preserve exact source string (no modification)

### 12.6 Deduplication (39-45)

39. Same issue appearing twice in one check is deduplicated (best-severity)
40. Same issue across checks is NOT deduplicated
41. `dedupeStrategy: "first"` keeps the first occurrence
42. `dedupeStrategy: "best-severity"` keeps the highest severity
43. `dedupeStrategy: "most-specific"` keeps the highest weight
44. Invalid `dedupeStrategy` defaults to `"best-severity"`
45. Deduplication is case-sensitive (different cases are not duplicates)

### 12.7 Failed Analyzers (46-51)

46. Failed analyzer adds a critical issue in `technical` category
47. Failed analyzer excluded from average score
48. Failed analyzer counted in `failedChecks`
49. Multiple failed analyzers each add a critical issue
50. Failed analyzer with `errorMessage` includes it in the issue description
51. Failed analyzer without `errorMessage` uses generic description

### 12.8 Disabled Analyzers (52-54)

52. Disabled analyzer not included in `analyzerResults`
53. Disabled analyzer counted in `executionSummary.disabledAnalyzers`
54. Disabled analyzer does not affect overall score

### 12.9 Execution Summary (55-58)

55. `executionSummary.totalExecutionTimeMs` sums all `executionTimeMs`
56. `executionSummary.successfulAnalyzers` counts `status: "success"`
57. `executionSummary.failedAnalyzers` counts `status: "failed"` or `"timeout"`
58. Missing `ExecutionInfo` produces zero counts

### 12.10 Metadata (59-62)

59. `metadata.propertyId` passed through from input
60. `metadata.url` optional, passed through if provided
61. `metadata.runId` passed through from input
62. `metadata.reportVersion` always "1.0.0"

### 12.11 Error Handling (63-68)

63. Null check is skipped with warning
64. Undefined check is skipped with warning
65. Issue with missing `id` gets generated id
66. Issue with missing `severity` defaults to "info"
67. Issue with missing `category` defaults to "technical"
68. Exception during report generation produces fallback report

### 12.12 Determinism (69-72)

69. Same input produces same output (except timestamp)
70. Category order is canonical
71. Issue order within buckets is deterministic
72. JSON output is byte-identical across runs

### 12.13 Edge Cases (73-78)

73. All checks have zero issues → score 100
74. All checks have only critical issues → score 0
75. Single check with 100 issues → score correctly computed
76. `topIssuesLimit` larger than total issues → returns all issues
77. `recommendationLimit` larger than total recommendations → returns all
78. Report generation completes within 200ms for 100 checks

---

## 13. Acceptance Criteria

A future implementation of this RFC must:

- [ ] Reuse existing `SeoCheckResult` and `SeoIssue` types
- [ ] Reuse existing `IssueCategory` and `SeverityLevel` types
- [ ] Reuse existing `aggregateScores` and `scoreCheck` utilities from `seo-agent/utils/scoring.ts`
- [ ] Reuse existing `topIssues` utility for top issues ranking
- [ ] Not introduce new dependencies
- [ ] Not modify existing analyzer implementations
- [ ] Not modify the engine core or pipeline
- [ ] Pass `npm run build` with zero TypeScript errors
- [ ] Pass `npm run test` with all tests passing
- [ ] Produce deterministic JSON output
- [ ] Handle all edge cases documented in Section 10
- [ ] Complete report generation within performance targets (Section 11)
- [ ] Support all 11 `IssueCategory` values
- [ ] Support all 4 `SeverityLevel` values
- [ ] Expose a public factory: `createReportGenerator(options?)`
- [ ] Export a pure function: `generateReport(input, options?)` for testing
- [ ] Follow existing code style (no `any`, JSDoc comments, strict mode)
- [ ] Export from `analyzer/index.ts` (or new `report/index.ts`)

---

## 14. Future Extensions

| Extension | Priority | Description |
|-----------|----------|-------------|
| PDF Reports | High | Render report as PDF using a headless browser |
| HTML Reports | High | Render report as styled HTML page |
| Historical Comparisons | Medium | Compare current report to previous report for the same property |
| Trend Analysis | Medium | Track score changes over time |
| Multiple Scoring Models | Medium | Support different score calculations (e.g., weighted, industry-specific) |
| Export Formats | Medium | CSV, XML, YAML export formats |
| Dashboard Widgets | Low | Pre-built widgets for common dashboards |
| API Responses | Low | JSON API endpoint wrapper |
| Localized Reports | Low | Multi-language report content |
| Custom Themes | Low | Theming support for HTML/PDF reports |
| Report Subscriptions | Low | Email/Slack notifications on report generation |
| Aggregate Reports | Low | Site-wide report aggregating multiple properties |
| Custom Deduplication Rules | Low | User-defined duplicate detection rules |
| Report Diffing | Low | Highlight changes between two reports |
| Filtering | Low | Filter report by category, severity, or checkId |
| Sorting Options | Low | Custom sort orders for issues and recommendations |
| Tagging | Low | Tag issues with custom labels for filtering |
| Comments | Low | Allow adding comments to issues for collaboration |

---

## Open Questions

1. **Report Phase Plugin**: The `PluginCapability` type includes `"report"`, but no `SeoReportOutput` type exists yet. Should the Report Generator be implemented as a `SeoPlugin` with `capability: "report"` and `phase: "report"`, or as a standalone function called by the engine after all analyzers run? The current RFC describes a standalone function, but a plugin adapter is also viable.

2. **Category Weight Source**: Should `categoryWeights` be:
   - A user-provided option in `ReportOptions` (current spec), OR
   - Sourced from a configuration file, OR
   - Hardcoded based on industry best practices?

3. **Score Rounding Strategy**: Current spec rounds to integers using `Math.round`. Should:
   - Scores be reported as floats (e.g., 82.5)?
   - Different precision be used (e.g., 1 decimal place)?
   - Rounding be configurable?

4. **Critical Issue Override**: Current spec says `passed = false` if any critical issue exists, regardless of score. Should there be a "soft critical" mode where critical issues reduce the score but don't automatically fail?

5. **Recommendation Limit Default**: Current default is 5. Is 5 the right number? Should it vary by use case (UI shows 3, API returns 10)?

6. **Duplicate Detection Across Checks**: Current spec does not deduplicate across checks. Should:
   - Cross-check duplicates be deduplicated (loses analyzer context)?
   - Cross-check duplicates be linked (preserves context)?
   - No action (current spec)?

7. **Report Versioning**: Current spec uses `"1.0.0"`. Should report versions follow semver? What constitutes a breaking change to the report schema?

8. **Timestamp Source**: Current spec uses `Date.now()` at generation time. Should:
   - The engine's `runId` timestamp be used (ensures consistency across the run)?
   - The input `metadata.generatedAt` be respected if provided?
   - A separate timestamp be added for report generation specifically?

9. **Empty Report Behavior**: Current spec produces a perfect 100 report for zero checks. Should an empty report:
   - Be treated as an error?
   - Produce score 0 (no analyzers ran)?
   - Produce score 100 (current spec)?

10. **Legacy Issue Fields**: The `SeoIssue` type has optional `currentValue` and `expectedValue`. Should the Report Generator:
    - Surface these in a structured way (e.g., issue diffs)?
    - Include them in the top issues for richer context?
    - Ignore them (current spec)?

11. **Analyzer Version Tracking**: Each `SeoCheckResult` has a `checkId` but not a version. Should the Report Generator:
    - Track analyzer versions separately?
    - Include analyzer version in `analyzerResults`?
    - Reject results from outdated analyzers?

12. **Report Diffing API**: Should the Report Generator expose a `diffReports(prev, current)` function, or is that a separate concern?

13. **Internationalization**: If report content is translated, should the Report Generator:
    - Accept a `locale` option and localize all strings?
    - Leave localization to the presentation layer?
    - Only localize the field names, not the issue content?

14. **Custom Severity Mapping**: The spec maps `critical → critical`, `warning → high`, `info → medium`, `success → low`. Should this mapping be configurable?

15. **Weighted Top Issues**: Current spec sorts by severity then weight. Should `topIssues` support custom sorting (e.g., by category, by recommendation presence)?

---

## Final Report

### 1. File Created

- `docs/rfcs/RFC-008-SEO-Report-Generator.md`

### 2. Executive Summary

RFC-008 defines the SEO Report Generator, a pure aggregation and presentation layer that consumes analyzer outputs and produces a single, deterministic JSON report. The Report Generator does not perform any SEO analysis; it reuses the existing `SeoCheckResult` and `SeoIssue` types, the existing `aggregateScores`, `scoreCheck`, and `topIssues` utilities, and produces a unified output containing overall and category scores, severity-bucketed issues, top issues, prioritized recommendations, execution summary, and metadata. The specification supports graceful degradation (missing, failed, and disabled analyzers), deterministic deduplication, and extensibility for future analyzers without architectural changes. The contract is implementation-ready and references only existing types and utilities.

### 3. Ambiguities Discovered

| Ambiguity | Location | Impact |
|-----------|----------|--------|
| Report Generator implementation shape (plugin vs standalone function) | Open Question 1 | Determines integration with the engine pipeline |
| Category weights source | Open Question 2 | Affects configurability of scoring |
| Score rounding strategy | Open Question 3 | Affects output precision |
| Critical issue override behavior | Open Question 4 | Affects pass/fail semantics |
| Recommendation limit default value | Open Question 5 | Affects report length |
| Cross-check duplicate handling | Open Question 6 | Affects issue uniqueness |
| Report versioning policy | Open Question 7 | Affects long-term compatibility |
| Timestamp source | Open Question 8 | Affects reproducibility |
| Empty report behavior | Open Question 9 | Affects edge case handling |
| Legacy issue field handling | Open Question 10 | Affects report richness |
| Analyzer version tracking | Open Question 11 | Affects report metadata |
| Report diffing API scope | Open Question 12 | Affects feature boundaries |
| Internationalization support | Open Question 13 | Affects multi-language support |
| Custom severity mapping | Open Question 14 | Affects report structure |
| Weighted top issues | Open Question 15 | Affects sorting flexibility |

### 4. Open Questions

1. Should the Report Generator be implemented as a `SeoPlugin` with `capability: "report"` or as a standalone function called by the engine?

2. Where should `categoryWeights` originate: user options, configuration file, or hardcoded defaults?

3. Should scores be reported as integers (current spec), floats, or configurable precision?

4. Should critical issues always cause `passed = false`, or should there be a configurable threshold?

5. Is 5 the correct default for `recommendationLimit`?

6. Should duplicate issues be deduplicated across checks, or only within checks?

7. How should report versions be managed (semver policy, breaking change criteria)?

8. Should the report timestamp be generated at report time or sourced from the engine run?

9. How should an empty report (zero checks) be handled?

10. Should `currentValue` and `expectedValue` be surfaced in the report structure?

11. Should analyzer versions be tracked and included in the report?

12. Should report diffing be part of this RFC or a separate concern?

13. Should the Report Generator handle internationalization, or delegate to the presentation layer?

14. Should the severity-to-bucket mapping be configurable?

15. Should `topIssues` support custom sorting beyond severity and weight?

---

**END OF RFC-008**
