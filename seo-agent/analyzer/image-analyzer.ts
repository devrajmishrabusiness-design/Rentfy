/**
 * Image Analyzer — pure rules.
 *
 * Every function in this file is stateless, side-effect-free, and
 * deterministic. They are designed to be unit-testable without any
 * knowledge of the plugin system, Next.js, or DOM.
 *
 * The rules object returned by `analyzeImages` is what the plugin adapter
 * (`image-plugin.ts`) converts into a `SeoCheckResult`.
 */

import type { SeoIssue, ScoreBreakdown, ImageMetadata } from "../types";
import {
  dedupeSeverity,
  calculateScore,
  calculateScoreBreakdown,
  mergeAnalyzerOptions,
} from "../utils/analyzer-helpers";

// Re-export for backward compatibility — the type was originally
// declared here. Consumers that imported `ImageMetadata` from
// `./image-analyzer` continue to resolve it without breaking.
export type { ImageMetadata } from "../types";

/* ----------------------------------------------------------------
 * Configuration
 * ---------------------------------------------------------------- */

export interface ImageAnalyzerInput {
  images: ImageMetadata[];
  propertyType?: string;
  city?: string;
  locality?: string;
}

export interface ImageAnalyzerOptions {
  minImageCount?: number;
  recommendedImageCount?: number;
  minDimension?: number;
  maxFileSize?: number;
  allowedFormats?: string[];
  requireHero?: boolean;
}

type RequiredAnalyzerOptions = Required<ImageAnalyzerOptions>;

const defaults: RequiredAnalyzerOptions = {
  minImageCount: 5,
  recommendedImageCount: 10,
  minDimension: 800,
  maxFileSize: 200,
  allowedFormats: ["jpg", "jpeg", "png", "webp"],
  requireHero: true,
};

/* ----------------------------------------------------------------
 * Public API
 * ---------------------------------------------------------------- */

export interface ImageAnalysis {
  checkId: string;
  summary: string;
  issues: SeoIssue[];
  passed: boolean;
  totalImages: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  uniqueAltTexts: number;
  hasHero: boolean;
  heroImageIndex: number;
  averageFileSize: number;
  largestFileSize: number;
  averageWidth: number;
  averageHeight: number;
  formatDistribution: Record<string, number>;
  score: number;
  scoreBreakdown?: ScoreBreakdown;
}

export const analyzeImages = (
  input: ImageAnalyzerInput,
  opts: ImageAnalyzerOptions = {}
): ImageAnalysis => {
  const options = mergeOptions(opts);
  const images = input.images ?? [];
  const totalImages = images.length;

  const issues: SeoIssue[] = [];

  // IMG-001: At least one image
  const img001 = checkImageExistence(images);
  issues.push(img001);

  // IMG-002: Recommended minimum count
  const img002 = checkImageCount(images, options);
  issues.push(img002);

  // IMG-003: Hero image exists
  const img003 = checkHeroImage(images, options);
  issues.push(img003);

  // IMG-004: Every image has alt text
  const img004Issues = checkAltTextPresence(images);
  issues.push(...img004Issues);

  // IMG-005: Alt text is meaningful
  const img005Issues = checkAltTextQuality(images);
  issues.push(...img005Issues);

  // IMG-006: No duplicate alt text
  const img006 = checkDuplicateAltText(images);
  issues.push(img006);

  // IMG-007: Supported formats
  const img007Issues = checkImageFormats(images, options);
  issues.push(...img007Issues);

  // IMG-008: Dimensions meet minimum
  const img008Issues = checkImageDimensions(images, options);
  issues.push(...img008Issues);

  // IMG-009: SEO-friendly filenames
  const img009Issues = checkImageFilenames(images);
  issues.push(...img009Issues);

  // IMG-010: File size within limits
  const img010Issues = checkFileSize(images, options);
  issues.push(...img010Issues);

  // Calculate metadata
  const imagesWithAlt = images.filter(
    (img) => img.alt && img.alt.trim().length > 0
  ).length;
  const imagesWithoutAlt = totalImages - imagesWithAlt;

  const altTexts = images
    .filter((img) => img.alt && img.alt.trim().length > 0)
    .map((img) => img.alt!.trim().toLowerCase());
  const uniqueAltTexts = new Set(altTexts).size;

  const heroIndex = images.findIndex((img) => img.isHero === true);
  const hasHero = heroIndex >= 0 || (options.requireHero && totalImages > 0);

  const fileSizes = images.filter((img) => img.fileSize !== undefined).map((img) => img.fileSize!);
  const averageFileSize = fileSizes.length > 0
    ? fileSizes.reduce((a, b) => a + b, 0) / fileSizes.length
    : 0;
  const largestFileSize = fileSizes.length > 0 ? Math.max(...fileSizes) : 0;

  const widths = images.filter((img) => img.width !== undefined).map((img) => img.width!);
  const heights = images.filter((img) => img.height !== undefined).map((img) => img.height!);
  const averageWidth = widths.length > 0 ? widths.reduce((a, b) => a + b, 0) / widths.length : 0;
  const averageHeight = heights.length > 0 ? heights.reduce((a, b) => a + b, 0) / heights.length : 0;

  const formatDistribution: Record<string, number> = {};
  images.forEach((img) => {
    const format = img.format || extractFormatFromSrc(img.src);
    if (format) {
      formatDistribution[format] = (formatDistribution[format] || 0) + 1;
    }
  });

  const passed = !issues.some(
    (i) => i.severity === "critical" || i.severity === "warning"
  );

  const score = calculateScore(issues, passed);
  const scoreBreakdown = calculateScoreBreakdown(issues);

  return {
    checkId: "image-analyzer",
    summary: `Analyzed ${totalImages} images: ${imagesWithAlt} with alt text, ${uniqueAltTexts} unique alt texts`,
    issues: dedupeSeverity(issues),
    passed,
    totalImages,
    imagesWithAlt,
    imagesWithoutAlt,
    uniqueAltTexts,
    hasHero,
    heroImageIndex: hasHero ? (heroIndex >= 0 ? heroIndex : 0) : -1,
    averageFileSize: Math.round(averageFileSize * 10) / 10,
    largestFileSize,
    averageWidth: Math.round(averageWidth),
    averageHeight: Math.round(averageHeight),
    formatDistribution,
    score,
    scoreBreakdown,
  };
};

/* ----------------------------------------------------------------
 * Rule Implementations
 * ---------------------------------------------------------------- */

const checkImageExistence = (images: ImageMetadata[]): SeoIssue => {
  if (images.length === 0) {
    return {
      id: "IMG-001",
      title: "No images found",
      description: "The property listing has no images. Images are essential for user engagement and SEO.",
      severity: "critical",
      category: "images",
      recommendation: "Add at least one high-quality image of the property.",
      weight: 10,
    };
  }

  return {
    id: "IMG-001",
    title: "Images exist",
    description: `The property has ${images.length} image(s).`,
    severity: "success",
    category: "images",
    weight: 0,
  };
};

const checkImageCount = (images: ImageMetadata[], opts: RequiredAnalyzerOptions): SeoIssue => {
  const count = images.length;

  if (count < opts.minImageCount) {
    return {
      id: "IMG-002",
      title: "Too few images",
      description: `The property has only ${count} image(s). Listings with images receive 94% more views.`,
      severity: "warning",
      category: "images",
      recommendation: `Add more images. Recommended: at least ${opts.recommendedImageCount} images.`,
      currentValue: count,
      expectedValue: opts.recommendedImageCount,
      weight: 8,
    };
  }

  if (count < opts.recommendedImageCount) {
    return {
      id: "IMG-002",
      title: "Below recommended image count",
      description: `The property has ${count} image(s). Consider adding more to showcase all features.`,
      severity: "warning",
      category: "images",
      recommendation: `Add more images. Recommended: ${opts.recommendedImageCount}+ images.`,
      currentValue: count,
      expectedValue: opts.recommendedImageCount,
      weight: 8,
    };
  }

  return {
    id: "IMG-002",
    title: "Good image count",
    description: `The property has ${count} images, which meets the recommended minimum.`,
    severity: "success",
    category: "images",
    weight: 0,
  };
};

const checkHeroImage = (images: ImageMetadata[], opts: RequiredAnalyzerOptions): SeoIssue => {
  const heroIndex = images.findIndex((img) => img.isHero === true);

  if (heroIndex >= 0) {
    return {
      id: "IMG-003",
      title: "Hero image designated",
      description: `Image ${heroIndex + 1} is marked as the hero image.`,
      severity: "success",
      category: "images",
      weight: 0,
    };
  }

  if (!opts.requireHero) {
    return {
      id: "IMG-003",
      title: "Hero image not required",
      description: "Hero image designation is optional for this analysis.",
      severity: "info",
      category: "images",
      weight: 0,
    };
  }

  if (images.length > 0) {
    return {
      id: "IMG-003",
      title: "No hero image designated",
      description: "No image is marked as the hero image. The first image will be used as default.",
      severity: "warning",
      category: "images",
      recommendation: "Designate a hero image that best represents the property.",
      weight: 6,
    };
  }

  return {
    id: "IMG-003",
    title: "No images for hero",
    description: "Cannot designate hero image when no images exist.",
    severity: "info",
    category: "images",
    weight: 0,
  };
};

const checkAltTextPresence = (images: ImageMetadata[]): SeoIssue[] => {
  const issues: SeoIssue[] = [];
  const missingAlt = images.filter(
    (img) => !img.alt || img.alt.trim().length === 0
  );

  if (missingAlt.length === 0) {
    issues.push({
      id: "IMG-004",
      title: "All images have alt text",
      description: `All ${images.length} images have alt text for accessibility.`,
      severity: "success",
      category: "images",
      weight: 0,
    });
  } else {
    const count = Math.min(missingAlt.length, 5);
    for (let i = 0; i < count; i++) {
      issues.push({
        id: "IMG-004",
        title: "Image missing alt text",
        description: `Image "${missingAlt[i].src}" is missing alt text for accessibility.`,
        severity: "warning",
        category: "images",
        recommendation: "Add descriptive alt text to all images.",
        weight: 8,
      });
    }
    if (missingAlt.length > 5) {
      issues.push({
        id: "IMG-004",
        title: `Additional ${missingAlt.length - 5} images missing alt text`,
        description: `${missingAlt.length - 5} more images are missing alt text.`,
        severity: "warning",
        category: "images",
        weight: 8,
      });
    }
  }

  return issues;
};

const GENERIC_ALT_PATTERNS = [
  /^image\d*$/i,
  /^photo\d*$/i,
  /^pic\d*$/i,
  /^room\d*$/i,
  /^img\d*$/i,
  /^picture\d*$/i,
  /^file\d*$/i,
];

const checkAltTextQuality = (images: ImageMetadata[]): SeoIssue[] => {
  const issues: SeoIssue[] = [];
  const poorAlt = images.filter((img) => {
    if (!img.alt || img.alt.trim().length === 0) return false;
    const alt = img.alt.trim();
    if (alt.length < 10) return true;
    return GENERIC_ALT_PATTERNS.some((pattern) => pattern.test(alt));
  });

  if (poorAlt.length === 0) {
    issues.push({
      id: "IMG-005",
      title: "All alt text is meaningful",
      description: "All images have descriptive, specific alt text.",
      severity: "success",
      category: "images",
      weight: 0,
    });
  } else {
    const count = Math.min(poorAlt.length, 5);
    for (let i = 0; i < count; i++) {
      const alt = poorAlt[i].alt?.trim() || "";
      issues.push({
        id: "IMG-005",
        title: "Generic or short alt text",
        description: `Image "${poorAlt[i].src}" has generic alt text: "${alt}".`,
        severity: "info",
        category: "images",
        recommendation: "Use specific, descriptive alt text.",
        currentValue: alt,
        weight: 4,
      });
    }
  }

  return issues;
};

const checkDuplicateAltText = (images: ImageMetadata[]): SeoIssue => {
  const altTexts = images
    .filter((img) => img.alt && img.alt.trim().length > 0)
    .map((img) => img.alt!.trim().toLowerCase());

  const duplicates = altTexts.filter(
    (alt, index) => altTexts.indexOf(alt) !== index
  );
  const uniqueDuplicates = new Set(duplicates);

  if (uniqueDuplicates.size === 0) {
    return {
      id: "IMG-006",
      title: "All alt text is unique",
      description: "Each image has unique alt text.",
      severity: "success",
      category: "images",
      weight: 0,
    };
  }

  const duplicateList = Array.from(uniqueDuplicates).slice(0, 3).join(", ");
  return {
    id: "IMG-006",
    title: "Duplicate alt text detected",
    description: `${uniqueDuplicates.size} alt text value(s) are duplicated: ${duplicateList}.`,
    severity: "info",
    category: "images",
    recommendation: "Give each image unique alt text describing its specific content.",
    weight: 4,
  };
};

const extractFormatFromSrc = (src: string): string | undefined => {
  const match = src.match(/\.([a-z0-9]+)(?:\?.*)?(?:#.*)?$/i);
  if (match) {
    return match[1].toLowerCase();
  }
  return undefined;
};

const checkImageFormats = (images: ImageMetadata[], opts: RequiredAnalyzerOptions): SeoIssue[] => {
  const issues: SeoIssue[] = [];
  const unsupported = images.filter((img) => {
    const format = img.format || extractFormatFromSrc(img.src);
    if (!format) return false;
    return !opts.allowedFormats.includes(format.toLowerCase());
  });

  if (unsupported.length === 0) {
    issues.push({
      id: "IMG-007",
      title: "All images use supported formats",
      description: `All images use web-optimized formats: ${opts.allowedFormats.join(", ")}.`,
      severity: "success",
      category: "images",
      weight: 0,
    });
  } else {
    const formats = new Set(
      unsupported.map((img) => img.format || extractFormatFromSrc(img.src))
    );
    issues.push({
      id: "IMG-007",
      title: "Unsupported image formats detected",
      description: `${unsupported.length} image(s) use unsupported formats: ${Array.from(formats).join(", ")}.`,
      severity: "warning",
      category: "images",
      recommendation: "Convert images to WebP or JPEG for optimal performance.",
      weight: 6,
    });
  }

  return issues;
};

const checkImageDimensions = (images: ImageMetadata[], opts: RequiredAnalyzerOptions): SeoIssue[] => {
  const issues: SeoIssue[] = [];
  const undersized = images.filter((img) => {
    if (img.width === undefined || img.height === undefined) return false;
    return img.width < opts.minDimension || img.height < opts.minDimension * 0.75;
  });

  if (undersized.length === 0) {
    const withDimensions = images.filter(
      (img) => img.width !== undefined && img.height !== undefined
    ).length;
    if (withDimensions > 0) {
      issues.push({
        id: "IMG-008",
        title: "All images meet dimension requirements",
        description: `All ${withDimensions} image(s) with dimensions meet the minimum ${opts.minDimension}px requirement.`,
        severity: "success",
        category: "images",
        weight: 0,
      });
    } else {
      issues.push({
        id: "IMG-008",
        title: "Image dimensions unavailable",
        description: "No image dimensions provided for analysis.",
        severity: "info",
        category: "images",
        weight: 0,
      });
    }
  } else {
    issues.push({
      id: "IMG-008",
      title: "Images below minimum dimensions",
      description: `${undersized.length} image(s) are below the recommended minimum dimensions.`,
      severity: "warning",
      category: "images",
      recommendation: `Use images with minimum dimensions of ${opts.minDimension}x${Math.round(opts.minDimension * 0.75)} pixels.`,
      weight: 6,
    });
  }

  return issues;
};

const checkImageFilenames = (images: ImageMetadata[]): SeoIssue[] => {
  const issues: SeoIssue[] = [];
  const poorFilenames = images.filter((img) => {
    const filename = img.src.split("/").pop() || img.src;
    const baseName = filename.split("?")[0].split("#")[0];

    if (/^img\d*$/i.test(baseName) || /^dsc\d*$/i.test(baseName) || /^photo\d*$/i.test(baseName)) {
      return true;
    }
    if (baseName.includes("_") || /[A-Z]/.test(baseName) || baseName.includes(" ")) {
      return true;
    }
    return false;
  });

  if (poorFilenames.length === 0) {
    issues.push({
      id: "IMG-009",
      title: "All filenames are SEO-friendly",
      description: "All images use descriptive, lowercase, hyphenated filenames.",
      severity: "success",
      category: "images",
      weight: 0,
    });
  } else {
    const count = Math.min(poorFilenames.length, 5);
    for (let i = 0; i < count; i++) {
      const filename = poorFilenames[i].src.split("/").pop() || poorFilenames[i].src;
      issues.push({
        id: "IMG-009",
        title: "SEO-unfriendly filename",
        description: `Image filename "${filename}" could be improved.`,
        severity: "info",
        category: "images",
        recommendation: "Use descriptive, lowercase filenames with hyphens.",
        weight: 4,
      });
    }
  }

  return issues;
};

const checkFileSize = (images: ImageMetadata[], opts: RequiredAnalyzerOptions): SeoIssue[] => {
  const issues: SeoIssue[] = [];
  const oversized = images.filter((img) => {
    if (img.fileSize === undefined) return false;
    return img.fileSize > opts.maxFileSize;
  });

  if (oversized.length === 0) {
    const withSize = images.filter((img) => img.fileSize !== undefined).length;
    if (withSize > 0) {
      issues.push({
        id: "IMG-010",
        title: "All images within size limits",
        description: `All ${withSize} image(s) are under ${opts.maxFileSize}KB.`,
        severity: "success",
        category: "images",
        weight: 0,
      });
    } else {
      issues.push({
        id: "IMG-010",
        title: "File sizes unavailable",
        description: "No file size data provided for analysis.",
        severity: "info",
        category: "images",
        weight: 0,
      });
    }
  } else {
    const largest = Math.max(...oversized.map((img) => img.fileSize!));
    issues.push({
      id: "IMG-010",
      title: "Images exceed size limits",
      description: `${oversized.length} image(s) exceed the ${opts.maxFileSize}KB limit. Largest: ${largest}KB.`,
      severity: "warning",
      category: "images",
      recommendation: "Compress images to reduce file size and improve page load time.",
      weight: 8,
    });
  }

  return issues;
};

/* ----------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------- */

function mergeOptions(opts: ImageAnalyzerOptions): RequiredAnalyzerOptions {
  return mergeAnalyzerOptions(opts, defaults);
}