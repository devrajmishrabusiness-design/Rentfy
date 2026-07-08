# RFC-006: Heading Analyzer

**RFC ID:** RFC-006  
**Status:** Draft  
**Version:** 1.0.0  
**Last Updated:** 2026-07-06  
**Author:** SEO Engine Team  
**Related:** SEO_ENGINE_SPEC.md (Section 10), RFC-002, RFC-003, RFC-004, RFC-005

---

## 1. Purpose

The Heading Analyzer evaluates the heading structure (H1–H6) of property listing pages against SEO and accessibility best practices. It analyzes heading hierarchy, content quality, keyword presence, and structural correctness to ensure optimal search engine understanding and screen reader navigation.

**Problems Solved:**
- Missing H1 heading
- Multiple H1 headings
- Empty headings
- Skipped heading levels (H1 → H3)
- Duplicate headings
- Headings too long or too short
- Missing keywords in headings
- Meaningless/generic heading text
- Poor heading hierarchy

**Explicitly Does NOT Do:**
- Modify page content (read-only)
- Generate headings (future Generator phase)
- Analyze heading CSS styling
- Validate HTML syntax beyond structure
- Check heading visibility (hidden/visible)
- Analyze heading font sizes
- NLP/semantic analysis

---

## 2. Scope

**In-Scope Fields:**
- `headings` (array of heading objects)
- `h1Count`, `h2Count`, `h3Count`, `h4Count`, `h5Count`, `h6Count` (via PageSignals)
- `title` (cross-reference for H1 comparison)
- `targetKeywords`, `city`, `locality`, `propertyType` (via options)

**Heading Object Structure:**
```typescript
interface Heading {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id?: string;
  children?: Heading[]; // nested structure
}
```

**Out-of-Scope:**
- Heading CSS classes, IDs (except for duplicate detection)
- Font sizes, colors, styling
- Visibility (hidden via CSS)
- Position on page
- Click behavior
- Anchor links

**Configuration Options:**
```typescript
{
  requireH1?: boolean (default: true)
  maxH1Count?: number (default: 1)
  minH1Length?: number (default: 20)
  maxH1Length?: number (default: 70)
  minH2Count?: number (default: 2)
  recommendedH2Count?: number (default: 5)
  targetKeywords?: string[]
  city?: string
  locality?: string
  propertyType?: string
  requireKeywordInH1?: boolean (default: true)
  allowDuplicateHeadings?: boolean (default: false)
  minHeadingLength?: number (default: 5)
}
```

---

## 3. Input Contract

**Primary Input:** `headings?: Heading[]`

**PageSignals Integration:**
```typescript
interface PageSignals {
  h1Count?: number;
  h2Count?: number;
  h3Count?: number;
  // ... existing fields
}
```

**Field Specifications:**

| Field | Type | Required | Default if Missing |
|-------|------|----------|-------------------|
| `headings` | `Heading[]` | No | HDG-001 fails if empty |
| `headings[].level` | `1-6` | Yes | Heading skipped |
| `headings[].text` | `string` | Yes | HDG-002/HDG-010 flags |
| `headings[].id` | `string` | No | Generated for duplicate check |

**Configuration Validation:**
- `requireH1`: Boolean, default true
- `maxH1Count`: Positive integer, default 1
- `minH1Length`: Positive integer, default 20
- `maxH1Length`: Positive integer, default 70
- `minH2Count`: Positive integer, default 2
- `recommendedH2Count`: Integer >= min, default 5
- `targetKeywords`: Array of strings
- `city`, `locality`, `propertyType`: Strings
- `requireKeywordInH1`: Boolean, default true
- `allowDuplicateHeadings`: Boolean, default false
- `minHeadingLength`: Positive integer, default 5

---

## 4. Output Contract

**Primary Output:** `SeoCheckResult` (existing type)

```typescript
{
  checkId: "heading-analyzer"
  summary: string
  issues: SeoIssue[]
  passed: boolean
}
```

**Extended Metadata:**
- `totalHeadings`: number
- `h1Count`: number
- `h2Count`: number
- `h3Count`: number
- `h4Count`: number
- `h5Count`: number
- `h6Count`: number
- `hasH1`: boolean
- `h1Text`: string | undefined
- `h1Length`: number
- `hasKeywordInH1`: boolean
- `hasDuplicateHeadings`: boolean
- `duplicateHeadingTexts`: string[]
- `skippedLevels`: number[]
- `emptyHeadings`: number
- `averageHeadingLength`: number
- `score`: number (0-100)

---

## 5. Rule Catalogue

### HDG-001: Exactly One H1 Exists
- **Purpose:** Verify exactly one H1 heading is present
- **Why it matters:** H1 is the primary heading; multiple H1s confuse search engines and screen readers; missing H1 lacks page structure
- **Severity:** critical
- **Weight:** 10
- **Required Input:** `headings` array
- **Expected Output:** Pass if exactly one H1, fail otherwise
- **Pass Criteria:** `headings.filter(h => h.level === 1).length === 1`
- **Fail Criteria:** Zero H1s or multiple H1s
- **Recommendation:** "Add exactly one H1 heading to the page."
- **Passing Example:** `[<H1>Property Title</H1>, <H2>Details</H2>]`
- **Failing Example:** `[]` or `[<H1>Title 1</H1>, <H1>Title 2</H1>]`

### HDG-002: H1 Is Not Empty
- **Purpose:** Ensure H1 contains meaningful text
- **Why it matters:** Empty H1 provides no SEO value and confuses assistive technologies
- **Severity:** critical
- **Weight:** 10
- **Required Input:** H1 heading text
- **Expected Output:** Pass if H1 text is non-empty after trimming
- **Pass Criteria:** `h1Text.trim().length > 0`
- **Fail Criteria:** H1 is empty string or whitespace only
- **Recommendation:** "Add descriptive text to the H1 heading."
- **Passing Example:** `<H1>Luxury 3BHK Apartment in Noida</H1>`
- **Failing Example:** `<H1></H1>` or `<H1>   </H1>`

### HDG-003: H1 Length Is Within Recommended Range
- **Purpose:** Enforce optimal H1 length
- **Why it matters:** Too short lacks context; too long is truncated in SERPs and overwhelms users
- **Severity:** warning
- **Weight:** 8
- **Required Input:** H1 text
- **Expected Output:** Pass if 20-70 characters
- **Pass Criteria:** `20 <= h1Length <= 70`
- **Fail Criteria:** `< 20` or `> 70` characters
- **Recommendation:** "Aim for 20-70 characters in H1 while keeping keywords at the start."
- **Passing Example:** `<H1>Modern 3BHK Apartment with City Views in Sector 62</H1>` (54 chars)
- **Failing Example:** `<H1>Apartment</H1>` (9 chars) or 100+ character heading

### HDG-004: Primary Keyword Appears in H1
- **Purpose:** Verify target keywords are present in H1
- **Why it matters:** H1 carries significant SEO weight; keywords signal page topic to search engines
- **Severity:** warning
- **Weight:** 6
- **Required Input:** H1 text, `targetKeywords`
- **Expected Output:** Pass if at least one target keyword found
- **Pass Criteria:** At least one keyword in `targetKeywords` found in H1 (case-insensitive)
- **Fail Criteria:** No target keywords found
- **Recommendation:** "Include primary keywords like property type or location in H1."
- **Passing Example:** Keywords: ["3BHK", "Noida"] → `<H1>3BHK Apartment in Noida</H1>`
- **Failing Example:** Keywords: ["3BHK", "Noida"] → `<H1>Luxury Property for Rent</H1>`

### HDG-005: Heading Hierarchy Is Valid
- **Purpose:** Ensure headings follow proper hierarchy (H1 → H2 → H3)
- **Why it matters:** Proper hierarchy improves accessibility and helps search engines understand content structure
- **Severity:** warning
- **Weight:** 6
- **Required Input:** Ordered `headings` array
- **Expected Output:** Pass if no skipped levels
- **Pass Criteria:** No heading level jumps (e.g., H1 → H3 without H2)
- **Fail Criteria:** Skipped levels detected
- **Recommendation:** "Use sequential heading levels without skipping."
- **Passing Example:** H1 → H2 → H2 → H3 → H2
- **Failing Example:** H1 → H3 → H2 (skipped H2)

### HDG-006: No Skipped Heading Levels
- **Purpose:** Detect and flag skipped heading levels
- **Why it matters:** Skipped levels (H1 → H4) break document outline and confuse screen reader users
- **Severity:** warning
- **Weight:** 6
- **Required Input:** Ordered `headings` array
- **Expected Output:** Pass if all transitions are +0 or +1 level
- **Pass Criteria:** For each consecutive heading, `next.level - current.level <= 1`
- **Fail Criteria:** Any transition where `next.level - current.level > 1`
- **Recommendation:** "Do not skip heading levels. Go from H1 to H2, H2 to H3, etc."
- **Passing Example:** H1 → H2 → H3 → H4
- **Failing Example:** H1 → H4 (skipped H2, H3)

### HDG-007: No Duplicate Headings
- **Purpose:** Detect identical heading text
- **Why it matters:** Duplicate headings reduce content uniqueness and confuse navigation
- **Severity:** info
- **Weight:** 4
- **Required Input:** All heading texts
- **Expected Output:** Pass if all headings are unique
- **Pass Criteria:** All heading texts are unique (case-insensitive)
- **Fail Criteria:** Two or more headings have identical text
- **Recommendation:** "Make each heading unique to improve content structure."
- **Passing Example:** All headings have different text
- **Failing Example:** Five headings all say "Details" or "Features"

### HDG-008: Heading Text Is Meaningful
- **Purpose:** Ensure headings are descriptive, not generic
- **Why it matters:** Generic headings ("Section", "Info") provide no context to users or search engines
- **Severity:** info
- **Weight:** 4
- **Required Input:** All heading texts
- **Expected Output:** Pass if all headings are >= 5 chars and not generic
- **Pass Criteria:** All headings >= `minHeadingLength` and not in generic list
- **Fail Criteria:** Generic terms or too short
- **Recommendation:** "Use specific, descriptive headings instead of generic terms."
- **Passing Example:** `<H2>Property Amenities</H2>`, `<H3>Location Highlights</H3>`
- **Failing Example:** `<H2>Section</H2>`, `<H3>Info</H3>`, `<H4>Click</H4>`

### HDG-009: Recommended Number of H2 Headings
- **Purpose:** Ensure adequate H2 count for content structure
- **Why it matters:** H2s break content into scannable sections; too few indicates poor structure
- **Severity:** info
- **Weight:** 4
- **Required Input:** `headings` array
- **Expected Output:** Pass if H2 count >= recommended (default 5)
- **Pass Criteria:** `h2Count >= recommendedH2Count`
- **Fail Criteria:** `h2Count < minH2Count` (warning) or `< recommendedH2Count` (info)
- **Recommendation:** "Add more H2 headings to break content into sections (recommended: 5+)."
- **Passing Example:** 6 H2 headings for a property page
- **Failing Example:** 0-1 H2 headings

### HDG-010: No Empty Headings
- **Purpose:** Detect and flag all empty headings (not just H1)
- **Why it matters:** Empty headings at any level create gaps in document structure
- **Severity:** warning
- **Weight:** 6
- **Required Input:** All heading texts
- **Expected Output:** Pass if no headings are empty
- **Pass Criteria:** All headings have `text.trim().length > 0`
- **Fail Criteria:** Any heading is empty or whitespace only
- **Recommendation:** "Remove empty headings or add descriptive text."
- **Passing Example:** All headings have content
- **Failing Example:** `<H2></H2>` or `<H3>   </H3>` anywhere in document

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
| HDG-001 | critical | 10 |
| HDG-002 | critical | 10 |
| HDG-003 | warning | 8 |
| HDG-004 | warning | 6 |
| HDG-005 | warning | 6 |
| HDG-006 | warning | 6 |
| HDG-007 | info | 4 |
| HDG-008 | info | 4 |
| HDG-009 | info | 4 |
| HDG-010 | warning | 6 |

**Example Calculations:**
- Perfect headings (1 H1, 5 H2s, proper hierarchy, keywords): Score = 100
- Missing H1 (HDG-001 fails): Score = 75 (25 penalty)
- Multiple issues (3 warnings + 2 info): Score = 66 (34 penalty)
- Empty H1 + multiple H1s: Score = 50 (50 penalty)

**Passing Threshold:** 70

---

## 7. Edge Cases

| Scenario | Behavior |
|----------|----------|
| `headings: []` | HDG-001 fails (critical), HDG-009 fails |
| `headings: undefined` | HDG-001 fails |
| `headings: null` | Treated as undefined |
| H1 text is `""` | HDG-002 fails |
| H1 text is `"   "` | Trimmed; HDG-002 fails |
| Multiple H1s | HDG-001 fails |
| No H2s | HDG-009 fails (info) |
| H1 → H3 (skip H2) | HDG-005, HDG-006 fail |
| Duplicate "Details" headings | HDG-007 fails |
| Unicode headings (Hindi, Chinese) | Counted normally |
| Emoji headings | Counted; may fail HDG-008 if too short |
| HTML entities (`&`, `<`) | Counted as-is |
| Very long H1 (200+ chars) | HDG-003 fails |
| Very short H1 (5 chars) | HDG-003 fails |
| Hidden headings (CSS `display: none`) | Not detected; analyzed as-is |
| Dynamically inserted headings | Analyzed if in `headings` array |
| Headings with only numbers | HDG-008 may flag as not meaningful |
| Headings with special chars | Analyzed normally |
| Mixed case headings | Case-insensitive duplicate detection |
| Nested heading structure | Flattened for analysis |
| Headings in different languages | Each analyzed independently |

---

## 8. Error Handling

| Error Condition | Behavior |
|-----------------|----------|
| `headings` not array | Treated as empty; HDG-001 fails |
| `level` not 1-6 | Heading skipped; logged |
| `text` not string | Treated as empty; HDG-010 flags |
| `text` is undefined | Treated as empty |
| Invalid config values | Defaults used; warning logged |
| Plugin timeout | Return partial results with error |
| Circular references in children | Skipped; logged |

**Logging:**
- Log HDG-001 failures (data integrity issue)
- Log HDG-002 failures (critical content issue)
- Log HDG-005/006 failures (accessibility impact)
- Do not log full heading text in production (privacy)

**Graceful Degradation:**
- If heading order cannot be determined, analyze as flat list
- If children structure is malformed, flatten to array
- Missing metadata (id, children) does not block analysis

---

## 9. Performance Requirements

| Metric | Target |
|--------|--------|
| Max execution time | 100ms |
| Max memory | 1MB |
| Complexity | O(n) where n = heading count |
| Batch throughput | 1000 pages/second |
| Scalability | Stateless; parallel execution supported |
| Max heading depth | 6 levels (H1-H6) |
| Max heading count | No hard limit; warn if >100 |

---

## 10. Test Plan (50 Tests)

**Core Functionality (1-6):**
1. analyzeHeadings undefined returns missing H1 issue
2. analyzeHeadings empty array returns missing H1 issue
3. analyzeHeadings null treated as undefined
4. analyzeHeadings valid array with one H1 passes HDG-001
5. analyzeHeadings multiple H1s fails HDG-001
6. analyzeHeadings no H1 fails HDG-001

**H1 Existence (7-11):**
7. Exactly one H1 returns success
8. Zero H1s returns critical
9. Two H1s returns critical
10. Three+ H1s returns critical
11. H1 count reported correctly in metadata

**H1 Empty (12-16):**
12. H1 with text passes HDG-002
13. H1 empty string fails HDG-002
14. H1 whitespace only fails HDG-002
15. H1 with HTML entities passes
16. H1 with emoji passes

**H1 Length (17-23):**
17. H1 < 20 chars returns warning
18. H1 20-70 chars returns success
19. H1 > 70 chars returns warning
20. H1 exactly 20 chars passes
21. H1 exactly 70 chars passes
22. Custom minLength respected
23. Custom maxLength respected

**H1 Keywords (24-29):**
24. Target keyword found in H1 returns success
25. Target keyword missing from H1 returns warning
26. Multiple keywords, partial match returns success
27. Case-insensitive keyword matching
28. Empty keywords array skips check
29. requireKeywordInH1=false skips check

**Heading Hierarchy (30-35):**
30. H1 → H2 → H3 passes HDG-005
31. H1 → H3 (skipped H2) fails HDG-005
32. H1 → H2 → H4 (skipped H3) fails HDG-005
33. H2 before H1 fails HDG-005
34. Proper nested structure passes
35. Flat structure with correct order passes

**Skipped Levels (36-40):**
36. Consecutive +1 level transitions pass HDG-006
37. +2 level transition fails HDG-006
38. +3 level transition fails HDG-006
39. Same level consecutive passes
40. -1 level (going back) passes

**Duplicate Headings (41-45):**
41. All unique headings returns success HDG-007
42. Two identical headings returns info
43. Multiple duplicate pairs returns info
44. Case-insensitive duplicate detection
45. allowDuplicateHeadings=true skips check

**Meaningful Text (46-50):**
46. Descriptive headings pass HDG-008
47. Generic "Section" fails HDG-008
48. Generic "Info" fails HDG-008
49. Heading < 5 chars fails HDG-008
50. Heading with numbers only may fail

**H2 Count (51-55):**
51. 5+ H2s returns success HDG-009
52. 2-4 H2s returns info (below recommended)
53. 0-1 H2s returns info (below minimum)
54. Custom minH2Count respected
55. Custom recommendedH2Count respected

**Empty Headings (56-60):**
56. No empty headings passes HDG-010
57. Empty H2 fails HDG-010
58. Empty H3 fails HDG-010
59. Whitespace-only heading fails
60. Multiple empty headings all flagged

**Scoring (61-66):**
61. Perfect headings score 100
62. Missing H1 scores below 100
63. Multiple warnings calculate penalty
64. Critical failure = failed status
65. Info issues don't affect pass/fail threshold
66. Score capped at 0 minimum

**Edge Cases (67-72):**
67. Unicode headings counted correctly
68. Emoji headings handled
69. HTML entities counted as-is
70. Very long headings handled
71. Very short headings handled
72. Mixed language headings handled

**Output Contract (73-78):**
73. Returns totalHeadings in metadata
74. Returns h1Count, h2Count, etc.
75. Returns hasH1 boolean
76. Returns h1Text string
77. Returns h1Length number
78. Returns skippedLevels array

---

## 11. Acceptance Criteria

- [ ] `npm run build` passes
- [ ] `npm run test` passes (50+ tests)
- [ ] Zero TypeScript errors
- [ ] Reuses existing `SeoPlugin` interface
- [ ] Reuses existing `SeoCheckResult` type
- [ ] Reuses existing scoring utilities
- [ ] Reuses existing text helpers (`slugify`, `normalize`, etc.)
- [ ] Uses `definePlugin` and `analyzerOutput`
- [ ] No new dependencies
- [ ] Deterministic behavior
- [ ] Follows code style (no `any`, JSDoc)
- [ ] Exports from `analyzer/index.ts`
- [ ] Category is `"headings"` or `"content"`

---

## 12. Future Extensions

| Extension | Priority |
|-----------|----------|
| AI-Generated Heading Suggestions | High |
| Heading-to-TOC Generator | Medium |
| Readability Score Integration | Medium |
| Heading Keyword Density Analysis | Low |
| Heading Order Optimization | Medium |
| Multi-language Heading Support | Low |
| Heading Length Distribution Analysis | Low |
| Heading Hierarchy Visualization | Low |
| A/B Testing Heading Variants | Future |
| Voice Search Optimization | Future |
| Featured Snippet Optimization | High |
| Heading Sentiment Analysis | Low |

---

## Accessibility Section

### Why Heading Hierarchy Matters for Accessibility

Proper heading structure is critical for users of assistive technologies, particularly screen readers. Here's why the Heading Analyzer reports accessibility-related issues alongside SEO findings:

**Screen Reader Navigation:**
- Screen reader users navigate by headings (jump from H1 to H2 to H3)
- Skipped levels (H1 → H4) create confusion and disorientation
- Missing H1 leaves users without context for page content
- Duplicate headings make navigation ambiguous

**Document Outline:**
- Assistive technologies build a document outline from headings
- Proper hierarchy (H1 → H2 → H3) creates a logical tree structure
- Skipping levels breaks the outline and makes content hard to navigate
- Empty headings create gaps in the outline

**WCAG 2.1 Compliance:**
- **Success Criterion 1.3.1 (Info and Relationships):** Headings must be used correctly to convey structure
- **Success Criterion 2.4.6 (Headings and Labels):** Headings must be descriptive
- **Success Criterion 2.4.10 (Section Headings):** Section headings should be used to organize content

**Best Practices for Accessible Headings:**
1. Use exactly one H1 per page (page title)
2. Follow sequential order (H1 → H2 → H3, not H1 → H4)
3. Make headings descriptive and meaningful
4. Avoid duplicate headings when possible
5. Do not use headings for styling only (use CSS classes)
6. Ensure all headings have content (no empty headings)

**How This Analyzer Helps:**
- HDG-001 (Exactly One H1): Ensures single entry point for screen readers
- HDG-005/006 (Hierarchy/Skipped Levels): Maintains logical document outline
- HDG-008 (Meaningful Text): Ensures headings provide context
- HDG-010 (No Empty Headings): Prevents gaps in navigation

**SEO + Accessibility Alignment:**
- Search engines and screen readers both benefit from clear hierarchy
- Keyword-rich headings help SEO; descriptive headings help accessibility
- Proper structure improves both crawlability and navigability
- This analyzer serves both audiences simultaneously

---

## Open Questions

1. **H1 vs Title Tag:** Should H1 be compared to `<title>` tag for consistency? If they differ significantly, should that be flagged?

2. **Multiple H1s in HTML5:** HTML5 technically allows multiple H1s (one per `<section>`). Should the analyzer be strict (always one H1) or lenient (allow multiple in sections)?

3. **Hidden Headings:** Should headings hidden via CSS (`display: none`, `visibility: hidden`) be flagged? They may be used for screen readers only.

4. **Heading Length Units:** Should length be measured in characters, words, or both? Current spec uses characters.

5. **Generic Heading List:** What terms should be considered "generic"? Current list: "Section", "Info", "Details", "Features", "Click", "More". Should this be configurable?

6. **Keyword in H1 Requirement:** Should location (city/locality) be required in H1 for real estate, or just property type?

7. **H2 Count Thresholds:** Are 2-5 H2s appropriate thresholds for property pages? Should this vary by property type or content length?

8. **Nested vs Flat Structure:** Should the analyzer preserve and validate nested heading structure (children array) or flatten to sequential order?

9. **Heading ID Generation:** Should the analyzer generate IDs for headings to track duplicates, or rely on text comparison only?

10. **PageSignals Integration:** Should `h1Count`, `h2Count`, etc. be populated in PageSignals by a crawler, or calculated by the analyzer from the `headings` array?

---

## Final Report

### 1. File Created
- `docs/rfcs/RFC-006-Heading-Analyzer.md`

### 2. Executive Summary
RFC-006 defines the Heading Analyzer with 10 rules (HDG-001 through HDG-010) covering H1 existence and uniqueness, H1 content quality (empty, length, keywords), heading hierarchy validation, skipped level detection, duplicate detection, meaningful text validation, H2 count recommendations, and empty heading detection at all levels. The specification follows RFC-002/003/004/005 patterns and integrates with existing SEO Engine architecture. The analyzer serves both SEO and accessibility audiences, ensuring proper document structure for search engines and screen readers.

### 3. Ambiguities Found

| Ambiguity | Impact |
|-----------|--------|
| Multiple H1s in HTML5 | HTML5 allows multiple H1s per section; should analyzer be strict or lenient? |
| Hidden headings | CSS-hidden headings may be intentional for screen readers |
| Generic heading list | No standard list of "generic" terms; needs configuration |
| H1 vs Title tag | Should consistency between H1 and `<title>` be validated? |
| Nested vs flat structure | Should children array be validated or flattened? |
| Heading length units | Characters vs words for length validation |
| Keyword requirements | Should location be required in H1 for real estate? |

### 4. Open Questions Before Implementation

1. **HTML5 Multiple H1s:** Should the analyzer enforce one H1 per page (strict) or allow multiple H1s in `<section>` elements (HTML5 spec)?

2. **Hidden Headings:** Should headings with CSS `display: none` or `visibility: hidden` be flagged, ignored, or require pre-filtering?

3. **H1-Title Consistency:** Should a new rule (HDG-011) compare H1 text to `<title>` tag and flag significant differences?

4. **Generic Terms Configuration:** Should the list of generic terms ("Section", "Info", etc.) be hardcoded or configurable via options?

5. **H2 Count Thresholds:** Should minH2Count and recommendedH2Count vary based on content length or property type?

6. **Nested Structure Validation:** Should the analyzer validate the `children` nested structure or flatten all headings to sequential order?

7. **Heading ID Tracking:** Should IDs be generated for duplicate detection, or is text comparison sufficient?

8. **Accessibility Weight:** Should accessibility-related rules (HDG-005, HDG-006, HDG-010) have higher weights due to WCAG compliance?

9. **Unicode/Emoji Handling:** Should emoji-only headings fail HDG-008 (meaningful text)? Should Unicode be treated differently?

10. **PageSignals Population:** Should the crawler populate `h1Count`, `h2Count`, etc. in PageSignals, or should the analyzer calculate these from the `headings` array?

---

**END OF RFC-006**