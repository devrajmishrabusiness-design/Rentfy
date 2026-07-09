import { describe, it, expect } from "vitest";
import { CrawlQueue, type QueueItem } from "@/crawler/core/queue";

describe("CrawlQueue", () => {
  it("starts empty", () => {
    const q = new CrawlQueue();
    expect(q.isEmpty).toBe(true);
    expect(q.size).toBe(0);
  });

  it("enqueues and dequeues in FIFO order", () => {
    const q = new CrawlQueue();
    const a: QueueItem = { url: "https://example.com/a", parentUrl: null, depth: 0 };
    const b: QueueItem = { url: "https://example.com/b", parentUrl: a.url, depth: 1 };
    q.enqueue(a);
    q.enqueue(b);
    expect(q.size).toBe(2);
    expect(q.dequeue()).toEqual(a);
    expect(q.dequeue()).toEqual(b);
    expect(q.isEmpty).toBe(true);
  });

  it("returns undefined when dequeuing from empty queue", () => {
    const q = new CrawlQueue();
    expect(q.dequeue()).toBeUndefined();
  });

  it("toArray returns a snapshot without mutating the queue", () => {
    const q = new CrawlQueue();
    const a: QueueItem = { url: "https://example.com/a", parentUrl: null, depth: 0 };
    q.enqueue(a);
    const arr = q.toArray();
    expect(arr).toEqual([a]);
    expect(q.size).toBe(1);
  });
});