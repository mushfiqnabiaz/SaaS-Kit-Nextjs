import type { CompanyRecord } from "@/lib/db/interfaces";
import { getRedis, TENANT_CACHE_TTL_SECONDS } from "@/lib/cache/redis";

export interface TenantCacheEntry {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
}

function tenantKey(companyId: string): string {
  return `tenant:${companyId}`;
}

export async function getTenantFromCache(
  companyId: string,
): Promise<TenantCacheEntry | null> {
  const redis = getRedis();
  if (!redis) return null;

  const entry = await redis.get<TenantCacheEntry>(tenantKey(companyId));
  return entry ?? null;
}

export async function setTenantCache(company: CompanyRecord): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const entry: TenantCacheEntry = {
    id: company.id,
    name: company.name,
    slug: company.slug,
    plan: company.plan,
    isActive: company.isActive,
  };

  await redis.set(tenantKey(company.id), entry, { ex: TENANT_CACHE_TTL_SECONDS });
}

export async function invalidateTenantCache(companyId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(tenantKey(companyId));
}
