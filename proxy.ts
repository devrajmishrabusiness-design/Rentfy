import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 proxy (formerly `middleware`).
 *
 * Matches `/api/:path*`. Responsibilities:
 *   - Inject a cryptographically random `X-Request-Id` on every API
 *     request so that logs, errors, and upstream traces carry the
 *     same correlation ID.
 *   - Echo the `X-Request-Id` back on the response for client-side
 *     debugging.
 *   - Set security headers appropriate for JSON-only API responses.
 *
 * Page-level security headers (CSP, etc.) are set in
 * `next.config.ts` `headers()`.
 *
 * For Next.js 16:
 *   - The file is `proxy.ts` (NOT `middleware.ts`).
 *   - The default export name is `proxy` (NOT `middleware`).
 *   - Runtime is `nodejs` and cannot be changed to `edge` in proxy.
 */
export default async function proxy(_request: NextRequest) {
  // Generate a unique request ID for log correlation.
  const requestId = crypto.randomUUID();

  const response = NextResponse.next();

  // Echo the request ID back to the client.
  response.headers.set("X-Request-Id", requestId);

  // Security headers for API (JSON-only) responses.
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), browsing-topics=()"
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");

  // Strict CSP for API responses (JSON only).
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};