import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 proxy (formerly `middleware`).
 *
 * Runs on `/api/:path*` only. API endpoints serve JSON, so a strict
 * `default-src 'none'` CSP is correct here. Page-level CSP is set in
 * `next.config.ts` `headers()`.
 *
 * For Next.js 16:
 *   - The file is `proxy.ts` (NOT `middleware.ts`).
 *   - The default export name is `proxy` (NOT `middleware`).
 *   - Runtime is `nodejs` and cannot be changed to `edge` in proxy.
 */
export default async function proxy(request: NextRequest) {
  const response = NextResponse.next();

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
