import { ROLES, type Role } from "@/config/roles";

export interface TenantFilter {
  companyId: string;
}

/**
 * Returns a base query filter scoped to a tenant.
 */
export function withTenant(companyId: string): TenantFilter {
  return { companyId };
}

/**
 * Merges tenant scope into a Mongo/ORM query object.
 */
export function mergeTenantScope<T extends Record<string, unknown>>(
  query: T,
  companyId: string,
): T & TenantFilter {
  return { ...query, ...withTenant(companyId) };
}

/**
 * Logs a warning when a tenant-scoped query runs without companyId (non-superadmin).
 */
export function warnUnscopedQuery(
  operation: string,
  callerRole: Role | "unknown",
  hasCompanyScope: boolean,
): void {
  if (hasCompanyScope || callerRole === ROLES.SUPERADMIN) {
    return;
  }

  console.warn(
    `[tenant] Unscoped query "${operation}" (callerRole=${callerRole}). Apply withTenant(companyId).`,
  );
}
