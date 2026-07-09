/**
 * Core barrel — re-exports the crawler engine and its primitives so
 * consumers import from `@/crawler/core` or `@/crawler`.
 */

export {
  CrawlQueue,
  type QueueItem,
} from "./queue";

export { VisitedSet } from "./visited-set";

export { buildSiteMap } from "./site-map";

export {
  CrawlerEngine,
  resolveConfig,
  CRAWLER_VERSION,
  type CrawlerEngineDeps,
} from "./crawler-engine";
