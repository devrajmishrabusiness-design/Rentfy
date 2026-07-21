/**
 * Observability primitives for the Rentfy API layer.
 *
 * Provides:
 *   - `generateRequestId()` — crypto-grade unique ID per request
 *   - `getRequestContext()` — extract requestId + user context from
 *     the proxy-injected `X-Request-Id` header and the SSR Supabase
 *     session
 *   - `createRequestLogger()` — produce a child logger with the
 *     request's context bound in for every log entry
 *
 * Designed to work with `@rentfy/engine-sdk`'s `DefaultStructuredLogger`
 * and the `proxy.ts` which injects `X-Request-Id` on every API request.
 *
 * Never logs passwords, tokens, cookies, OTP codes, or service-role keys.
 */

import type { StructuredLogger } from "@rentfy/engine-sdk";
import { createClient } from "@/lib/supabase-server";

// ---------------------------------------------------------------------------
// Request ID
// ---------------------------------------------------------------------------

/**
 * Generate a unique, cryptographically random request ID (hex string).
 *
 * Request IDs are 16 bytes → 32 hex chars. Suitable for cross-system
 * correlation (proxies, load balancers, database logs).
 */
export function generateRequestId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Standard header name for the request ID, injected by `proxy.ts` and
 * read by `getRequestContext()`.
 */
export const REQUEST_ID_HEADER = "X-Request-Id";

// ---------------------------------------------------------------------------
// Request context
// ---------------------------------------------------------------------------

export interface RequestContext {
  /** The proxy-generated request ID. */
  requestId: string;
  /** Request method (GET, POST, PUT, PATCH, DELETE). */
  method: string;
  /** The matched route path (e.g. `/api/visits`). */
  path: string;
  /** Authenticated user ID, if a session cookie is present. */
  userId: string | null;
  /** Authenticated agency ID, if the user is an agency. */
  agencyId: string | null;
  /** Authenticated renter ID, if the user is a renter. */
  renterId: string | null;
}

/**
 * Extract a `RequestContext` from the incoming headers + the current
 * Supabase session. Call this once per API request, after the proxy has
 * injected `X-Request-Id`.
 *
 * If called from a route handler that already has `request: NextRequest`,
 * prefer reading `request.headers.get(REQUEST_ID_HEADER)` directly.
 * This function handles the case where the request object is not
 * available (e.g. inside a helper).
 */
export async function getRequestContext(
  requestId: string,
  method: string,
  path: string,
): Promise<RequestContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userId: string | null = null;
  let agencyId: string | null = null;
  let renterId: string | null = null;

  if (user) {
    userId = user.id;

    // Resolve agency & renter in parallel — cheap lookups.
    const [agencyResult, renterResult] = await Promise.all([
      supabase
        .from("agencies")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle<{ id: string }>(),
      supabase
        .from("renter_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle<{ id: string }>(),
    ]);

    agencyId = agencyResult.data?.id ?? null;
    renterId = renterResult.data?.id ?? null;
  }

  return { requestId, method, path, userId, agencyId, renterId };
}

// ---------------------------------------------------------------------------
// Request-scoped logger
// ---------------------------------------------------------------------------

/**
 * Create a child logger with request context bound as base metadata.
 *
 * Every log entry from this logger will automatically include:
 *   - requestId, route, and method
 *   - userId, agencyId, renterId (when available)
 *
 * Use `.child(bindings)` on the returned logger to add propertyId,
 * leadId, or other request-scoped detail.
 *
 * @param parent   The module-level logger (e.g. `logger` from each route file).
 * @param context  The request context from `getRequestContext()`.
 */
export function createRequestLogger(
  parent: StructuredLogger,
  context: RequestContext,
): StructuredLogger {
  return parent.child({
    requestId: context.requestId,
    route: context.path,
    method: context.method,
    ...(context.userId && { userId: context.userId }),
    ...(context.agencyId && { agencyId: context.agencyId }),
    ...(context.renterId && { renterId: context.renterId }),
  });
}