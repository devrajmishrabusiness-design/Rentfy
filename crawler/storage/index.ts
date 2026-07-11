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
import { Storage } from "@rentfy/engine-sdk";

export interface CrawlStorage {
  /** Persist a completed crawl. May throw; the engine will surface the error. */
  save(result: CrawlResult): Promise<void>;
}

/**
 * In-memory store backed by the Platform Foundation Shared Storage module.
 * Satisfies `CrawlStorage`.
 */
export class MemoryCrawlStorage implements CrawlStorage {
  private readonly storage: Storage;

  constructor(storage?: Storage) {
    this.storage = storage ?? new Storage({ collections: ["crawl_results"] });
  }

  async save(result: CrawlResult): Promise<void> {
    const key = `crawl-${result.stats.startedAt}-${result.startUrl.replace(/[^a-zA-Z0-9]/g, '_')}`;
    await this.storage.save("crawl_results", {
      key,
      value: result as unknown,
    });
  }
}