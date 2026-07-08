# RFC-007: Keyword Analyzer

**RFC ID:** RFC-007  
**Status:** Draft  
**Version:** 1.0.0  
**Last Updated:** 2026-07-06  
**Author:** SEO Engine Team  
**Related:** SEO_ENGINE_SPEC.md (Section 10), RFC-002, RFC-003, RFC-004, RFC-005, RFC-006

---

## 1. Purpose

The Keyword Analyzer evaluates keyword usage across property listing pages against SEO best practices. It analyzes keyword presence, density, distribution, and placement in critical elements (title, H1, meta description, URL, content) to ensure optimal search engine relevance without keyword stuffing.

**Problems Solved:**
- Missing primary keyword
- Keyword not in critical elements (title, H1, description, URL)
- Keyword stuffing (excessive density)
- Too low keyword density
- Missing related/LSI keywords
- Unnatural keyword distribution
- Duplicate keyword phrases
- Poor keyword placement

**Explicitly Does NOT Do:**
- Generate keywords (future Generator phase)
- Modify content (read-only analysis)
- NLP/semantic analysis beyond simple synonym detection
- Competitor keyword analysis
- Search volume analysis
- Keyword ranking tracking
- Paid keyword analysis

---

## 2. Scope

**In-Scope Fields:**
- `content` (primary body text)
- `title` (page title)
- `metaDescription` (meta description)
- `urlSlug` or `fullUrl` (URL)
- `headings` (heading array)
- `targetKeywords` (primary and secondary keywords)
- `city`, `locality`, `propertyType` (via options)

**Keyword Metrics:**
- `density`: Percentage of keyword occurrences to total words
- `occurrences`: Raw count of keyword appearances
- `prominence`: Position-weighted scoring (early appearances weighted higher)
- `distribution`: Evenness of keyword spread across content

**Configuration Options:**
```typescript
{
  primaryKeyword?: string
  secondaryKeywords?: string[]
  minDensity?: number (default: 0.5)
  maxDensity?: number (default: 2.5)
  idealDensity?: number (default: 1.5)
  minOccurrences?: number (default: 1)
  maxOccurrencesPerParagraph?: number (default: 3)
  requireInTitle?: boolean (default: true)
  requireInH1?: boolean (default: true)
  requireInMeta?: boolean (default: true)
  requireInUrl?: boolean (default: true)
  requireRelatedKeywords?: boolean (default: false)
  minRelatedKeywordCount?: number (default: 2)
  stopwords?: string[]
  minContentLength?: number (default: 100)
}
```

**Out-of-Scope:**
- Keyword difficulty scores
- Search volume metrics
- CPC/paid data
- Trend analysis
- Competitor comparison
- Long-tail keyword discovery (future)

---

## 3. Input Contract

**Primary Input:**

```typescript
interface KeywordAnalyzerInput {
  content: string;
  title?: string;
  metaDescription?: string;
  urlSlug?: string;
  headings?: Array<{ level: number; text: string }>;
  targetKeywords?: string[];
}
```

**Field Specifications:**

| Field | Type | Required | Default if Missing |
|-------|------|----------|-------------------|
| `content` | `string` | Yes | KW-001 fails (no content to analyze) |
| `title` | `string` | No | KW-002 skipped |
| `metaDescription` | `string` | No | KW-004 skipped |
| `urlSlug` | `string` | No | KW-005 skipped |
| `headings` | `Heading[]` | No | Cross-reference only |
| `targetKeywords` | `string[]` | No | Analysis uses empty keyword set |

**Configuration Validation:**
- `primaryKeyword`: Non-empty string
- `secondaryKeywords`: Array of strings
- `minDensity`: Number 0-5, default 0.5
- `maxDensity`: Number 0-10, default 2.5
- `idealDensity`: Number between min and max, default 1.5
- `minOccurrences`: Positive integer, default 1
- `maxOccurrencesPerParagraph`: Positive integer, default 3
- `requireInTitle/H1/Meta/Url`: Booleans, defaults true
- `stopwords`: Array of strings to exclude from density calculation
- `minContentLength`: Positive integer, default 100

---

## 4. Output Contract

**Primary Output:** `SeoCheckResult` (existing type)

```typescript
{
  checkId: "keyword-analyzer"
  summary: string
  issues: SeoIssue[]
  passed: boolean
}
```

**Extended Metadata:**
- `primaryKeyword`: string | undefined
- `keywordOccurrences`: number
- `keywordDensity`: number (percentage)
- `idealDensity`: number
- `densityStatus`: "too-low" | "optimal" | "too-high"
- `inTitle`: boolean
- `inH1`: boolean
- `inMetaDescription`: boolean
- `inUrl`: boolean
- `relatedKeywordsFound`: string[]
- `relatedKeywordsMissing`: string[]
- `averageOccurrencesPerParagraph`: number
- `firstKeywordPosition`: number (word index)
- `lastKeywordPosition`: number (word index)
- `totalWords`: number
- `uniqueWords`: number
- `score`: number (0-100)

---

## 5. Rule Catalogue

### KW-001: Primary Keyword Exists
- **Purpose:** Verify at least one primary keyword is configured
- **Why it matters:** Without a target keyword, analysis cannot determine relevance
- **Severity:** critical
- **Weight:** 10
- **Required Input:** `targetKeywords` array or `primaryKeyword`
- **Expected Output:** Pass if at least one keyword provided
- **Pass Criteria:** `targetKeywords.length >= 1` or `primaryKeyword` exists
- **Fail Criteria:** No keywords provided
- **Recommendation:** "Define at least one primary keyword for this property listing."
- **Passing Example:** `targetKeywords: ["3BHK", "Noida"]`
- **Failing Example:** `targetKeywords: []`

### KW-002: Primary Keyword Appears in Title
- **Purpose:** Verify keyword presence in page title
- **Why it matters:** Title is the most important on-page SEO element; keyword presence signals relevance
- **Severity:** warning
- **Weight:** 8
- **Required Input:** `title`, `targetKeywords`
- **Expected Output:** Pass if keyword found in title
- **Pass Criteria:** At least one keyword found in title (case-insensitive)
- **Fail Criteria:** No keywords found in title
- **Recommendation:** "Include your primary keyword near the beginning of the page title."
- **Passing Example:** Title: "3BHK Apartment in Noida | Luxury Living", Keywords: ["3BHK", "Noida"]
- **Failing Example:** Title: "Luxury Property for Rent", Keywords: ["3BHK", "Noida"]

### KW-003: Primary Keyword Appears in H1
- **Purpose:** Verify keyword presence in H1 heading
- **Why it matters:** H1 is the primary content heading; keyword presence reinforces topic relevance
- **Severity:** warning
- **Weight:** 6
- **Required Input:** `headings`, `targetKeywords`
- **Expected Output:** Pass if keyword found in any H1
- **Pass Criteria:** At least one keyword found in H1 heading text
- **Fail Criteria:** No keywords found in H1
- **Recommendation:** "Include your primary keyword in the main H1 heading."
- **Passing Example:** H1: "Modern 3BHK Apartments in Noida", Keywords: ["3BHK"]
- **Failing Example:** H1: "Welcome to Our Property Portal", Keywords: ["3BHK"]

### KW-004: Primary Keyword Appears in Meta Description
- **Purpose:** Verify keyword presence in meta description
- **Why it matters:** Keywords in description improve CTR from SERPs and reinforce relevance
- **Severity:** warning
- **Weight:** 6
- **Required Input:** `metaDescription`, `targetKeywords`
- **Expected Output:** Pass if keyword found in meta description
- **Pass Criteria:** At least one keyword found in meta description
- **Fail Criteria:** No keywords found in meta description
- **Recommendation:** "Include your primary keyword naturally in the meta description."
- **Passing Example:** Meta: "Rent this beautiful 3BHK apartment in Noida with modern amenities.", Keywords: ["3BHK", "Noida"]
- **Failing Example:** Meta: "Great property available for rent.", Keywords: ["3BHK", "Noida"]

### KW-005: Primary Keyword Appears in URL
- **Purpose:** Verify keyword presence in URL slug
- **Why it matters:** Keywords in URL improve click-through rates and provide ranking signal
- **Severity:** warning
- **Weight:** 6
- **Required Input:** `urlSlug`, `targetKeywords`
- **Expected Output:** Pass if keyword found in URL
- **Pass Criteria:** At least one keyword found in URL slug (case-insensitive)
- **Fail Criteria:** No keywords found in URL
- **Recommendation:** "Include your primary keyword in the URL slug."
- **Passing Example:** URL: "/rent/noida/3bhk-apartment", Keywords: ["3BHK", "Noida"]
- **Failing Example:** URL: "/property/12345", Keywords: ["3BHK", "Noida"]

### KW-006: Keyword Density Is Within Acceptable Limits
- **Purpose:** Ensure keyword density falls within optimal range
- **Why it matters:** Too low = insufficient relevance signal; too high = potential stuffing penalty
- **Severity:** warning
- **Weight:** 8
- **Required Input:** `content`, `targetKeywords`
- **Expected Output:** Pass if density between min and max thresholds
- **Pass Criteria:** `minDensity <= density <= maxDensity` (default: 0.5% - 2.5%)
- **Fail Criteria:** Density < minDensity or density > maxDensity
- **Recommendation:** "Adjust keyword usage to achieve 0.5%-2.5% density."
- **Passing Example:** 1500 words, keyword appears 22 times = 1.47% density
- **Failing Example:** 1500 words, keyword appears 3 times = 0.2% density (too low)

### KW-007: No Keyword Stuffing
- **Purpose:** Detect and flag excessive keyword usage
- **Why it matters:** Keyword stuffing is a negative ranking factor and creates poor user experience
- **Severity:** warning
- **Weight:** 8
- **Required Input:** `content` (split into paragraphs), `targetKeywords`
- **Expected Output:** Pass if no paragraph exceeds max occurrences
- **Pass Criteria:** All paragraphs have `keywordCount <= maxOccurrencesPerParagraph`
- **Fail Criteria:** Any paragraph has keyword count exceeding threshold
- **Recommendation:** "Reduce keyword repetition. Use synonyms and related terms instead."
- **Passing Example:** Each paragraph has 1-2 keyword mentions
- **Failing Example:** One paragraph mentions "3BHK apartment in Noida" 5 times

### KW-008: Related Keywords Are Present
- **Purpose:** Verify presence of semantically related keywords (LSI keywords)
- **Why it matters:** Related keywords demonstrate topical depth and reduce stuffing risk
- **Severity:** info
- **Weight:** 4
- **Required Input:** `content`, `secondaryKeywords` or auto-generated related terms
- **Expected Output:** Pass if minimum related keywords found
- **Pass Criteria:** `relatedKeywordsFound.length >= minRelatedKeywordCount`
- **Fail Criteria:** Fewer related keywords than minimum
- **Recommendation:** "Include related terms and synonyms to enrich content."
- **Passing Example:** Keywords: ["3BHK", "Noida"]; Related found: ["apartment", "rent", "Sector 62", "property"]
- **Failing Example:** Only exact match keywords present, no variations

### KW-009: Keywords Are Naturally Distributed
- **Purpose:** Ensure keywords are spread evenly throughout content
- **Why it matters:** Clustered keywords appear manipulative; even distribution appears natural
- **Severity:** info
- **Weight:** 4
- **Required Input:** `content` (split into sections/paragraphs), `targetKeywords`
- **Expected Output:** Pass if distribution variance is within acceptable range
- **Pass Criteria:** Standard deviation of keyword counts per section < threshold
- **Fail Criteria:** Keywords clustered in one section, absent from others
- **Recommendation:** "Distribute keywords more evenly throughout the content."
- **Passing Example:** Keywords appear in intro, middle, and conclusion
- **Failing Example:** All keyword mentions in first paragraph only

### KW-010: No Duplicate Keyword Phrases
- **Purpose:** Detect exact duplicate keyword phrases in close proximity
- **Why it matters:** Repeated identical phrases appear unnatural and manipulative
- **Severity:** info
- **Weight:** 4
- **Required Input:** `content`, `targetKeywords`
- **Expected Output:** Pass if no exact duplicate phrases within N words
- **Pass Criteria:** No identical keyword phrases within 100-word window
- **Fail Criteria:** Same keyword phrase repeated verbatim within proximity
- **Recommendation:** "Vary your keyword phrasing. Use synonyms and related terms."
- **Passing Example:** "3BHK apartment", "three-bedroom unit", "3BHK flat"
- **Failing Example:** "3BHK apartment in Noida" repeated 4 times verbatim

---

## 6. Score Calculation

```
Base Score = 100
Penalty per issue:
  - critical: 25 (calculateScore utility)
  - warning: 10
  - info: 2
  - success: 0
Final Score = max(0, 100 - Total Penalty)
```

**Weight Table:**

| Rule | Severity | Weight |
|------|----------|--------|
| KW-001 | critical | 10 |
| KW-002 | warning | 8 |
| KW-003 | warning | 6 |
| KW-004 | warning | 6 |
| KW-005 | warning | 6 |
| KW-006 | warning | 8 |
| KW-007 | warning | 8 |
| KW-008 | info | 4 |
| KW-009 | info | 4 |
| KW-010 | info | 4 |

**Density Status Scoring:**
- "too-low" (density < minDensity): warning penalty
- "optimal" (minDensity <= density <= maxDensity): no penalty
- "too-high" (density > maxDensity): warning penalty + potential stuffing flag

**Example Calculations:**
- Perfect (keyword in all elements, optimal density, natural distribution): Score = 100
- Missing keyword everywhere: Score = 52 (48 penalty from 5 warnings)
- Keyword stuffing detected: Score = 70 (30 penalty from 3 warnings)
- Missing related keywords only: Score = 96 (4 penalty from 1 info)

**Passing Threshold:** 70

---

## 7. Edge Cases

| Scenario | Behavior |
|----------|----------|
| `content: ""` | KW-001 fails (no content), density = 0 |
| `content: null` | Treated as empty; KW-001 fails |
| `content: undefined` | Treated as empty; KW-001 fails |
| `targetKeywords: []` | KW-001 fails (critical) |
| `targetKeywords: null` | Treated as empty array |
| `targetKeywords: undefined` | Treated as empty array |
| Keyword is empty string | Skipped; not counted |
| Keyword is whitespace | Trimmed; if empty after trim, skipped |
| Unicode keywords (Hindi, Chinese) | Counted normally; case-insensitive matching |
| Emoji in keywords | Counted as characters; may appear unnatural |
| Mixed language content | Each keyword matched independently |
| Very short content (<100 words) | Density may be skewed; flag if below minContentLength |
| Very long content (>5000 words) | Density calculation remains accurate; distribution more important |
| Keyword appears 0 times | KW-002 through KW-007 fail; density = 0 |
| Keyword appears 100+ times | KW-007 (stuffing) and KW-006 (high density) fail |
| Duplicate keywords in array | Deduplicated before analysis |
| HTML entities in content | Counted as-is; not decoded |
| HTML tags in content | Stripped before word count and density calculation |
| Numbers as keywords | Counted normally |
| Special characters in keywords | Matched exactly; case-insensitive |
| Keyword is substring of another word | Matched as whole word only (word boundaries) |
| Hyphenated keywords | Matched with and without hyphen |
| Plural/singular variations | Not matched automatically; must be specified |

---

## 8. Error Handling

| Error Condition | Behavior |
|-----------------|----------|
| `content` not string | Treated as empty; KW-001 fails |
| `title` not string | KW-002 skipped; logged |
| `metaDescription` not string | KW-004 skipped; logged |
| `urlSlug` not string | KW-005 skipped; logged |
| `headings` not array | KW-003 skipped; logged |
| Invalid density config | Defaults used; warning logged |
| Negative density values | Clamped to 0 |
| maxDensity < minDensity | Swap values; warning logged |
| Plugin timeout | Return partial results with error |
| Circular references in content | N/A (content is string) |

**Logging:**
- Log KW-001 failures (configuration issue)
- Log KW-006/KW-007 failures (potential SEO penalty risk)
- Log KW-002 through KW-005 failures (missing keyword placement)
- Do not log full content in production (privacy)

**Graceful Degradation:**
- If title missing, skip KW-002; continue with other rules
- If meta description missing, skip KW-004; continue
- If URL missing, skip KW-005; continue
- If headings missing, skip KW-003; continue

**Content Pre-processing:**
- Strip HTML tags before word count
- Normalize whitespace
- Convert to lowercase for matching
- Preserve original for reporting

---

## 9. Performance Requirements

| Metric | Target |
|--------|--------|
| Max execution time | 200ms |
| Max memory | 2MB |
| Complexity | O(n) where n = content word count |
| Batch throughput | 500 properties/second |
| Scalability | Stateless; parallel execution supported |
| Max content length | No hard limit; warn if >10,000 words |
| Max keyword count | No hard limit; warn if >50 keywords |

**Optimization Notes:**
- Use single-pass content scanning for all keywords
- Cache word count and paragraph splits
- Use regex with word boundaries for accurate matching
- Avoid nested loops for density calculation

---

## 10. Test Plan (70 Tests)

**Core Functionality (1-7):**
1. analyzeKeywords with undefined content returns critical issue
2. analyzeKeywords with null content returns critical issue
3. analyzeKeywords with empty content returns critical issue
4. analyzeKeywords with valid content and keywords passes KW-001
5. analyzeKeywords with empty keywords array returns critical
6. analyzeKeywords with null keywords treated as empty
7. analyzeKeywords with undefined keywords treated as empty

**Keyword Existence (8-13):**
8. At least one keyword returns success KW-001
9. Single keyword passes KW-001
10. Multiple keywords pass KW-001
11. Empty string keyword skipped
12. Whitespace keyword trimmed and skipped
13. Duplicate keywords deduplicated

**Title Keyword (KW-002) (14-20):**
14. Keyword found in title returns success
15. Keyword missing from title returns warning
16. Multiple keywords, partial match in title returns success
17. Case-insensitive title matching
18. Keyword at start of title detected
19. Keyword at end of title detected
20. Title missing skips KW-002

**H1 Keyword (KW-003) (21-27):**
21. Keyword found in H1 returns success
22. Keyword missing from H1 returns warning
23. Multiple H1s, keyword in any returns success
24. Case-insensitive H1 matching
25. H1 array missing skips KW-003
26. Empty H1 array skips KW-003
27. H1 with HTML entities matched correctly

**Meta Description Keyword (KW-004) (28-33):**
28. Keyword found in meta description returns success
29. Keyword missing from meta description returns warning
30. Case-insensitive meta description matching
31. Meta description missing skips KW-004
32. Empty meta description skips KW-004
33. Long meta description (160+ chars) keyword detected

**URL Keyword (KW-005) (34-39):**
34. Keyword found in URL returns success
35. Keyword missing from URL returns warning
36. Case-insensitive URL matching
37. URL slug missing skips KW-005
38. Full URL with keyword detected
39. Hyphenated keyword in URL matched

**Keyword Density (KW-006) (40-48):**
40. Density 0.5%-2.5% returns success
41. Density < 0.5% returns warning (too low)
42. Density > 2.5% returns warning (too high)
43. Density exactly 0.5% passes
44. Density exactly 2.5% passes
45. Custom minDensity respected
46. Custom maxDensity respected
47. Zero occurrences = 0% density
48. Very long content density calculated accurately

**Keyword Stuffing (KW-007) (49-56):**
49. No paragraph exceeds max returns success
50. One paragraph exceeds max returns warning
51. Multiple paragraphs exceed max returns warning
52. Custom maxOccurrencesPerParagraph respected
53. Stuffing in first paragraph detected
54. Stuffing in last paragraph detected
55. Stuffing in middle paragraph detected
56. Paragraph splitting handles HTML correctly

**Related Keywords (KW-008) (57-63):**
57. Minimum related keywords found returns success
58. Below minimum related keywords returns info
59. Zero related keywords returns info
60. Custom minRelatedKeywordCount respected
61. Secondary keywords provided used as related
62. Related keywords case-insensitive
63. requireRelatedKeywords=false skips check

**Keyword Distribution (KW-009) (64-69):**
64. Even distribution returns success
65. Clustered keywords returns info
66. All keywords in first paragraph returns info
67. All keywords in last paragraph returns info
68. Keywords in intro, middle, conclusion returns success
69. Distribution variance calculated correctly

**Duplicate Phrases (KW-010) (70-75):**
70. No duplicate phrases returns success
71. Duplicate phrase within 100 words returns info
72. Duplicate phrase beyond 100 words passes
73. Exact match detection (case-insensitive)
74. Varied phrasing passes KW-010
75. Multiple duplicate pairs detected

**Scoring (76-82):**
76. Perfect keyword usage scores 100
77. Missing keyword everywhere scores below 100
78. Multiple warnings calculate penalty
79. Critical failure (no keywords) = failed status
80. Info issues don't affect pass/fail threshold
81. Score capped at 0 minimum
82. Partial credit for some keyword placements

**Edge Cases (83-90):**
83. Unicode keywords counted correctly
84. Emoji in keywords handled
85. HTML entities in content counted as-is
86. HTML tags stripped before analysis
87. Very short content (<100 words) density calculated
88. Very long content (>5000 words) density calculated
89. Numbers as keywords matched
90. Special characters in keywords matched

**Output Contract (91-98):**
91. Returns primaryKeyword in metadata
92. Returns keywordOccurrences number
93. Returns keywordDensity percentage
94. Returns inTitle, inH1, inMeta, inUrl booleans
95. Returns relatedKeywordsFound array
96. Returns relatedKeywordsMissing array
97. Returns totalWords count
98. Returns densityStatus ("too-low" | "optimal" | "too-high")

---

## 11. Acceptance Criteria

- [ ] `npm run build` passes
- [ ] `npm run test` passes (60+ tests)
- [ ] Zero TypeScript errors
- [ ] Reuses existing `SeoPlugin` interface
- [ ] Reuses existing `SeoCheckResult` type
- [ ] Reuses existing scoring utilities
- [ ] Reuses existing text helpers (`normalize`, `countWords`, etc.)
- [ ] Uses `definePlugin` and `analyzerOutput`
- [ ] No new dependencies
- [ ] Deterministic behavior
- [ ] Follows code style (no `any`, JSDoc)
- [ ] Exports from `analyzer/index.ts`
- [ ] Category is `"keywords"`

---

## 12. Future Extensions

| Extension | Priority |
|-----------|----------|
| AI-Generated Keyword Suggestions | High |
| LSI/Semantic Keyword Discovery | High |
| Search Volume Integration | Medium |
| Competitor Keyword Analysis | Medium |
| Keyword Difficulty Scoring | Medium |
| Long-Tail Keyword Discovery | Medium |
| Keyword Cannibalization Detection | Low |
| Topic Cluster Analysis | Low |
| Question-Based Keyword Detection | Medium |
| Voice Search Keyword Optimization | Low |
| Local Keyword Optimization | High |
| Multi-language Keyword Support | Low |
| Keyword Trend Analysis | Low |
| Seasonal Keyword Detection | Low |
| SERP Feature Optimization | Medium |

---

## Open Questions

1. **Related Keyword Source:** Should related keywords be provided via `secondaryKeywords` option, or should the analyzer auto-generate them from a predefined list (e.g., real estate synonyms)?

2. **Word Boundary Matching:** Should hyphenated keywords match both with and without hyphens (e.g., "3BHK" matches "3-BHK")? Should plural/singular be auto-matched?

3. **Density Calculation Method:** Should density be calculated as `(keywordOccurrences / totalWords) * 100` or `(keywordOccurrences / (totalWords - stopwords)) * 100` (excluding stopwords)?

4. **Paragraph Detection:** Should paragraphs be split by double newlines (`\n\n`), `<p>` tags, or a combination? How should HTML content be handled?

5. **Distribution Threshold:** What standard deviation threshold should trigger KW-009 (distribution) warning? Should it be absolute or relative to mean?

6. **Duplicate Phrase Window:** Is 100 words the correct window for KW-010 (duplicate phrases)? Should it be configurable?

7. **Keyword Prominence:** Should early keyword appearances (first 100 words, first paragraph) be weighted more heavily in scoring?

8. **Stopwords Configuration:** Should the default stopwords list be English-only, or should it support multiple languages? Should it be configurable per property?

9. **Content Length Threshold:** Should there be a minimum content length below which density analysis is skipped or flagged as unreliable?

10. **Case Sensitivity:** Should keyword matching be case-insensitive (current spec) or respect case for proper nouns (e.g., "Noida" vs "noida")?

---

## Final Report

### 1. File Created
- `docs/rfcs/RFC-007-Keyword-Analyzer.md`

### 2. Executive Summary
RFC-007 defines the Keyword Analyzer with 10 rules (KW-001 through KW-010) covering keyword existence, placement in critical elements (title, H1, meta description, URL), density optimization, stuffing detection, related keyword presence, natural distribution, and duplicate phrase detection. The specification follows RFC-002/003/004/005/006 patterns and integrates with existing SEO Engine architecture. The analyzer provides comprehensive keyword usage analysis to ensure optimal SEO relevance without risking penalties from keyword stuffing.

### 3. Ambiguities Found

| Ambiguity | Impact |
|-----------|--------|
| Related keyword source | Should related keywords be provided or auto-generated? |
| Word boundary matching | Should hyphenated/plural variants auto-match? |
| Density calculation | Should stopwords be excluded from word count? |
| Paragraph detection | How should HTML content be split into paragraphs? |
| Distribution threshold | What variance triggers the distribution warning? |
| Duplicate phrase window | Is 100 words the correct proximity threshold? |
| Keyword prominence | Should early appearances be weighted higher? |
| Stopwords language | Should stopwords be English-only or multi-language? |
| Minimum content length | Below what length is density analysis unreliable? |
| Case sensitivity | Should proper nouns respect case in matching? |

### 4. Open Questions Before Implementation

1. **Related Keyword Source:** Should the analyzer accept `secondaryKeywords` as input, or should it auto-generate related terms from a predefined real estate synonym list (e.g., "apartment" → "flat", "unit", "residence")?

2. **Word Boundary Matching:** Should "3BHK" match "3-BHK" and "3 BHK"? Should "apartment" automatically match "apartments" (plural)? Should this be configurable via `fuzzyMatching` option?

3. **Density Calculation:** Should the denominator in density calculation exclude stopwords (more accurate for keyword relevance) or include all words (simpler, more standard)?

4. **Paragraph Detection:** For HTML content, should paragraphs be detected via `<p>` tags, double newlines, or both? How should `<div>`, `<section>`, or other block elements be handled?

5. **Distribution Threshold:** Should KW-009 use a fixed standard deviation threshold (e.g., >2.0), a relative threshold (e.g., >50% of mean), or a more sophisticated metric like Gini coefficient?

6. **Duplicate Phrase Window:** Should the 100-word window for KW-010 be fixed, or should it scale with content length (e.g., 100 words for <1000 words, 200 words for longer content)?

7. **Keyword Prominence:** Should the analyzer track and reward keyword appearances in the first 100 words, first paragraph, or first H2 as a "prominence bonus" in scoring?

8. **Stopwords Configuration:** Should the default stopwords list be English-only, or should the analyzer detect content language and apply appropriate stopwords? Should users be able to provide custom stopwords?

9. **Content Length Threshold:** Should density analysis be skipped or flagged with a warning if content is below a threshold (e.g., 100 words)? What should the threshold be?

10. **Case Sensitivity:** Should keyword matching be purely case-insensitive, or should proper nouns (city names like "Noida", "Sector 62") respect case to avoid false positives (e.g., "noida" matching "No Ida")?

---

**END OF RFC-007**