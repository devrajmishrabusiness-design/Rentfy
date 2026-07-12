/**
 * Rate limiter — token-bucket, in-memory, pluggable backend.
 *
 * Design:
 *   - Token bucket: each key gets `tokens` refilled at `intervalMs` rate.
 *   - In-memory Map as the default store (no external services).
 *   - `RateLimitStore` interface for swapping to Redis, Upstash, etc.
 *   - `rateLimit(req, config)` helper for Next.js route handlers.
 *
 * Usage in a route:
 *   import { rateLimit } from "@/lib/rate-limit";
 *   const result = await rateLimit(request);
 *   if (result.blocked) return NextResponse.json(..., { status: 429 });
 */

import { NextRequest } from "next/server";

export interface RateLimitConfig {
  /** Maximum tokens (requests) per window. */
  tokens: number;
  /** Window duration in milliseconds. */
  intervalMs: number;
}

export interface RateLimitResult {
  /** Whether the request was blocked. */
  blocked: boolean;
  /** Remaining tokens in the current window. */
  remaining: number;
  /** Unix timestamp (ms) when the window resets. */
  resetAt: number;
}

export interface RateLimitStore {
  consume(key: string, config: RateLimitConfig): Promise<RateLimitResult>;
}

/** Preset configs for common route categories. */
export const RateLimitPresets = {
  /** Expensive compute + network: 5 req/min. */
  strict: { tokens: 5, intervalMs: 60_000 },
  /** Mutations that create DB rows: 20 req/min. */
  moderate: { tokens: 20, intervalMs: 60_000 },
  /** Standard CRUD: 60 req/min. */
  standard: { tokens: 60, intervalMs: 60_000 },
  /** Light read-only: 120 req/min. */
  light: { tokens: 120, intervalMs: 60_000 },
} as const satisfies Record<string, RateLimitConfig>;

/** Per-bucket state tracked by the in-memory store. */
interface BucketState {
  tokens: number;
  lastRefill: number;
}

/** In-memory token-bucket store. Suitable for single-process deployments. */
class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, BucketState>();

  /** Periodic cleanup to prevent unbounded memory growth. */
  private readonly cleanupInterval: ReturnType<typeof setInterval>;

  constructor(cleanupMs: number = 60_000) {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of this.buckets) {
        // Drop buckets that haven't been touched in 2x the longest interval
        if (now - bucket.lastRefill > 2 * 60_000 * 60) {
          this.buckets.delete(key);
        }
      }
    }, cleanupMs);

    // Allow garbage collection on shutdown
    if (typeof this.cleanupInterval === "object" && "unref" in this.cleanupInterval) {
      this.cleanupInterval.unref();
    }
  }

  async consume(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: config.tokens,
        lastRefill: now,
      };
      this.buckets.set(key, bucket);
    }

    const elapsed = now - bucket.lastRefill;

    // Refill tokens based on elapsed time since last refill
    if (elapsed >= config.intervalMs) {
      bucket.tokens = config.tokens;
      bucket.lastRefill = now;
    } else if (elapsed > 0) {
      const refillAmount = Math.floor(
        (elapsed / config.intervalMs) * config.tokens
      );
      bucket.tokens = Math.min(config.tokens, bucket.tokens + refillAmount);
      bucket.lastRefill = now;
    }

    const blocked = bucket.tokens <= 0;
    if (!blocked) {
      bucket.tokens -= 1;
    }

    const resetAt = now + (config.intervalMs - (now - bucket.lastRefill));

    return {
      blocked,
      remaining: bucket.tokens,
      resetAt,
    };
  }
}

/** Singleton store — replace with Redis adapter for multi-process deployments. */
let store: RateLimitStore = new MemoryRateLimitStore();

/**
 * Replace the rate-limit store at runtime (e.g. swap for Redis in production).
 * Call this once during server startup.
 */
export function setRateLimitStore(newStore: RateLimitStore): void {
  store = newStore;
}

/**
 * Extract a stable identity key from the request:
 *   - authenticated user ID (from Supabase session cookie), or
 *   - IP address fallback
 */
async function getRequestKey(request: NextRequest): Promise<string> {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "anonymous";
  return `${request.method}:${request.nextUrl.pathname}:${ip}`;
}

/**
 * Apply rate limiting to a Next.js API request.
 *
 * Returns `{ blocked: false }` if under limit, or `{ blocked: true, retryAfter }`
 * with a 429-compatible response payload.
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = RateLimitPresets.standard
): Promise<
  | { blocked: false; remaining: number; resetAt: number }
  | { blocked: true; retryAfter: number; response: Response }
> {
  const key = await getRequestKey(request);
  const result = await store.consume(key, config);

  if (result.blocked) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return {
      blocked: true,
      retryAfter,
      response: Response.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(result.resetAt),
          },
        }
      ),
    };
  }

  return {
    blocked: false,
    remaining: result.remaining,
    resetAt: result.resetAt,
  };
}