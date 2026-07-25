import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * PDD v2.0 – Route Protection via Middleware (Separate Auth Architecture)
 *
 * Protects:
 *   /dashboard/*      → requires verified agency (agency_profiles)
 *   /profile/*        → requires auth (agency only)
 *   /favorites        → requires renter
 *   /visits           → requires renter
 *   /admin/*          → requires admin
 *   /renter/*         → requires renter
 *
 * No hybrid users. No workspace cookie. No shared flows.
 *
 * Agency routes: /login/agency, /signup/agency
 * Renter routes: /login/renter, /signup/renter
 */

async function createSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    }
  );
}

const PROTECTED_ROUTES = [
  { path: "/dashboard", roles: ["verified-agency"] },
  { path: "/profile", roles: ["agency"] },
  { path: "/favorites", roles: ["renter"] },
  { path: "/visits", roles: ["renter"] },
  { path: "/admin", roles: ["admin"] },
  { path: "/renter", roles: ["renter"] },
];

const PUBLIC_AUTH_ROUTES = [
  "/login/agency",
  "/login/renter",
  "/signup/agency",
  "/signup/renter",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
];

const PUBLIC_ROUTES = ["/", "/rent", "/property"];

function getLoginRedirectForPath(pathname: string): string {
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/profile") || pathname.startsWith("/admin") || pathname.startsWith("/onboarding/agency") || pathname.startsWith("/add-property") || pathname.startsWith("/edit-property")) {
    return "/login/agency";
  }
  if (pathname.startsWith("/renter") || pathname.startsWith("/favorites") || pathname.startsWith("/visits")) {
    return "/login/renter";
  }
  return "/login/renter";
}

export default async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const supabase = await createSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = Boolean(user);
  const isEmailVerified = user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;

  const protectedMatch = PROTECTED_ROUTES.find((route) => pathname === route.path || pathname.startsWith(route.path + "/"));
  const isProtectedRoute = Boolean(protectedMatch);
  const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));

  if (!isProtectedRoute && !isPublicAuthRoute && !isPublicRoute) {
    return NextResponse.next();
  }

  if (isProtectedRoute && !isLoggedIn) {
    const redirectUrl = new URL(getLoginRedirectForPath(pathname), request.url);
    redirectUrl.searchParams.set("redirect", pathname + (request.nextUrl.search || ""));
    return NextResponse.redirect(redirectUrl);
  }

  if ((isProtectedRoute || isPublicAuthRoute) && isLoggedIn && !isEmailVerified) {
    if (pathname === "/verify-email") return NextResponse.next();
    const redirectUrl = new URL("/verify-email", request.url);
    redirectUrl.searchParams.set("redirect", pathname + (request.nextUrl.search || ""));
    return NextResponse.redirect(redirectUrl);
  }

  if (isLoggedIn && isEmailVerified && isPublicAuthRoute) {
    const [{ data: agencyRow }, { data: renterRow }] = await Promise.all([
      supabase.from("agency_profiles").select("id, verified, is_admin").eq("auth_user_id", user!.id).maybeSingle(),
      supabase.from("renter_profiles").select("id").eq("user_id", user!.id).maybeSingle(),
    ]);

    const isAgency = Boolean(agencyRow);
    const isRenter = Boolean(renterRow);

    if (isAgency) {
      const redirectParam = searchParams.get("redirect");
      const dest = redirectParam || (agencyRow!.verified ? "/dashboard" : "/onboarding/agency");
      return NextResponse.redirect(new URL(dest, request.url));
    }

    if (isRenter) {
      const redirectParam = searchParams.get("redirect");
      const dest = redirectParam || "/renter";
      return NextResponse.redirect(new URL(dest, request.url));
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isProtectedRoute && isLoggedIn && isEmailVerified) {
    const requiredRoles = protectedMatch!.roles;
    let hasRole = false;

    const [{ data: agencyRow }, { data: renterRow }] = await Promise.all([
      supabase.from("agency_profiles").select("id, verified, is_admin").eq("auth_user_id", user!.id).maybeSingle(),
      supabase.from("renter_profiles").select("id").eq("user_id", user!.id).maybeSingle(),
    ]);

    const isVerifiedAgency = agencyRow?.verified === true;
    const isAgency = Boolean(agencyRow);
    const isAdmin = agencyRow?.is_admin === true;
    const isRenter = Boolean(renterRow);

    if (requiredRoles.includes("admin") && isAdmin) hasRole = true;
    if (requiredRoles.includes("verified-agency") && isVerifiedAgency) hasRole = true;
    if (requiredRoles.includes("agency") && isAgency) hasRole = true;
    if (requiredRoles.includes("renter") && isRenter) hasRole = true;

    if (!hasRole) {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (isVerifiedAgency) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (isAgency) {
        return NextResponse.redirect(new URL("/onboarding/agency", request.url));
      }
      if (isRenter) {
        return NextResponse.redirect(new URL("/renter", request.url));
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/favorites",
    "/visits",
    "/visits/:path*",
    "/admin/:path*",
    "/renter/:path*",
    "/onboarding/agency",
    "/onboarding/agency/:path*",
    "/add-property",
    "/edit-property/:path*",
    "/login/agency",
    "/login/renter",
    "/signup/agency",
    "/signup/renter",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
  ],
};