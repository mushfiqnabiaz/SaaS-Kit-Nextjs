import { ROLES, type Role } from "@/config/roles";
import { getDashboardPath } from "@/lib/auth/session";

export type RouteZone = "public" | "auth" | "superadmin" | "company" | "app" | "api" | "default";

export interface JwtLike {
  userId?: string;
  role?: Role;
  companyId?: string | null;
}

export function getRouteZone(pathname: string): RouteZone {
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    return "auth";
  }

  if (pathname.startsWith("/api/admin/impersonate")) {
    return "public";
  }

  if (
    pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/auth/sessions")
  ) {
    return "public";
  }

  if (pathname.startsWith("/api/users/invite/accept")) {
    return "public";
  }

  if (
    pathname === "/api/auth/verify-email" ||
    pathname === "/api/auth/resend-verification"
  ) {
    return "public";
  }

  if (pathname.startsWith("/superadmin")) {
    return "superadmin";
  }

  if (pathname.startsWith("/company")) {
    return "company";
  }

  if (pathname.startsWith("/app")) {
    return "app";
  }

  if (pathname.startsWith("/api/")) {
    return "api";
  }

  return "default";
}

export function isPublicPath(pathname: string): boolean {
  const zone = getRouteZone(pathname);
  return zone === "public" || zone === "auth";
}

export function isAuthPage(pathname: string): boolean {
  return getRouteZone(pathname) === "auth";
}

/**
 * Role-based access for page and API routes.
 */
export function canAccessRoute(role: Role, pathname: string): boolean {
  const zone = getRouteZone(pathname);

  switch (zone) {
    case "public":
    case "auth":
      return true;
    case "superadmin":
      return role === ROLES.SUPERADMIN;
    case "company":
      return role === ROLES.SUPERADMIN || role === ROLES.COMPANY_ADMIN;
    case "app":
      return true;
    case "api":
      if (pathname.startsWith("/api/admin/")) {
        return role === ROLES.SUPERADMIN;
      }
      if (pathname.startsWith("/api/company/")) {
        return role === ROLES.SUPERADMIN || role === ROLES.COMPANY_ADMIN;
      }
      return true;
    default:
      return true;
  }
}

export function getForbiddenRedirectPath(role: Role): string {
  return getDashboardPath(role);
}

export function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/");
}
