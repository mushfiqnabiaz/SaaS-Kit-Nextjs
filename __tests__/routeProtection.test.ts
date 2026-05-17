import { describe, expect, it } from "vitest";
import { ROLES } from "@/config/roles";
import {
  canAccessRoute,
  getRouteZone,
  isApiPath,
  isAuthPage,
  isPublicPath,
} from "@/lib/middleware/routeProtection";

describe("getRouteZone", () => {
  it("classifies routes correctly", () => {
    expect(getRouteZone("/login")).toBe("auth");
    expect(getRouteZone("/api/auth/register")).toBe("public");
    expect(getRouteZone("/superadmin/dashboard")).toBe("superadmin");
    expect(getRouteZone("/company/dashboard")).toBe("company");
    expect(getRouteZone("/app/dashboard")).toBe("app");
    expect(getRouteZone("/api/users")).toBe("api");
  });
});

describe("isPublicPath", () => {
  it("treats auth pages as public", () => {
    expect(isPublicPath("/register")).toBe(true);
    expect(isPublicPath("/api/auth/signin")).toBe(true);
  });

  it("treats protected routes as non-public", () => {
    expect(isPublicPath("/app/dashboard")).toBe(false);
  });
});

describe("isAuthPage", () => {
  it("identifies auth pages", () => {
    expect(isAuthPage("/login")).toBe(true);
    expect(isAuthPage("/app/dashboard")).toBe(false);
  });
});

describe("canAccessRoute", () => {
  it("allows superadmin on superadmin routes", () => {
    expect(canAccessRoute(ROLES.SUPERADMIN, "/superadmin/dashboard")).toBe(true);
  });

  it("blocks user from superadmin routes", () => {
    expect(canAccessRoute(ROLES.USER, "/superadmin/dashboard")).toBe(false);
  });

  it("allows company_admin on company routes", () => {
    expect(canAccessRoute(ROLES.COMPANY_ADMIN, "/company/dashboard")).toBe(true);
  });

  it("allows superadmin on company routes", () => {
    expect(canAccessRoute(ROLES.SUPERADMIN, "/company/dashboard")).toBe(true);
  });

  it("blocks user from company routes", () => {
    expect(canAccessRoute(ROLES.USER, "/company/dashboard")).toBe(false);
  });

  it("allows any authenticated role on app routes", () => {
    expect(canAccessRoute(ROLES.USER, "/app/dashboard")).toBe(true);
    expect(canAccessRoute(ROLES.COMPANY_ADMIN, "/app/profile")).toBe(true);
  });

  it("allows authenticated access to api/users (handler checks permissions)", () => {
    expect(canAccessRoute(ROLES.USER, "/api/users")).toBe(true);
  });

  it("blocks user from admin API routes", () => {
    expect(canAccessRoute(ROLES.USER, "/api/admin/users")).toBe(false);
    expect(canAccessRoute(ROLES.COMPANY_ADMIN, "/api/admin/users")).toBe(false);
  });

  it("allows company_admin on company API routes", () => {
    expect(canAccessRoute(ROLES.COMPANY_ADMIN, "/api/company/roles")).toBe(true);
    expect(canAccessRoute(ROLES.USER, "/api/company/roles")).toBe(false);
  });

  it("allows superadmin on admin and company API routes", () => {
    expect(canAccessRoute(ROLES.SUPERADMIN, "/api/admin/stats")).toBe(true);
    expect(canAccessRoute(ROLES.SUPERADMIN, "/api/company/roles")).toBe(true);
  });
});

describe("isApiPath", () => {
  it("detects API paths", () => {
    expect(isApiPath("/api/users")).toBe(true);
    expect(isApiPath("/login")).toBe(false);
  });
});
