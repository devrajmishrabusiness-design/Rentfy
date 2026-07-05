# RFC-005: Schema Analyzer

**RFC ID:** RFC-005  
**Status:** Approved for Implementation  
**Version:** 1.0.0  
**Last Updated:** 2026-07-06  
**Author:** SEO Engine Team  

---

## 1. Purpose

The Schema Analyzer evaluates JSON-LD structured data (Schema.org) for real estate property pages. It validates schema presence, type correctness, required properties, and data completeness to ensure optimal search engine understanding and rich snippet eligibility.

**Problems Solved:**
- Missing JSON-LD structured data
- Invalid schema types for real estate
- Missing required/recommended properties
- Incorrect property values or formats
- Incomplete address/geolocation data
- Missing offer/pricing information
- Broken schema references

**Explicitly Does NOT Do:**
- Generate or fix schemas (future Generator phase)
- Validate Microdata or RDFa formats (JSON-LD only)
- Modify page content (read-only)
- Cross-validate with actual page content
- Schema markup injection

---

## 2. Scope

**In-Scope Fields:**
- `schemaJsonLd` (primary input)
- `@context`, `@type`, `@graph` validation
- Property-level validation for real estate schemas
- Nested object validation (address, geo, offers)

**Out-of-Scope:**
- Microdata, RDFa, other schema formats
- Non-real-estate schema types (unless mixed)
- Schema generation or repair
- Content-to-schema validation
- Performance metrics, images, links

---

## 3. Input Contract

**PageSignals:** Receives standard engine input with `schemaJsonLd?: string | object`

**SchemaAnalyzerOptions:**
```typescript
{
  requireSchema?: boolean (default: true)
  allowedTypes?: string[] (default: ["RealEstateListing", "Product"])
  requireAddress?: boolean (default: true)
  requirePrice?: boolean (default: true)
  requireGeo?: boolean (default: false)
  requireImages?: boolean (default: false)
  validateNested?: boolean (default: true)
  strictMode?: boolean (default: false)
}
```

---

## 4. Output Contract

Returns `SeoCheckResult` (existing type):
```typescript
{
  checkId: "schema-analyzer"
  summary: string
  issues: SeoIssue[]
  passed: boolean
}
```

Extended metadata: `schemaFound`, `schemaType`, `schemaCount`, `score`, `hasAddress`, `hasPrice`, `hasGeo`, `hasImages`, `propertyCount`, `errorCount`

---

## 5. Rule Catalogue

| ID | Name | Severity | Weight | Pass Criteria |
|----|------|----------|--------|---------------|
| SCH-001 | Schema Exists | critical | 10 | schemaJsonLd !== undefined |
| SCH-002 | Valid JSON | critical | 10 | JSON.parse() succeeds |
| SCH-003 | Valid @context | critical | 8 | @context === "https://schema.org" |
| SCH-004 | Valid Schema Type | critical | 10 | @type in allowedTypes |
| SCH-005 | Has Required Properties | warning | 6 | name, description present |
| SCH-006 | Has Address | warning | 6 | address with PostalAddress |
| SCH-007 | Has Price/Offer | warning | 6 | offers with price |
| SCH-008 | Has Geo Coordinates | info | 4 | geo with latitude/longitude |
| SCH-009 | Has Images | info | 4 | image array with URLs |
| SCH-010 | No Schema Errors | critical | 8 | No parsing/validation errors |

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

- Empty string → SCH-001 fails
- Null/undefined → SCH-001 fails
- Invalid JSON → SCH-002 fails, graceful degradation
- Missing @context → SCH-003 fails
- Multiple @types (array) → validates each
- @graph with multiple schemas → validates all
- Nested schema references → validates if validateNested=true
- Relative URLs in image → counted as present (not validated)
- Price as string vs number → both accepted

---

## 8. Error Handling

- Non-string/non-object input → treated as undefined
- JSON parse errors → logged, SCH-002 fails
- Invalid config → defaults used
- Missing nested properties → reported as missing, not error
- Plugin failures → logged, pipeline continues
- Circular references → detected, validation skipped for that branch

---

## 9. Performance Requirements

- Max execution: 500ms
- Max memory: 10MB
- Complexity: O(n) where n = schema property count
- Scalability: stateless, supports batch processing
- Max schema depth: 10 levels (prevents stack overflow)

---

## 10. Test Plan (45 tests)

**Core Functionality:**
1. analyzeSchema undefined returns missing issue
2. analyzeSchema empty string returns missing issue
3. analyzeSchema valid JSON-LD returns success
4. analyzeSchema object input accepted

**JSON Validation:**
5. Invalid JSON returns parse error
6. Malformed brackets detected
7. Unclosed strings detected
8. Valid JSON with null values passes parsing

**Context Validation:**
9. Correct @context passes
10. Missing @context fails SCH-003
11. Wrong @context URL fails
12. @context as object (advanced) passes

**Schema Type Validation:**
13. RealEstateListing type passes
14. Product type passes
15. Invalid type fails SCH-004
16. Multiple types (array) validates all
17. Custom allowedTypes configuration

**Required Properties:**
18. Has name and description passes SCH-005
19. Missing name fails SCH-005
20. Missing description fails SCH-005
21. Empty string properties treated as missing

**Address Validation:**
22. Complete PostalAddress passes SCH-006
23. Missing address fails SCH-006
24. Address without PostalAddress type fails
25. Partial address (street only) passes with warning
26. requireAddress=false skips check

**Price/Offer Validation:**
27. Offer with price passes SCH-007
28. Missing offers fails SCH-007
29. Offer without price fails
30. Price as string accepted
31. Price as number accepted
32. requirePrice=false skips check

**Geo Coordinates:**
33. Complete GeoCoordinates passes SCH-008
34. Missing geo returns info (not warning)
35. Invalid latitude fails nested validation
36. Invalid longitude fails nested validation
37. requireGeo=false skips check (default)

**Images:**
38. Image array with URLs passes SCH-009
39. Single image string passes
40. Missing images returns info
41. Empty image array returns info
42. requireImages=false skips check (default)

**Schema Errors:**
43. No errors returns success SCH-010
44. Validation errors detected and reported
45. Multiple schemas in @graph all validated

**Scoring:**
46. Perfect schema scores 100
47. Missing schema scores 90
48. Multiple issues calculates correct penalty
49. Critical errors reduce score significantly

**Edge Cases:**
50. @graph with mixed schema types
51. Nested schema references validated
52. Circular references handled gracefully
53. Unicode in property values
54. Very large schemas (1000+ properties)

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

- Schema generation from page content
- Cross-validation (schema vs actual content)
- Microdata and RDFa support
- Custom schema type definitions
- Schema comparison across listings
- Rich snippet preview generation
- Automated schema repair suggestions
- Multi-language schema support

---

## Appendix A: Schema Types Reference

**Primary Types:**
- `RealEstateListing` - Primary type for property listings
- `Product` - Alternative for properties as products
- `Place` - For location-focused schemas
- `House`, `Apartment`, `SingleFamilyResidence` - Specific property types

**Nested Types:**
- `PostalAddress` - Street, addressLocality, addressRegion, postalCode
- `GeoCoordinates` - latitude, longitude
- `Offer` - price, priceCurrency, availability
- `ImageObject` - url, caption, contentUrl

**Recommended Properties:**
- `name` - Property title
- `description` - Property description
- `image` - Array of image URLs
- `address` - PostalAddress object
- `geo` - GeoCoordinates object
- `offers` - Offer object or array
- `numberOfRooms`, `numberOfBathroomsTotal`, `floorSize`

---

## Appendix B: Example Valid Schema

```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "Modern 3BR Apartment in Downtown",
  "description": "Beautiful apartment with city views",
  "image": [
    "https://example.com/img1.jpg",
    "https://example.com/img2.jpg"
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "Seattle",
    "addressRegion": "WA",
    "postalCode": "98101"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 47.6062,
    "longitude": -122.3321
  },
  "offers": {
    "@type": "Offer",
    "price": 450000,
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "numberOfRooms": 3,
  "numberOfBathroomsTotal": 2,
  "floorSize": {
    "@type": "QuantitativeValue",
    "value": 1200,
    "unitCode": "FTK"
  }
}
```

---

## Appendix C: Open Questions

1. **Nested Validation Depth:** Should nested schema validation be recursive (unlimited depth) or single-level only? Current spec: max 10 levels.

2. **Multiple Schemas:** How should we handle `@graph` with multiple schema objects? Validate all and aggregate scores? Report worst? Current spec: validate all, aggregate issues.

3. **Unknown Schema Types:** Should we flag unknown @type values as warnings, or ignore them if they pass structural validation? Current spec: ignore if structural validation passes.

4. **JSON Parsing Location:** Should JSON parsing be done by the crawler (pre-parsed object) or by the analyzer (raw string)? Current spec: accepts both string and object.

5. **Schema Generation:** Should future Generator phase create schemas from page content, or only validate existing ones? Current spec: validation only.

6. **Strict Mode:** What additional validations should strictMode enable? Current spec: undefined, to be determined during implementation.

7. **Cross-Validation:** Should we validate that schema data matches actual page content (e.g., price in schema = price on page)? Current spec: out of scope.

8. **Performance Threshold:** Is 500ms sufficient for complex schemas with deep nesting? May need adjustment after benchmarking.