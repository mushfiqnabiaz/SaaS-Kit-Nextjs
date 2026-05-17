import { describe, expect, it, vi } from "vitest";
import { ROLES } from "@/config/roles";
import { mergeTenantScope, withTenant, warnUnscopedQuery } from "@/lib/db/tenantScope";

describe("withTenant", () => {
  it("returns companyId filter", () => {
    expect(withTenant("507f1f77bcf86cd799439011")).toEqual({
      companyId: "507f1f77bcf86cd799439011",
    });
  });
});

describe("mergeTenantScope", () => {
  it("merges tenant scope into query object", () => {
    const query = { isActive: true, role: "user" };
    const scoped = mergeTenantScope(query, "company-123");

    expect(scoped).toEqual({
      isActive: true,
      role: "user",
      companyId: "company-123",
    });
  });

  it("always includes companyId for list operations", () => {
    const scoped = mergeTenantScope({}, "tenant-a");
    expect(scoped.companyId).toBe("tenant-a");
  });
});

describe("warnUnscopedQuery", () => {
  it("warns when missing scope for non-superadmin", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnUnscopedQuery("UserRepository.list", ROLES.COMPANY_ADMIN, false);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Unscoped query "UserRepository.list"'),
    );
    spy.mockRestore();
  });

  it("does not warn for superadmin", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnUnscopedQuery("UserRepository.list", ROLES.SUPERADMIN, false);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does not warn when scope is present", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnUnscopedQuery("UserRepository.list", ROLES.USER, true);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
