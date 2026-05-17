import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getDashboardPath } from "@/lib/auth/session";
import type { Role } from "@/config/roles";
import { resolveTenant } from "@/lib/middleware/tenantResolver";
import {
  getClientIp,
  rateLimit,
  rateLimitHeaders,
} from "@/lib/middleware/rateLimit";
import {
  canAccessRoute,
  getForbiddenRedirectPath,
  isApiPath,
  isAuthPage,
  isPublicPath,
} from "@/lib/middleware/routeProtection";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    request.method === "POST" &&
    pathname === "/api/auth/callback/credentials"
  ) {
    const ip = getClientIp(request);
    const result = await rateLimit(request, {
      key: `login:${ip}`,
      limit: 10,
      window: "15 m",
    });
    if (!result.success) {
      return NextResponse.json(
        { data: null, error: "Too many login attempts. Please try again later." },
        { status: 429, headers: rateLimitHeaders(result) },
      );
    }
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = Boolean(token?.userId);
  const role = (token?.role as Role | undefined) ?? "user";
  const userId = token?.userId as string | undefined;
  const companyId = (token?.companyId as string | null | undefined) ?? null;
  const email = token?.email as string | undefined;

  if (isPublicPath(pathname)) {
    if (isLoggedIn && isAuthPage(pathname)) {
      return NextResponse.redirect(new URL(getDashboardPath(role), request.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    if (isApiPath(pathname)) {
      return NextResponse.json(
        { data: null, error: "Authentication required" },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessRoute(role, pathname)) {
    if (isApiPath(pathname)) {
      return NextResponse.json(
        { data: null, error: "Forbidden" },
        { status: 403 },
      );
    }
    return NextResponse.redirect(new URL(getForbiddenRedirectPath(role), request.url));
  }

  const tenantResult = await resolveTenant(companyId);
  const redisConfigured = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );

  if (
    companyId &&
    redisConfigured &&
    !tenantResult.ok &&
    tenantResult.reason !== "cache_miss"
  ) {
    if (isApiPath(pathname)) {
      return NextResponse.json(
        { data: null, error: "Company is inactive or unavailable" },
        { status: 403 },
      );
    }
    return NextResponse.redirect(new URL(getForbiddenRedirectPath(role), request.url));
  }

  const requestHeaders = new Headers(request.headers);
  if (userId) requestHeaders.set("x-user-id", userId);
  if (email) requestHeaders.set("x-user-email", email);
  requestHeaders.set("x-user-role", role);
  requestHeaders.set("x-company-id", companyId ?? "");

  if (tenantResult.ok && tenantResult.tenant) {
    requestHeaders.set("x-tenant-company-id", tenantResult.tenant.companyId);
    requestHeaders.set("x-tenant-company-name", tenantResult.tenant.company.name);
    requestHeaders.set("x-tenant-company-active", String(tenantResult.tenant.company.isActive));
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
