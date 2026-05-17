import { getTenantFromCacheEdge } from "@/lib/cache/tenantCacheEdge";
import type { CompanyRecord } from "@/lib/db/interfaces";

export interface TenantContext {
  companyId: string;
  company: Pick<CompanyRecord, "id" | "name" | "slug" | "plan" | "isActive">;
}

export type TenantResolveResult =
  | { ok: true; tenant: TenantContext | null }
  | { ok: false; reason: "inactive" | "not_found" | "cache_miss" };

/**
 * Resolves tenant from JWT companyId using Redis cache (edge-safe).
 * Superadmin (null companyId) skips validation.
 */
export async function resolveTenant(companyId: string | null): Promise<TenantResolveResult> {
  if (!companyId) {
    return { ok: true, tenant: null };
  }

  const cached = await getTenantFromCacheEdge(companyId);

  if (!cached) {
    return { ok: false, reason: "cache_miss" };
  }

  if (!cached.isActive) {
    return { ok: false, reason: "inactive" };
  }

  return {
    ok: true,
    tenant: {
      companyId: cached.id,
      company: {
        id: cached.id,
        name: cached.name,
        slug: cached.slug,
        plan: cached.plan,
        isActive: cached.isActive,
      },
    },
  };
}

/** Node-only: warm cache after DB load (call from repositories / auth) */
export { setTenantCache, invalidateTenantCache } from "@/lib/cache/tenantCache";
