# RFC-003: URL Analyzer

**RFC ID:** RFC-003  
**Status:** Draft  
**Version:** 1.0.0  
**Last Updated:** 2026-07-05  
**Author:** SEO Engine Team  
**Related:** SEO_ENGINE_SPEC.md (Section 10), RFC-002

---

## 1. Purpose

The URL Analyzer evaluates property listing URL slugs against SEO best practices. It analyzes URL structure, formatting, keyword presence, and technical correctness to ensure maximum search engine visibility.

**Problems Solved:**
- Missing URL slugs
- Uppercase characters (case-sensitivity issues)
- Wrong separators (underscores, spaces instead of hyphens)
- Missing location keywords (city, locality)
- Missing property type
- Duplicate hyphens
- Special characters requiring encoding
- URLs too long or too short
- Query parameters in canonical slugs

**Explicitly Does NOT Do:**
- Modify URLs (read-only analysis)
- Generate URL slugs (future Generator phase)
- Validate URL existence (HTTP status checking)
- Check redirect chains
- Analyze domain structure
- Evaluate SSL/HTTPS

---

## 2. Scope

**In-Scope Fields:**
- `urlSlug` (primary)
- `fullUrl` (optional, for context)
- `city`, `locality`, `propertyType` (via options)

**Out-of-Scope:**
- Domain, protocol, subdomain analysis
- Query parameter values (only presence detected)
- Hash fragments
- URL depth/site architecture

**Configuration Options:**
```typescript
{
  minLength?: number (default: 20)
  maxLength?: number (default: 80)
  idealLength?: number (default: 50)
  requireCity?: boolean (default: true)
  requireLocality?: boolean (default: false)
  requirePropertyType?: boolean (default: true)
  city?: string
  locality?: string
  propertyType?: string
  allowedSpecialChars?: string
}
```

---

## 3. Input Contract

**Primary Input:** `urlSlug?: string`

| Field | Type | Required | Default if Missing |
|-------|------|----------|-------------------|
| `urlSlug` | `string` | No | URL-001 fails |
| `fullUrl` | `string` | No | Extracted slug used |

**Context Fields (via options):**

| Field | Type | Default Behavior |
|-------|------|------------------|
| `city` | `string` | URL-004 cannot pass if missing |
| `locality` | `string` | URL-005 skipped if not provided |
| `propertyType` | `string` | URL-006 cannot pass if missing |

---

## 4. Output Contract

**Primary Output:** `SeoCheckResult` (existing type)

```typescript
{
  checkId: "url-analyzer"
  summary: string
  issues: SeoIssue[]
  passed: boolean
}
```

**Extended Metadata:**
- `urlSlug`: string (normalized)
- `slugLength`: number
- `score`: number (0-100)
- `hasCity`: boolean
- `hasLocality`: boolean
- `hasPropertyType`: boolean
- `isLowercase`: boolean
- `hasHyphens`: boolean
- `hasDuplicateHyphens`: boolean
- `hasSpecialChars`: boolean
- `hasQueryParams`: boolean

---

## 5. Rule Catalogue

| ID | Name | Severity | Weight | Pass Criteria |
|----|------|----------|--------|---------------|
| URL-001 | URL Exists | critical | 10 | urlSlug !== undefined |
| URL-002 | Uses Lowercase | warning | 6 | No uppercase letters |
| URL-003 | Uses Hyphens | warning | 6 | Hyphens as separators |
| URL-004 | Contains City | warning | 6 | City in slug |
| URL-005 | Contains Locality | warning/info | 4-6 | Locality in slug |
| URL-006 | Contains Property Type | warning | 6 | Property type in slug |
| URL-007 | No Duplicate Hyphens | warning | 4 | No `--` or more |
| URL-008 | No Special Characters | warning | 6 | Only a-z, 0-9, -, / |
| URL-009 | Length 20-80 Chars | warning | 8 | 20 <= length <= 80 |
| URL-010 | No Query Parameters | warning | 6 | No `?` or `&` |

### Rule Details

**URL-001: URL Exists**
- Purpose: Verify URL slug is provided
- Why: Missing URLs block all SEO value
- Pass: `urlSlug !== undefined`
- Fail: `urlSlug === undefined`
- Example Pass: `/rent/noida/sector-62/3bhk`
- Example Fail: `undefined`

**URL-002: Uses Lowercase**
- Purpose: Ensure all alphabetic chars are lowercase
- Why: URLs are case-sensitive; mixed case causes duplicate content
- Pass: No A-Z characters
- Fail: Any uppercase letter
- Example Pass: `/rent/noida/sector-62`
- Example Fail: `/Rent/Noida/Sector-62`

**URL-003: Uses Hyphens**
- Purpose: Verify hyphens as word separators
- Why: Search engines treat hyphens as separators, underscores join words
- Pass: Hyphens between words, no underscores
- Fail: Underscores, spaces, or camelCase
- Example Pass: `/rent/sector-62/3bhk-apartment`
- Example Fail: `/rent/sector_62/3bhk_apartment`

**URL-004: Contains City**
- Purpose: Verify city name in slug
- Why: Strong local SEO signal
- Pass: City found (case-insensitive)
- Fail: City not found
- Example Pass: City="Noida" → `/rent/noida/...`
- Example Fail: City="Noida" → `/rent/sector-62/...`

**URL-005: Contains Locality**
- Purpose: Verify neighborhood/sector in slug
- Why: Granular local SEO signal
- Pass: Locality found
- Fail: Locality not found (if required)
- Example Pass: Locality="Sector 62" → `/rent/noida/sector-62/...`
- Example Fail: Locality="Sector 62" → `/rent/noida/...`

**URL-006: Contains Property Type**
- Purpose: Verify property type in slug
- Why: Key user intent signal
- Pass: Property type found
- Fail: Property type not found
- Example Pass: Type="3BHK" → `/rent/.../3bhk-apartment`
- Example Fail: Type="3BHK" → `/rent/.../luxury-property`

**URL-007: No Duplicate Hyphens**
- Purpose: Detect `--` or more consecutive hyphens
- Why: Appears unprofessional, may indicate errors
- Pass: No `--`
- Fail: Contains `--` or `---`
- Example Pass: `/rent/noida/sector-62`
- Example Fail: `/rent/noida/sector--62`

**URL-008: No Special Characters**
- Purpose: Detect invalid characters
- Why: Special chars must be encoded, make URLs unreadable
- Pass: Only a-z, 0-9, hyphen, forward slash
- Fail: @, #, !, %, etc.
- Example Pass: `/rent/noida/sector-62/3bhk`
- Example Fail: `/rent/noida/sector-62/3bhk@home`

**URL-009: Length 20-80 Characters**
- Purpose: Enforce optimal URL length
- Why: Too short lacks keywords; too long is truncated
- Pass: 20 <= length <= 80
- Fail: < 20 or > 80
- Example Pass: 38 chars → `/rent/noida/sector-62/3bhk-apartment`
- Example Fail: 140+ chars → overly long slug

**URL-010: No Query Parameters**
- Purpose: Detect `?` or `&` in slug
- Why: Query params cause duplicate content issues
- Pass: No `?` or `&`
- Fail: Contains query string
- Example Pass: `/rent/noida/sector-62`
- Example Fail: `/rent/noida?id=123`

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
| URL-001 | critical | 10 |
| URL-002 | warning | 6 |
| URL-003 | warning | 6 |
| URL-004 | warning | 6 |
| URL-005 | warning/info | 4-6 |
| URL-006 | warning | 6 |
| URL-007 | warning | 4 |
| URL-008 | warning | 6 |
| URL-009 | warning | 8 |
| URL-010 | warning | 6 |

**Example Calculations:**
- Perfect URL: Score = 100
- Missing URL (URL-001 fails): Score = 75 (25 penalty)
- Multiple warnings (4 warnings): Score = 60 (40 penalty)

---

## 7. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Empty string `""` | URL-001 passes, URL-009 fails (too short) |
| Null | Treated as undefined; URL-001 fails |
| Undefined | URL-001 fails (critical) |
| Unicode (Hindi, Chinese) | URL-008 fails (special chars) |
| Double hyphen `--` | URL-007 fails |
| Trailing slash `/rent/` | Stripped before analysis |
| Leading slash `/rent` | Retained for context |
| URL-encoded `%20` | URL-008 fails |
| Hash `#fragment` | Should be stripped; if not, URL-008 fails |
| Query `?id=123` | URL-010 fails |
| Mixed case `Rent/Noida` | URL-002 fails |
| Long URL (>200 chars) | URL-009 fails |

---

## 8. Error Handling

| Error Condition | Behavior |
|-----------------|----------|
| `urlSlug` not a string | Treated as undefined; URL-001 fails |
| `city` not provided | URL-004 cannot pass |
| `locality` not provided | URL-005 skipped if not required |
| Invalid config values | Defaults used; warning logged |
| Plugin timeout | Return partial results with error |

**Logging:**
- Log URL-001 failures (data integrity issue)
- Log URL-008 failures with character details
- Do not log full URLs in production (privacy)

---

## 9. Performance Requirements

| Metric | Target |
|--------|--------|
| Max execution time | 100ms |
| Max memory | 1MB |
| Complexity | O(n) where n = slug length |
| Batch throughput | 1000 URLs/second |
| Scalability | Stateless; parallel execution supported |

---

## 10. Test Plan (35+ Tests)

**Core Functionality (1-5):**
1. analyzeUrl undefined returns missing issue
2. analyzeUrl null returns missing issue
3. analyzeUrl empty string returns too short
4. analyzeUrl valid slug returns success
5. analyzeUrl whitespace trimmed

**Case Rules (6-10):**
6. Uppercase letters return warning
7. All uppercase returns warning
8. All lowercase returns success
9. Mixed case returns warning
10. Numbers/hyphens with lowercase pass

**Separator Rules (11-15):**
11. Underscores return warning
12. Spaces return warning
13. CamelCase returns warning
14. Hyphens as separators return success
15. Mixed separators return warning

**Location Rules (16-22):**
16. City found returns success
17. City not found returns warning
18. City not provided returns warning
19. Locality found returns success
20. Locality not found returns warning
21. Locality not required returns info
22. Locality not provided skips check

**Property Type Rules (23-27):**
23. Property type found returns success
24. Property type missing returns warning
25. Property type not provided returns warning
26. Case-insensitive matching works
27. Multiple property types detected

**Hyphen Rules (28-32):**
28. Single hyphens pass
29. Double hyphens return warning
30. Triple hyphens return warning
31. Leading hyphen passes
32. Trailing hyphen passes

**Special Character Rules (33-38):**
33. At symbol (@) returns warning
34. Hash symbol (#) returns warning
35. Question mark (?) returns warning
36. Ampersand (&) returns warning
37. Percent-encoded chars return warning
38. Only allowed chars pass

**Length Rules (39-43):**
39. Slug < 20 chars returns warning
40. Slug 20-80 chars returns success
41. Slug > 80 chars returns warning
42. Slug exactly 20 chars passes
43. Slug exactly 80 chars passes

**Query Parameter Rules (44-47):**
44. Query string (?) returns warning
45. Ampersand returns warning
46. No query params returns success
47. Full URL with query detected

**Score Calculation (48-52):**
48. Perfect URL scores 100
49. Missing URL scores below 100
50. Multiple warnings calculate penalty
51. Critical failure = failed status
52. Info issues don't affect pass/fail

**Edge Cases (53-57):**
53. Unicode characters handled
54. URL-encoded spaces detected
55. Trailing slash stripped
56. Leading slash handled
57. Very long URL handled

---

## 11. Acceptance Criteria

- [ ] `npm run build` passes
- [ ] `npm run test` passes (35+ tests)
- [ ] Zero TypeScript errors
- [ ] Reuses existing `SeoPlugin` interface
- [ ] Reuses existing `SeoCheckResult` type
- [ ] Reuses existing scoring utilities
- [ ] Reuses existing text helpers (`slugify`, etc.)
- [ ] Uses `definePlugin` and `analyzerOutput`
- [ ] No new dependencies
- [ ] Deterministic behavior
- [ ] Follows code style (no `any`, JSDoc)

---

## 12. Future Extensions

| Extension | Priority |
|-----------|----------|
| URL Generator (auto-generate slugs) | High |
| Redirect suggestions | Medium |
| Canonical tag verification | Medium |
| URL depth analysis | Low |
| Duplicate word detection | Low |
| Stopword removal suggestions | Low |
| Transliteration (non-ASCII to ASCII) | Medium |
| URL history tracking | Low |

---

## Final Report

### 1. Files Created
- `docs/rfcs/RFC-003-URL-Analyzer.md`

### 2. Executive Summary
RFC-003 defines the URL Analyzer with 10 rules covering URL existence, case, separators, location keywords, property type, formatting, special characters, length, and query parameters. The specification follows RFC-002 patterns and integrates with existing SEO Engine architecture.

### 3. Ambiguities Found

| Ambiguity | Impact |
|-----------|--------|
| Unicode handling | URL-008 flags non-ASCII; should transliteration occur before analysis? |
| Leading/trailing hyphens | Not explicitly flagged; should they be? |
| Full URL vs slug | Should analyzer auto-extract slug from full URL? |
| City/locality matching | Should alias tables be supported? |

### 4. Questions Before Implementation

1. **Input Pre-processing**: Should the analyzer accept full URLs and extract slugs, or require pre-processed slugs?

2. **Unicode/Internationalization**: Should non-ASCII characters be flagged, allowed, or auto-transliterated?

3. **City/Locality Matching**: Should fuzzy matching or alias tables be supported beyond exact substring match?

4. **Score Calculation**: Use existing `calculateScore()` utility or implement RFC-specified weights?

5. **Duplicate Words**: Should duplicate word detection (e.g., `/rent/noida/noida/...`) be added as URL-011?

6. **Trailing/Leading Slashes**: Auto-strip, flag as issue, or document as pre-processing requirement?

7. **Property IDs**: Should numeric IDs in URLs be validated or ignored?

---

**END OF RFC-003**