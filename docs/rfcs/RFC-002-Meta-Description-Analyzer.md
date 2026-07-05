# RFC-002: Meta Description Analyzer

**RFC ID:** RFC-002  
**Status:** Approved for Implementation  
**Version:** 1.0.0  
**Last Updated:** 2026-07-05  
**Author:** SEO Engine Team  

---

## 1. Purpose

The Meta Description Analyzer evaluates `<meta name="description">` tags against SEO best practices for real estate listings. It produces structured reports with pass/fail determination, numeric scores (0-100), severity-ranked findings, and actionable recommendations.

**Problems Solved:**
- Missing/empty descriptions
- Incorrect length (not 140-160 chars)
- Missing keywords, location, property type
- Duplicate descriptions across listings
- Poor formatting (ALL CAPS, excessive punctuation, repeated words)

**Explicitly Does NOT Do:**
- Generate descriptions (future Generator phase)
- Modify page content (read-only)
- Validate HTML syntax
- Keyword density analysis (separate plugin)
- NLP/semantic analysis

---

## 2. Scope

**In-Scope Fields:**
- `metaDescription` (primary)
- `title` (cross-reference)
- `city`, `locality`, `propertyType`, `targetKeywords` (via options)

**Out-of-Scope:**
- canonical, robots, links, images, OpenGraph, structured data, performance metrics

---

## 3. Input Contract

**PageSignals:** Receives standard engine input with `metaDescription?: string`

**MetaDescriptionAnalyzerOptions:**
```typescript
{
  minLength?: number (default: 140)
  maxLength?: number (default: 160)
  idealLength?: number (default: 150)
  targetKeywords?: string[]
  city?: string
  locality?: string
  propertyType?: string
  requireLocation?: boolean (default: true)
  requirePropertyType?: boolean (default: true)
  duplicateDescriptionStore?: DuplicateDescriptionStore
}
```

---

## 4. Output Contract

Returns `SeoCheckResult` (existing type):
```typescript
{
  checkId: "meta-description-analyzer"
  summary: string
  issues: SeoIssue[]
  passed: boolean
}
```

Extended metadata: `descriptionLength`, `score`, `hasLocation`, `hasPropertyType`, `foundKeywords`, `missingKeywords`, `isDuplicate`, `duplicateEntries`

---

## 5. Rule Catalogue

| ID | Name | Severity | Weight | Pass Criteria |
|----|------|----------|--------|---------------|
| MD-001 | Meta Description Exists | critical | 10 | metaDescription !== undefined |
| MD-002 | Not Empty | critical | 10 | trim().length > 0 |
| MD-003 | Length 140-160 | warning | 8 | 140 <= length <= 160 |
| MD-004 | Contains Primary Keyword | warning | 6 | At least one target keyword found |
| MD-005 | Contains City/Locality | warning | 6 | city or locality in description |
| MD-006 | Contains Property Type | warning | 6 | propertyType in description |
| MD-007 | Duplicate Detection | critical | 10 | No duplicates (interface only) |
| MD-008 | No Excessive Punctuation | warning | 4 | No 3+ repeated punctuation |
| MD-009 | No ALL CAPS | warning | 4 | Contains lowercase letters |
| MD-010 | No Repeated Words | info | 2 | No word >3 times (excl. stopwords) |

---

## 6. Score Calculation

```
Base: 100
Penalty: critical=10, warning=weight, info=2
Final: max(0, 100 - totalPenalty)
```

Max penalty: 66 points. Passing threshold: 70.

---

## 7. Edge Cases

- Empty string → MD-002 fails
- Null/undefined → MD-001 fails
- Whitespace → trimmed before analysis
- Unicode/emoji → counted as characters
- HTML entities → counted as-is (not decoded)
- HTML tags → counted as characters

---

## 8. Error Handling

- Non-string input → treated as undefined
- Invalid config → defaults used
- Invalid store → duplicate check skipped
- Plugin failures → logged, pipeline continues

---

## 9. Performance Requirements

- Max execution: 500ms
- Max memory: 10MB
- Complexity: O(n) where n = description length
- Scalability: stateless, supports batch processing

---

## 10. Test Plan (35+ tests)

**Core Functionality:**
1. analyzeDescription undefined returns missing issue
2. analyzeDescription empty string returns empty issue
3. analyzeDescription whitespace returns empty issue
4. analyzeDescription valid returns success

**Length Rules:**
5. Length < 140 returns too short warning
6. Length 140-160 returns success
7. Length > 160 returns too long warning
8. Length exactly 140 passes
9. Length exactly 160 passes

**Keyword Rules:**
10. Target keyword found returns success
11. Target keyword missing returns warning
12. Multiple keywords partial match
13. Empty keywords array skips check

**Location Rules:**
14. City found returns success
15. Locality found returns success
16. Neither found returns warning
17. City not provided skips check

**Property Type Rules:**
18. Property type found returns success
19. Property type missing returns warning
20. Property type not provided skips check

**Duplicate Rules:**
21. Duplicate found returns critical
22. Unique description returns success
23. No store provided returns info

**Punctuation Rules:**
24. Excessive !!! returns warning
25. Excessive ??? returns warning
26. Excessive ... returns warning
27. Normal punctuation passes

**Case Rules:**
28. ALL CAPS returns warning
29. Mixed case passes
30. Lowercase passes

**Repeated Words:**
31. Word repeated 4+ times returns info
32. Stopwords excluded from check
33. No repetition passes

**Scoring:**
34. Perfect description scores 100
35. Missing description scores 90
36. Multiple issues calculates correct penalty

**Edge Cases:**
37. Unicode characters counted correctly
38. HTML entities counted as-is
39. Null treated as undefined

---

## 11. Acceptance Criteria

- [ ] npm run build passes
- [ ] npm run test passes
- [ ] Zero TypeScript errors
- [ ] Reuses existing architecture
- [ ] Reuses existing scoring
- [ ] Reuses existing helpers
- [ ] No new dependencies

---

## 12. Future Extensions

- AI-assisted optimization
- Rich snippet generation
- Multi-language support
- Keyword stuffing detection
- Sentiment analysis