import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_HOST = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://vznobifmkcqxnzvtjbnh.supabase.co"
).hostname;

const protectedPaths = [
  "/dashboard",
  "/profile",
  "/add-property",
  "/edit-property",
  "/admin",
  "/seo-report",
];

function isProtected(pathname: string): boolean {
  return protectedPaths.some(
    (prefix) =>
      pathname === prefix ||
      pathname === `${prefix}/` ||
      pathname.startsWith(`${prefix}/`)
  );
}

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://${SUPABASE_HOST}`,
    `style-src 'self' 'unsafe-inline' https://${SUPABASE_HOST}`,
    `img-src 'self' blob: data: https://${SUPABASE_HOST}`,
    `font-src 'self'`,
    `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://${SUPABASE_HOST}`,
    `object-src 'none'`,
    ...(isDev()
      ? [
          `script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://${SUPABASE_HOST}`,
          `connect-src 'self' ws://localhost:* https://${SUPABASE_HOST} wss://${SUPABASE_HOST}`,
        ]
      : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", csp);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && isProtected(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - property-images (Supabase storage proxy pass-through)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|property-images).*)",
  ],
};