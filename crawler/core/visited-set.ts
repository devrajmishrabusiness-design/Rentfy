/**
 * Visited set — de-duplication of normalized URLs.
 *
 * The crawler only adds a URL here when it is first *discovered* (enqueued),
 * so `size` equals the number of unique URLs discovered during a run. The
 * engine uses `has()` to skip duplicates before queueing.
 */
export class VisitedSet {
  private readonly set = new Set<string>();

  /** Whether a normalized URL has already been discovered. */
  has(url: string): boolean {
    return this.set.has(url);
  }

  /** Mark a normalized URL as discovered. */
  add(url: string): void {
    this.set.add(url);
  }

  /** Number of unique URLs discovered. */
  get size(): number {
    return this.set.size;
  }

  /** All discovered normalized URLs. */
  values(): string[] {
    return [...this.set];
  }
}
