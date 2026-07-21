/**
 * Lightweight in-process metrics.
 *
 * Counters are simple per-key numbers kept in memory. No external
 * infrastructure (Prometheus, Datadog) is required at this stage.
 *
 * Exposure:
 *   - Counters are available via `GET /api/health` for uptime monitors.
 *   - The `CounterName` union documents every tracked event so new
 *     call sites add their key here first (compile-time self-check).
 *
 * Replace with an OpenTelemetry or Prometheus client when scaling.
 */

// ---------------------------------------------------------------------------
// Counter definitions
// ---------------------------------------------------------------------------

/**
 * Every counter key used in the application.
 *
 * Adding a new metric? Add the key to this union first so that all
 * call sites and reporting stay in sync.
 */
export type CounterName =
  // Auth
  | "auth.success"
  | "auth.failure"
  // Properties
  | "property.created"
  | "property.updated"
  | "property.deleted"
  // Leads
  | "lead.created"
  | "lead.updated"
  // Visits
  | "visit.created"
  | "visit.updated"
  // Rate limit
  | "rate_limit.blocked"
  // API errors
  | "api.error"
  | "api.warning"
  // Admin
  | "admin.action";

// ---------------------------------------------------------------------------
// Counter store
// ---------------------------------------------------------------------------

const counters = new Map<CounterName, number>();

export function increment(name: CounterName, by = 1): void {
  const current = counters.get(name) ?? 0;
  counters.set(name, current + by);
}

export function read(name: CounterName): number {
  return counters.get(name) ?? 0;
}

export function readAll(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, value] of counters) {
    result[key] = value;
  }
  return result;
}

export function reset(): void {
  counters.clear();
}