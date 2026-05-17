import { ROLES, type Role } from "@/config/roles";
import { requirePermission } from "@/lib/auth/rbac";
import { requireApiUser } from "@/lib/api/auth";
import { apiError, apiSuccess, handleApiError, parsePagination } from "@/lib/api/response";
import type { CompanyRecord, UserRecord } from "@/lib/db/interfaces";
import { getAuditRepository, getCompanyRepository, getUserRepository } from "@/lib/db/factory";

async function loadActorMap(actorIds: string[]): Promise<Map<string, UserRecord>> {
  const userRepo = getUserRepository();
  const uniqueIds = Array.from(new Set(actorIds));
  const actors = await Promise.all(uniqueIds.map((id) => userRepo.findById(id)));
  const map = new Map<string, UserRecord>();
  for (const actor of actors) {
    if (actor) map.set(actor.id, actor);
  }
  return map;
}

async function loadCompanyMap(companyIds: string[]): Promise<Map<string, CompanyRecord>> {
  const companyRepo = getCompanyRepository();
  const uniqueIds = Array.from(new Set(companyIds.filter(Boolean))) as string[];
  const companies = await Promise.all(uniqueIds.map((id) => companyRepo.findById(id)));
  const map = new Map<string, CompanyRecord>();
  for (const company of companies) {
    if (company) map.set(company.id, company);
  }
  return map;
}

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    requirePermission(user, "audit_logs", "list");

    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);

    let companyId = searchParams.get("companyId") ?? undefined;
    const actorRole = (searchParams.get("role") as Role | null) ?? undefined;
    const action = searchParams.get("action") ?? undefined;
    const fromRaw = searchParams.get("from");
    const toRaw = searchParams.get("to");

    if (user.role === ROLES.COMPANY_ADMIN) {
      companyId = user.companyId ?? undefined;
    }

    if (user.role === ROLES.USER) {
      return apiError("Forbidden", 403);
    }

    const from = fromRaw ? new Date(fromRaw) : undefined;
    const to = toRaw ? new Date(toRaw) : undefined;

    const { logs, total } = await getAuditRepository().list({
      companyId,
      actorRole,
      action,
      from: from && !Number.isNaN(from.getTime()) ? from : undefined,
      to: to && !Number.isNaN(to.getTime()) ? to : undefined,
      page,
      limit,
    });

    const [actorMap, companyMap] = await Promise.all([
      loadActorMap(logs.map((log) => log.actorId)),
      loadCompanyMap(logs.map((log) => log.companyId).filter((id): id is string => Boolean(id))),
    ]);

    const enriched = logs.map((log) => {
      const actor = actorMap.get(log.actorId);
      const company = log.companyId ? companyMap.get(log.companyId) : null;
      return {
        ...log,
        actorName: actor?.name ?? "Unknown",
        actorEmail: actor?.email ?? "",
        companyName: company?.name ?? null,
      };
    });

    return apiSuccess(enriched, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
