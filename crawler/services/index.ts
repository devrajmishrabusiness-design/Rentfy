/**
 * Services barrel — re-exports the crawler service layer so consumers
 * import from `@/crawler/services` or `@/crawler`.
 */

export {
  extractLinks,
  type ExtractedLink,
} from "./link-extractor";

export {
  HttpPageFetcher,
  type FetchedPage,
  type FetchOptions,
  type PageFetcher,
} from "./page-fetcher";
