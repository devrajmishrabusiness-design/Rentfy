/**
 * Image Analyzer Tests
 *
 * Comprehensive test suite covering all rules defined in RFC-004.
 */

import { describe, it, expect } from "vitest";
import { analyzeImages } from "../image-analyzer";

describe("Image Analyzer", () => {
  describe("IMG-001: Image Existence", () => {
    it("returns critical issue when images array is empty", () => {
      const result = analyzeImages({ images: [] });
      expect(result.issues.find((i) => i.id === "IMG-001")?.severity).toBe("critical");
      expect(result.passed).toBe(false);
    });

    it("returns critical issue when images is undefined", () => {
      const result = analyzeImages({ images: undefined });
      expect(result.issues.find((i) => i.id === "IMG-001")?.severity).toBe("critical");
    });

    it("returns success when at least one image exists", () => {
      const result = analyzeImages({ images: [{ src: "/photo.jpg", alt: "Test" }] });
      expect(result.issues.find((i) => i.id === "IMG-001")?.severity).toBe("success");
    });

    it("returns correct totalImages count", () => {
      const result = analyzeImages({ images: [{ src: "/1.jpg" }, { src: "/2.jpg" }, { src: "/3.jpg" }] });
      expect(result.totalImages).toBe(3);
    });
  });

  describe("IMG-002: Image Count", () => {
    it("returns warning when below minimum count", () => {
      const result = analyzeImages({ images: [{ src: "/1.jpg" }, { src: "/2.jpg" }] });
      expect(result.issues.find((i) => i.id === "IMG-002")?.severity).toBe("warning");
    });

    it("returns warning when below recommended count", () => {
      const images = Array.from({ length: 7 }, (_, i) => ({ src: `/${i}.jpg` }));
      const result = analyzeImages({ images });
      expect(result.issues.find((i) => i.id === "IMG-002")?.severity).toBe("warning");
    });

    it("returns success when at recommended count", () => {
      const images = Array.from({ length: 10 }, (_, i) => ({ src: `/${i}.jpg` }));
      const result = analyzeImages({ images });
      expect(result.issues.find((i) => i.id === "IMG-002")?.severity).toBe("success");
    });

    it("respects custom minImageCount", () => {
      const result = analyzeImages({ images: [{ src: "/1.jpg" }] }, { minImageCount: 1, recommendedImageCount: 1 });
      expect(result.issues.find((i) => i.id === "IMG-002")?.severity).toBe("success");
    });

    it("respects custom recommendedImageCount", () => {
      const images = Array.from({ length: 5 }, (_, i) => ({ src: `/${i}.jpg` }));
      const result = analyzeImages({ images }, { recommendedImageCount: 5 });
      expect(result.issues.find((i) => i.id === "IMG-002")?.severity).toBe("success");
    });
  });

  describe("IMG-003: Hero Image", () => {
    it("returns success when hero image is designated", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", isHero: true }, { src: "/2.jpg" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-003")?.severity).toBe("success");
      expect(result.hasHero).toBe(true);
      expect(result.heroImageIndex).toBe(0);
    });

    it("returns warning when no hero and requireHero is true", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg" }, { src: "/2.jpg" }],
      }, { requireHero: true });
      expect(result.issues.find((i) => i.id === "IMG-003")?.severity).toBe("warning");
    });

    it("returns info when requireHero is false", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg" }],
      }, { requireHero: false });
      expect(result.issues.find((i) => i.id === "IMG-003")?.severity).toBe("info");
    });

    it("assumes first image as hero when none marked", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg" }, { src: "/2.jpg" }],
      });
      expect(result.hasHero).toBe(true);
      expect(result.heroImageIndex).toBe(0);
    });

    it("returns -1 for heroImageIndex when no images", () => {
      const result = analyzeImages({ images: [] });
      expect(result.heroImageIndex).toBe(-1);
    });
  });

  describe("IMG-004: Alt Text Presence", () => {
    it("returns success when all images have alt text", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", alt: "Image 1" },
          { src: "/2.jpg", alt: "Image 2" },
        ],
      });
      expect(result.issues.find((i) => i.id === "IMG-004" && i.severity === "success")).toBeDefined();
      expect(result.imagesWithAlt).toBe(2);
    });

    it("returns warning when image missing alt text", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", alt: "Image 1" },
          { src: "/2.jpg" },
        ],
      });
      expect(result.issues.find((i) => i.id === "IMG-004" && i.severity === "warning")).toBeDefined();
      expect(result.imagesWithoutAlt).toBe(1);
    });

    it("treats empty string alt as missing", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", alt: "" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-004" && i.severity === "warning")).toBeDefined();
    });

    it("treats whitespace-only alt as missing", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", alt: "   " }],
      });
      expect(result.issues.find((i) => i.id === "IMG-004" && i.severity === "warning")).toBeDefined();
    });

    it("limits IMG-004 issues to 5", () => {
      const images = Array.from({ length: 10 }, (_, i) => ({ src: `/${i}.jpg` }));
      const result = analyzeImages({ images });
      const img004Issues = result.issues.filter((i) => i.id === "IMG-004");
      expect(img004Issues.length).toBeLessThanOrEqual(6);
    });

    it("calculates imagesWithAlt correctly", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", alt: "Has alt" },
          { src: "/2.jpg", alt: "Has alt" },
          { src: "/3.jpg" },
        ],
      });
      expect(result.imagesWithAlt).toBe(2);
    });

    it("calculates imagesWithoutAlt correctly", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", alt: "Has alt" },
          { src: "/2.jpg" },
          { src: "/3.jpg" },
        ],
      });
      expect(result.imagesWithoutAlt).toBe(2);
    });
  });

  describe("IMG-005: Alt Text Quality", () => {
    it("returns success for descriptive alt text", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", alt: "Modern kitchen with granite countertops" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-005" && i.severity === "success")).toBeDefined();
    });

    it("returns info for generic alt text 'image'", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", alt: "image" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-005" && i.severity === "info")).toBeDefined();
    });

    it("returns info for generic alt text 'photo'", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", alt: "photo" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-005" && i.severity === "info")).toBeDefined();
    });

    it("returns info for generic alt text 'room'", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", alt: "room" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-005" && i.severity === "info")).toBeDefined();
    });

    it("returns info for short alt text", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", alt: "test" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-005" && i.severity === "info")).toBeDefined();
    });

    it("limits IMG-005 issues to 5", () => {
      const images = Array.from({ length: 10 }, (_, i) => ({ src: `/${i}.jpg`, alt: "img" }));
      const result = analyzeImages({ images });
      const img005Issues = result.issues.filter((i) => i.id === "IMG-005");
      expect(img005Issues.length).toBeLessThanOrEqual(6);
    });
  });

  describe("IMG-006: Duplicate Alt Text", () => {
    it("returns success when all alt text is unique", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", alt: "Living room" },
          { src: "/2.jpg", alt: "Kitchen" },
        ],
      });
      expect(result.issues.find((i) => i.id === "IMG-006" && i.severity === "success")).toBeDefined();
    });

    it("returns info when duplicate alt text exists", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", alt: "Living room" },
          { src: "/2.jpg", alt: "Living room" },
        ],
      });
      expect(result.issues.find((i) => i.id === "IMG-006" && i.severity === "info")).toBeDefined();
    });

    it("excludes empty alt from duplicate check", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", alt: "" },
          { src: "/2.jpg", alt: "" },
        ],
      });
      const img006 = result.issues.find((i) => i.id === "IMG-006");
      expect(img006?.severity).toBe("success");
    });

    it("performs case-insensitive duplicate detection", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", alt: "Living Room" },
          { src: "/2.jpg", alt: "living room" },
        ],
      });
      expect(result.issues.find((i) => i.id === "IMG-006" && i.severity === "info")).toBeDefined();
    });

    it("calculates uniqueAltTexts correctly", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", alt: "Room 1" },
          { src: "/2.jpg", alt: "Room 1" },
          { src: "/3.jpg", alt: "Room 2" },
        ],
      });
      expect(result.uniqueAltTexts).toBe(2);
    });
  });

  describe("IMG-007: Image Formats", () => {
    it("returns success for JPEG format", () => {
      const result = analyzeImages({
        images: [{ src: "/photo.jpg" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-007" && i.severity === "success")).toBeDefined();
    });

    it("returns success for PNG format", () => {
      const result = analyzeImages({
        images: [{ src: "/photo.png" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-007" && i.severity === "success")).toBeDefined();
    });

    it("returns success for WebP format", () => {
      const result = analyzeImages({
        images: [{ src: "/photo.webp" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-007" && i.severity === "success")).toBeDefined();
    });

    it("returns warning for BMP format", () => {
      const result = analyzeImages({
        images: [{ src: "/photo.bmp" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-007" && i.severity === "warning")).toBeDefined();
    });

    it("returns warning for TIFF format", () => {
      const result = analyzeImages({
        images: [{ src: "/photo.tiff" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-007" && i.severity === "warning")).toBeDefined();
    });

    it("extracts format from src when not provided", () => {
      const result = analyzeImages({
        images: [{ src: "/photos/property-image.jpeg" }],
      });
      expect(result.formatDistribution["jpeg"]).toBe(1);
    });

    it("handles case-insensitive format check", () => {
      const result = analyzeImages({
        images: [{ src: "/photo.JPG" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-007" && i.severity === "success")).toBeDefined();
    });

    it("respects custom allowedFormats", () => {
      const result = analyzeImages({
        images: [{ src: "/photo.gif" }],
      }, { allowedFormats: ["gif"] });
      expect(result.issues.find((i) => i.id === "IMG-007" && i.severity === "success")).toBeDefined();
    });
  });

  describe("IMG-008: Image Dimensions", () => {
    it("returns success for images meeting minimum dimensions", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", width: 1200, height: 800 }],
      });
      expect(result.issues.find((i) => i.id === "IMG-008" && i.severity === "success")).toBeDefined();
    });

    it("returns success for images at minimum dimensions", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", width: 800, height: 600 }],
      });
      expect(result.issues.find((i) => i.id === "IMG-008" && i.severity === "success")).toBeDefined();
    });

    it("returns warning for undersized images", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", width: 400, height: 300 }],
      });
      expect(result.issues.find((i) => i.id === "IMG-008" && i.severity === "warning")).toBeDefined();
    });

    it("skips dimension check when dimensions not provided", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg" }],
      });
      const img008 = result.issues.find((i) => i.id === "IMG-008");
      expect(img008?.severity).toBe("info");
    });

    it("respects custom minDimension", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", width: 500, height: 400 }],
      }, { minDimension: 500 });
      expect(result.issues.find((i) => i.id === "IMG-008" && i.severity === "success")).toBeDefined();
    });

    it("calculates average width correctly", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", width: 800 },
          { src: "/2.jpg", width: 1200 },
        ],
      });
      expect(result.averageWidth).toBe(1000);
    });

    it("calculates average height correctly", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", height: 600 },
          { src: "/2.jpg", height: 800 },
        ],
      });
      expect(result.averageHeight).toBe(700);
    });
  });

  describe("IMG-009: Filename SEO", () => {
    it("returns success for descriptive hyphenated filename", () => {
      const result = analyzeImages({
        images: [{ src: "/photos/noida-sector-62-living-room.jpg" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-009" && i.severity === "success")).toBeDefined();
    });

    it("returns info for generic filename IMG_1234.jpg", () => {
      const result = analyzeImages({
        images: [{ src: "/photos/IMG_1234.jpg" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-009" && i.severity === "info")).toBeDefined();
    });

    it("returns info for underscore separator", () => {
      const result = analyzeImages({
        images: [{ src: "/photos/living_room.jpg" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-009" && i.severity === "info")).toBeDefined();
    });

    it("returns info for uppercase filename", () => {
      const result = analyzeImages({
        images: [{ src: "/photos/LIVING_ROOM.JPG" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-009" && i.severity === "info")).toBeDefined();
    });

    it("returns info for space in filename", () => {
      const result = analyzeImages({
        images: [{ src: "/photos/living room.jpg" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-009" && i.severity === "info")).toBeDefined();
    });

    it("limits IMG-009 issues to 5", () => {
      const images = Array.from({ length: 10 }, (_, i) => ({ src: `/IMG_${i}.jpg` }));
      const result = analyzeImages({ images });
      const img009Issues = result.issues.filter((i) => i.id === "IMG-009");
      expect(img009Issues.length).toBeLessThanOrEqual(6);
    });
  });

  describe("IMG-010: File Size", () => {
    it("returns success for images under size limit", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", fileSize: 150 }],
      });
      expect(result.issues.find((i) => i.id === "IMG-010" && i.severity === "success")).toBeDefined();
    });

    it("returns success for images at size limit", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", fileSize: 200 }],
      });
      expect(result.issues.find((i) => i.id === "IMG-010" && i.severity === "success")).toBeDefined();
    });

    it("returns warning for oversized images", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", fileSize: 500 }],
      });
      expect(result.issues.find((i) => i.id === "IMG-010" && i.severity === "warning")).toBeDefined();
    });

    it("skips size check when fileSize not provided", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg" }],
      });
      const img010 = result.issues.find((i) => i.id === "IMG-010");
      expect(img010?.severity).toBe("info");
    });

    it("respects custom maxFileSize", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", fileSize: 100 }],
      }, { maxFileSize: 100 });
      expect(result.issues.find((i) => i.id === "IMG-010" && i.severity === "success")).toBeDefined();
    });

    it("calculates averageFileSize correctly", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", fileSize: 100 },
          { src: "/2.jpg", fileSize: 200 },
        ],
      });
      expect(result.averageFileSize).toBe(150);
    });

    it("tracks largestFileSize correctly", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", fileSize: 100 },
          { src: "/2.jpg", fileSize: 500 },
          { src: "/3.jpg", fileSize: 200 },
        ],
      });
      expect(result.largestFileSize).toBe(500);
    });
  });

  describe("Score Calculation", () => {
    it("returns score 100 for perfect images", () => {
      const images = Array.from({ length: 10 }, (_, i) => ({
        src: `/photo-${i}.jpg`,
        alt: `Descriptive alt text for image ${i}`,
        width: 1200,
        height: 800,
        fileSize: 150,
        isHero: i === 0,
      }));
      const result = analyzeImages({ images });
      expect(result.score).toBe(100);
    });

    it("returns score below 100 for no images", () => {
      const result = analyzeImages({ images: [] });
      expect(result.score).toBeLessThan(100);
    });

    it("calculates penalty for multiple warnings", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", alt: "img", width: 400, fileSize: 500 },
        ],
      });
      expect(result.score).toBeLessThan(100);
    });

    it("critical failure results in failed status", () => {
      const result = analyzeImages({ images: [] });
      expect(result.passed).toBe(false);
    });

    it("info issues alone don't fail", () => {
      const images = Array.from({ length: 10 }, (_, i) => ({
        src: `/noida-sector-${62 + i}-living-room.jpg`,
        alt: `Descriptive alt text for image ${i}`,
        width: 800,
        height: 600,
        fileSize: 100,
        isHero: i === 0,
      }));
      const result = analyzeImages({ images });
      expect(result.passed).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("handles SVG format", () => {
      const result = analyzeImages({
        images: [{ src: "/icon.svg" }],
      });
      expect(result.issues.find((i) => i.id === "IMG-007" && i.severity === "warning")).toBeDefined();
    });

    it("handles mixed formats", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg" },
          { src: "/2.png" },
          { src: "/3.webp" },
        ],
      });
      expect(result.formatDistribution["jpg"]).toBe(1);
      expect(result.formatDistribution["png"]).toBe(1);
      expect(result.formatDistribution["webp"]).toBe(1);
    });

    it("handles very large file size", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", fileSize: 5000 }],
      });
      expect(result.issues.find((i) => i.id === "IMG-010" && i.severity === "warning")).toBeDefined();
    });

    it("handles very small dimensions", () => {
      const result = analyzeImages({
        images: [{ src: "/1.jpg", width: 50, height: 50 }],
      });
      expect(result.issues.find((i) => i.id === "IMG-008" && i.severity === "warning")).toBeDefined();
    });

    it("handles null input gracefully", () => {
      expect(() => analyzeImages({ images: null })).not.toThrow();
    });

    it("handles format distribution correctly", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg" },
          { src: "/2.jpg" },
          { src: "/3.png" },
        ],
      });
      expect(result.formatDistribution["jpg"]).toBe(2);
      expect(result.formatDistribution["png"]).toBe(1);
    });

    it("returns hero index -1 when no images", () => {
      const result = analyzeImages({ images: [] });
      expect(result.heroImageIndex).toBe(-1);
    });
  });

  describe("Output Contract", () => {
    it("returns correct checkId", () => {
      const result = analyzeImages({ images: [{ src: "/1.jpg" }] });
      expect(result.checkId).toBe("image-analyzer");
    });

    it("returns correct summary", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", alt: "Test 1" },
          { src: "/2.jpg", alt: "Test 2" },
        ],
      });
      expect(result.summary).toContain("2 images");
    });

    it("returns all extended metadata fields", () => {
      const result = analyzeImages({
        images: [
          { src: "/1.jpg", alt: "Test", width: 800, height: 600, fileSize: 100, isHero: true },
        ],
      });
      expect(result).toHaveProperty("totalImages");
      expect(result).toHaveProperty("imagesWithAlt");
      expect(result).toHaveProperty("imagesWithoutAlt");
      expect(result).toHaveProperty("uniqueAltTexts");
      expect(result).toHaveProperty("hasHero");
      expect(result).toHaveProperty("heroImageIndex");
      expect(result).toHaveProperty("averageFileSize");
      expect(result).toHaveProperty("largestFileSize");
      expect(result).toHaveProperty("averageWidth");
      expect(result).toHaveProperty("averageHeight");
      expect(result).toHaveProperty("formatDistribution");
      expect(result).toHaveProperty("score");
    });
  });
});