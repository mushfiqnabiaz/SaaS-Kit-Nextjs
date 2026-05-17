import { describe, expect, it } from "vitest";
import { ROLES } from "@/config/roles";
import { checkPermission, requirePermission } from "@/lib/auth/rbac";
import { ForbiddenError } from "@/lib/errors";
import type { SessionUser } from "@/types";

const superadmin: SessionUser = {
  userId: "sa-1",
  email: "admin@test.com",
  name: "Admin",
  role: ROLES.SUPERADMIN,
  companyId: null,
  plan: null,
};

const companyAdmin: SessionUser = {
  userId: "ca-1",
  email: "admin@acme.com",
  name: "CA",
  role: ROLES.COMPANY_ADMIN,
  companyId: "company-a",
  plan: "pro",
};

const user: SessionUser = {
  userId: "u-1",
  email: "user@acme.com",
  name: "User",
  role: ROLES.USER,
  companyId: "company-a",
  plan: "pro",
};

describe("checkPermission", () => {
  it("grants superadmin all actions", () => {
    expect(checkPermission(superadmin, "companies", "delete")).toBe(true);
    expect(checkPermission(superadmin, "billing", "update")).toBe(true);
  });

  it("grants company_admin user management within tenant", () => {
    expect(
      checkPermission(companyAdmin, "users", "list", { targetCompanyId: "company-a" }),
    ).toBe(true);
    expect(
      checkPermission(companyAdmin, "users", "create", { targetCompanyId: "company-a" }),
    ).toBe(true);
  });

  it("denies company_admin cross-tenant company update", () => {
    expect(
      checkPermission(companyAdmin, "companies", "update", { targetCompanyId: "company-b" }),
    ).toBe(false);
  });

  it("denies company_admin billing write", () => {
    expect(checkPermission(companyAdmin, "billing", "update")).toBe(false);
    expect(checkPermission(companyAdmin, "billing", "read")).toBe(true);
  });

  it("allows user to read own profile only", () => {
    expect(checkPermission(user, "users", "read", { targetUserId: "u-1" })).toBe(true);
    expect(checkPermission(user, "users", "read", { targetUserId: "u-2" })).toBe(false);
  });

  it("denies user from deleting users", () => {
    expect(checkPermission(user, "users", "delete")).toBe(false);
  });

  it("allows user workspace access when assigned to company", () => {
    expect(checkPermission(user, "workspace", "read")).toBe(true);
  });

  it("denies user without company workspace access", () => {
    const orphan: SessionUser = { ...user, companyId: null };
    expect(checkPermission(orphan, "workspace", "read")).toBe(false);
  });
});

describe("requirePermission", () => {
  it("throws ForbiddenError when denied", () => {
    expect(() => requirePermission(user, "users", "delete")).toThrow(ForbiddenError);
  });

  it("does not throw when allowed", () => {
    expect(() =>
      requirePermission(companyAdmin, "audit_logs", "list", { targetCompanyId: "company-a" }),
    ).not.toThrow();
  });
});
