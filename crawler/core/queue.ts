/**
 * Crawl queue item — a URL awaiting processing in the BFS frontier.
 */
export interface QueueItem {
  /** Normalized, canonical URL. */
  url: string;
  /** Parent URL that discovered this item (`null` for the start URL). */
  parentUrl: string | null;
  /** Breadth-first depth from the start URL. */
  depth: number;
}

/**
 * First-in-first-out frontier used by the BFS crawler.
 *
 * Kept deliberately minimal (array-backed) so behavior is obvious and
 * deterministic. A priority/score-based frontier can be substituted
 * later without changing the engine contract.
 */
export class CrawlQueue {
  private readonly items: QueueItem[] = [];

  /** Add an item to the back of the queue. */
  enqueue(item: QueueItem): void {
    this.items.push(item);
  }

  /** Remove and return the item at the front, or `undefined` if empty. */
  dequeue(): QueueItem | undefined {
    return this.items.shift();
  }

  /** Number of pending items. */
  get size(): number {
    return this.items.length;
  }

  /** Whether the queue has no pending items. */
  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  /** Snapshot of pending items (does not mutate the queue). */
  toArray(): ReadonlyArray<QueueItem> {
    return [...this.items];
  }
}
