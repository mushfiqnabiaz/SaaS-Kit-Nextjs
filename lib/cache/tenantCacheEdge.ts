import type { TenantCacheEntry } from "@/lib/cache/tenantCache";

function tenantKey(companyId: string): string {
  return `tenant:${companyId}`;
}

/**
 * Edge-safe tenant cache read (Upstash REST — no Node.js Redis client).
 */
export async function getTenantFromCacheEdge(
  companyId: string,
): Promise<TenantCacheEntry | null> {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!baseUrl || !token) {
    return null;
  }

  const response = await fetch(`${baseUrl}/get/${tenantKey(companyId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { result: TenantCacheEntry | null };
  return data.result ?? null;
}
