import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/profile",
  "/add-property",
  "/edit-property",
  "/admin",
  "/seo-report",
];

function isProtected(pathname: string): boolean {
  return protectedPaths.some((prefix) => pathname === prefix || pathname === `${prefix}/` || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

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