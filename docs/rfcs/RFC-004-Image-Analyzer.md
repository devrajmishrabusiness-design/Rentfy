# RFC-004: Image Analyzer

**RFC ID:** RFC-004  
**Status:** Draft  
**Version:** 1.0.0  
**Last Updated:** 2026-07-05  
**Author:** SEO Engine Team  
**Related:** SEO_ENGINE_SPEC.md (Section 10), RFC-002, RFC-003

---

## 1. Purpose

The Image Analyzer evaluates property listing images against SEO and accessibility best practices. It analyzes image metadata including count, alt text quality, file formats, dimensions, file sizes, and filenames.

**Problems Solved:**
- No images on listing (IMG-001)
- Too few images (IMG-002)
- Missing hero image (IMG-003)
- Missing alt text (IMG-004)
- Meaningless alt text (IMG-005)
- Duplicate alt text (IMG-006)
- Unsupported formats (IMG-007)
- Images too small (IMG-008)
- Poor filenames (IMG-009)
- Files too large (IMG-010)

**Explicitly Does NOT Do:**
- Modify images (read-only)
- Compress or resize images
- Generate alt text (future Generator)
- Validate image content (no computer vision)
- Check image copyright
- Analyze image aesthetics
- Detect stolen images
- Lazy-loading analysis

---

## 2. Scope

**In-Scope Image Metadata:**

| Field | Type | Why Needed |
|-------|------|------------|
| `src` | `string` | Image URL for IMG-007, IMG-009 |
| `alt` | `string \| undefined` | Alt text for IMG-004, IMG-005, IMG-006 |
| `width` | `number \| undefined` | Dimensions for IMG-008 |
| `height` | `number \| undefined` | Dimensions for IMG-008 |
| `fileSize` | `number \| undefined` | File size in KB for IMG-010 |
| `format` | `string \| undefined` | File format for IMG-007 |
| `isHero` | `boolean \| undefined` | Hero image flag for IMG-003 |

**Aggregated Metadata:**
- `totalImages`: Total count for IMG-001, IMG-002
- `imagesWithAlt`: Alt text coverage for IMG-004
- `imagesWithoutAlt`: Missing alt count for IMG-004
- `uniqueAltTexts`: Uniqueness count for IMG-006

**Configuration Options:**
```typescript
{
  minImageCount?: number;        // Default: 5
  recommendedImageCount?: number; // Default: 10
  minDimension?: number;         // Default: 800 (pixels)
  maxFileSize?: number;          // Default: 200 (KB)
  allowedFormats?: string[];     // Default: ["jpg", "jpeg", "png", "webp"]
  requireHero?: boolean;         // Default: true
}
```

**Out-of-Scope:**
- `title` attribute, `loading` attribute, `srcset`, `sizes`, EXIF data, image coordinates

---

## 3. Input Contract

**Primary Input:**

```typescript
interface ImageMetadata {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  fileSize?: number; // in KB
  format?: string;
  isHero?: boolean;
}

interface ImageAnalyzerInput {
  images: ImageMetadata[];
  propertyType?: string;
  city?: string;
  locality?: string;
}
```

**Field Specifications:**

| Field | Type | Required | Default if Missing |
|-------|------|----------|-------------------|
| `images` | `ImageMetadata[]` | Yes | IMG-001 fails |
| `images[].src` | `string` | Yes | Image skipped |
| `images[].alt` | `string` | No | IMG-004 flags |
| `images[].width` | `number` | No | IMG-008 skipped |
| `images[].height` | `number` | No | IMG-008 skipped |
| `images[].fileSize` | `number` | No | IMG-010 skipped |
| `images[].format` | `string` | No | Extracted from src |
| `images[].isHero` | `boolean` | No | First image assumed hero |

**Configuration Validation:**
- `minImageCount`: Positive integer, default 5
- `recommendedImageCount`: Integer >= min, default 10
- `minDimension`: Positive integer, default 800
- `maxFileSize`: Positive number, default 200
- `allowedFormats`: Array of strings, default ["jpg", "jpeg", "png", "webp"]
- `requireHero`: Boolean, default true

---

## 4. Output Contract

**Primary Output:** `SeoCheckResult` (existing type)

```typescript
{
  checkId: "image-analyzer"
  summary: string
  issues: SeoIssue[]
  passed: boolean
}
```

**Extended Metadata:**
- `totalImages`: number
- `imagesWithAlt`: number
- `imagesWithoutAlt`: number
- `uniqueAltTexts`: number
- `hasHero`: boolean
- `heroImageIndex`: number (-1 if none)
- `averageFileSize`: number (KB)
- `largestFileSize`: number (KB)
- `averageWidth`: number (pixels)
- `averageHeight`: number (pixels)
- `formatDistribution`: Record<string, number>
- `score`: number (0-100)

---

## 5. Rule Catalogue

### IMG-001: At Least One Image Exists
- **Severity:** critical | **Weight:** 10
- **Pass:** `images.length >= 1`
- **Fail:** `images.length === 0` or undefined
- **Recommendation:** "Add at least one high-quality image."
- **Example Pass:** `[{src: "/photo.jpg", alt: "Living room"}]`
- **Example Fail:** `[]` or `undefined`

### IMG-002: Recommended Minimum Image Count
- **Severity:** warning | **Weight:** 8
- **Pass:** `images.length >= 10`
- **Fail:** `< 5` (critical) or `5-9` (warning)
- **Recommendation:** "Add more images. Recommended: 10+ images."
- **Example Pass:** 12 images
- **Example Fail:** 2 images

### IMG-003: Hero Image Exists
- **Severity:** warning | **Weight:** 6
- **Pass:** At least one image has `isHero: true`
- **Fail:** No hero marked, `requireHero: true`
- **Recommendation:** "Designate a hero image for search results."
- **Example Pass:** First image has `isHero: true`
- **Example Fail:** No hero, `requireHero: true`

### IMG-004: Every Image Has Alt Text
- **Severity:** warning | **Weight:** 8
- **Pass:** All images have non-empty `alt`
- **Fail:** One or more images missing/empty alt
- **Recommendation:** "Add descriptive alt text to all images."
- **Example Pass:** All images have alt
- **Example Fail:** 3 images have `alt: ""`

### IMG-005: Alt Text Is Meaningful
- **Severity:** info | **Weight:** 4
- **Pass:** All alt text specific, >= 10 chars, not generic
- **Fail:** Generic ("image", "photo", "room") or < 10 chars
- **Recommendation:** "Use specific descriptions, not generic terms."
- **Example Pass:** `"Master bedroom with king bed and city view"`
- **Example Fail:** `"room"`, `"image1"`, `"photo"`

### IMG-006: No Duplicate Alt Text
- **Severity:** info | **Weight:** 4
- **Pass:** All non-empty alt text values unique
- **Fail:** Two or more images share identical alt
- **Recommendation:** "Give each image unique alt text."
- **Example Pass:** Each image has unique alt
- **Example Fail:** 5 images all have `alt: "Living room"`

### IMG-007: Supported Image Formats Only
- **Severity:** warning | **Weight:** 6
- **Pass:** All images use allowed formats (jpg, jpeg, png, webp)
- **Fail:** Unsupported formats (bmp, tiff, gif, svg)
- **Recommendation:** "Convert to WebP or JPEG for optimal performance."
- **Example Pass:** All `.jpg`, `.png`, or `.webp`
- **Example Fail:** `.bmp` or `.tiff`

### IMG-008: Image Dimensions Meet Minimum
- **Severity:** warning | **Weight:** 6
- **Pass:** All images `width >= 800` and `height >= 600`
- **Fail:** One or more images below minimum
- **Recommendation:** "Use images minimum 800x600 pixels."
- **Example Pass:** All images 1200x800 or larger
- **Example Fail:** Image is 400x300

### IMG-009: Image Filenames Are SEO Friendly
- **Severity:** info | **Weight:** 4
- **Pass:** Filenames use lowercase, hyphens, descriptive terms
- **Fail:** Generic (IMG_1234.jpg), underscores, uppercase
- **Recommendation:** "Use descriptive filenames: `noida-sector-62-living-room.jpg`"
- **Example Pass:** `/photos/noida-sector-62-living-room.jpg`
- **Example Fail:** `/photos/IMG_1234.JPG`

### IMG-010: Image File Size Within Limits
- **Severity:** warning | **Weight:** 8
- **Pass:** All images `fileSize <= 200` KB
- **Fail:** One or more images exceed maximum
- **Recommendation:** "Compress images to under 200KB."
- **Example Pass:** All images under 200KB
- **Example Fail:** Image is 850KB

---

## 6. Score Calculation

```
Base Score = 100
Penalty: critical=25, warning=10, info=2
Final Score = max(0, 100 - Total Penalty)
```

**Weight Table:**

| Rule | Severity | Weight |
|------|----------|--------|
| IMG-001 | critical | 10 |
| IMG-002 | warning | 8 |
| IMG-003 | warning | 6 |
| IMG-004 | warning | 8 |
| IMG-005 | info | 4 |
| IMG-006 | info | 4 |
| IMG-007 | warning | 6 |
| IMG-008 | warning | 6 |
| IMG-009 | info | 4 |
| IMG-010 | warning | 8 |

**Example Calculations:**
- Perfect (12 images, all optimized): Score = 100
- No images: Score = 55 (failed)
- Multiple issues: Score varies by penalties

---

## 7. Edge Cases

| Scenario | Behavior |
|----------|----------|
| `images: []` | IMG-001 fails (critical), IMG-002 fails |
| `images: undefined` | IMG-001 fails |
| `images: null` | Treated as undefined |
| `alt: ""` | IMG-004 flags as missing |
| `alt: "   "` | Trimmed; treated as empty |
| Duplicate filenames | Not flagged (future) |
| Duplicate alt | IMG-006 flags |
| BMP format | IMG-007 fails |
| SVG format | IMG-007 fails (for photos) |
| WebP/PNG/JPG | Passes IMG-007 |
| Image >1MB | IMG-010 fails |
| Image <100px | IMG-008 fails |
| Missing hero flag | First image assumed hero |
| Unicode filenames | IMG-009 may flag |
| Missing dimensions | IMG-008 skipped for that image |
| Missing fileSize | IMG-010 skipped |

---

## 8. Error Handling

| Error Condition | Behavior |
|-----------------|----------|
| `images` not array | Treated as empty; IMG-001 fails |
| `src` missing | Image skipped; logged |
| `alt` not string | Treated as missing |
| Negative dimensions | Treated as undefined |
| Negative fileSize | Treated as undefined |
| Empty format | Extracted from src |
| Plugin timeout | Partial results with error |

**Logging:**
- Log IMG-001 failures (data integrity)
- Log IMG-004 failures (accessibility)
- Log IMG-007/010 failures (optimization)
- Do not log full URLs (privacy)

---

## 9. Performance Requirements

| Metric | Target |
|--------|--------|
| Max execution time | 200ms |
| Max memory | 2MB |
| Complexity | O(n) where n = image count |
| Batch throughput | 500 properties/second |

---

## 10. Test Plan (100 Tests)

**Core (1-6):** undefined images, empty array, null, valid array, alt trimming, missing src

**Count Rules (7-14):** 0 images, 1-4 images, 5-9 images, 10+ images, exact 5/10, custom counts

**Hero (15-21):** hero marked, no hero, requireHero false, first assumed, multiple heroes, index, hasHero

**Alt Presence (22-30):** all with alt, one missing, multiple missing, empty string, whitespace, counts, max 5, null alt

**Alt Quality (31-38):** descriptive, generic "image"/"photo"/"room", short, property-specific, max 5, context-aware

**Duplicates (39-44):** unique, two same, multiple duplicates, empty excluded, case-insensitive, unique count

**Formats (45-52):** JPEG/PNG/WebP pass, BMP/TIFF/GIF fail, extracted from src, case-insensitive

**Dimensions (53-59):** 1200x800/800x600 pass, 400x300 fail, missing skipped, custom min, averages

**Filenames (60-67):** descriptive hyphenated pass, generic/underscore/uppercase/space fail, property-specific, max 5, Unicode

**File Size (68-75):** 150KB/200KB pass, 500KB fail, missing skipped, custom max, averages, largest

**Scoring (76-82):** perfect 100, no images <50, multiple warnings, critical=fail, info no effect, capped at 0, partial

**Edge Cases (83-90):** SVG, mixed formats, very large/small, null input, non-array, distribution, hero index -1

**Output (91-100):** checkId, totalImages, imagesWithAlt, imagesWithoutAlt, uniqueAltTexts, hasHero, heroIndex, avgFileSize, formatDist, summary

---

## 11. Acceptance Criteria

- [ ] `npm run build` passes
- [ ] `npm run test` passes (60+ tests)
- [ ] Zero TypeScript errors
- [ ] Reuses `SeoPlugin` interface
- [ ] Reuses `SeoCheckResult` type
- [ ] Reuses scoring utilities
- [ ] Uses `definePlugin` and `analyzerOutput`
- [ ] No new dependencies
- [ ] Deterministic behavior
- [ ] Follows code style (no `any`, JSDoc)
- [ ] Exports from `analyzer/index.ts`
- [ ] Category is `"images"`

---

## 12. Future Extensions

| Extension | Priority |
|-----------|----------|
| AI-Generated Alt Text | High |
| Image Compression Analysis | Medium |
| EXIF Data Analysis | Low |
| Accessibility Score (WCAG) | High |
| Lazy-Loading Recommendations | Medium |
| Responsive Image Analysis | Medium |
| Image Sitemap Generation | Low |
| Duplicate Image Detection | Low |
| Color Analysis | Low |
| Face Detection (privacy) | Future |
| Room Type Classification | Medium |
| Quality Scoring | Medium |
| CDN Integration | Low |
| AVIF Format Support | Medium |

---

## Open Questions

1. **Format Extraction:** Always extract from src or only when missing?
2. **Hero Default:** Is first-image-as-hero appropriate?
3. **SVG Handling:** Allow for logos, flag for photos?
4. **Alt Context:** Use propertyType/city/locality for validation?
5. **Duplicate Filenames:** Add as IMG-011?
6. **Dimension Variations:** Different mins for hero vs thumbnails?
7. **File Size Units:** Support bytes/MB or KB only?
8. **Large Properties:** Limit analysis for 50+ images?
9. **Issue Aggregation:** Aggregate per-image issues or keep separate?
10. **PageSignals Integration:** Populate `imagesWithoutAlt`/`imagesTotal`?

---

**END OF RFC-004**