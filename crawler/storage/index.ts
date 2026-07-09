/**
 * Crawler storage abstraction.
 *
 * Future persistence layers (Postgres, Supabase, file system, Redis,
 * etc.) implement this tiny interface so the core engine can be swapped
 * between in-memory (testing, ephemeral) and durable without code
 * changes. Keep it minimal: save a `CrawlResult`; nothing else is
 * required to start.
 */
import type { CrawlResult } from "../types";

export interface CrawlStorage {
  /** Persist a completed crawl. May throw; the engine will surface the error. */
  save(result: CrawlResult): Promise<void>;
}

/**
 * In-memory stub used in tests and dev when no durable layer is wired
 * up yet. Satisfies `CrawlStorage` but does nothing.
 */
export class MemoryCrawlStorage implements CrawlStorage {
  async save(result: CrawlResult): Promise<void> {
    void result;
    // No-op
  }
}