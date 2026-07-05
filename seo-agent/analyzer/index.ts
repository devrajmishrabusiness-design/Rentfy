/**
 * Analyzer module — public exports.
 *
 * Each analyzer is shipped as a factory (`create*Plugin`) so callers
 * can configure it per-site before registering it with the engine.
 */

// Pure rules (testable without the plugin system)
export {
  analyzeTitle,
  type TitleAnalyzerOptions,
  type TitleAnalysis,
  type DuplicateTitleEntry,
  type DuplicateTitleStore,
} from "./title-analyzer";

// Plugin adapter
export { createTitlePlugin } from "./title-plugin";
export type { TitleAnalyzerOptions as TitlePluginOptions } from "./title-plugin";

// Meta Description Analyzer
export {
  analyzeDescription,
  type MetaDescriptionAnalyzerOptions,
  type MetaDescriptionAnalysis,
  type DuplicateDescriptionEntry,
  type DuplicateDescriptionStore,
} from "./meta-description-analyzer";

export { createMetaDescriptionPlugin } from "./meta-description-plugin";
export type { MetaDescriptionAnalyzerOptions as MetaDescriptionPluginOptions } from "./meta-description-plugin";

// URL Analyzer
export {
  analyzeUrl,
  type UrlAnalyzerOptions,
  type UrlAnalysis,
} from "./url-analyzer";

export { createUrlPlugin } from "./url-plugin";
export type { UrlAnalyzerOptions as UrlPluginOptions } from "./url-plugin";

// Image Analyzer
export {
  analyzeImages,
  type ImageAnalyzerOptions,
  type ImageAnalyzerInput,
  type ImageMetadata,
  type ImageAnalysis,
} from "./image-analyzer";

export { createImagePlugin } from "./image-plugin";
export type { ImageAnalyzerOptions as ImagePluginOptions } from "./image-plugin";

// Schema Analyzer
export {
  analyzeSchema,
  type SchemaAnalyzerOptions,
  type SchemaAnalysis,
} from "./schema-analyzer";

export { createSchemaPlugin } from "./schema-plugin";
export type { SchemaAnalyzerOptions as SchemaPluginOptions } from "./schema-plugin";
