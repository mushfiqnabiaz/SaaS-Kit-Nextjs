import { ROLES, type Role } from "@/config/roles";
import { requirePermission } from "@/lib/auth/rbac";
import { requireApiUser } from "@/lib/api/auth";
import { apiError, apiSuccess, handleApiError, parsePagination } from "@/lib/api/response";
import { getAuditRepository, getCompanyRepository, getUserRepository } from "@/lib/db/factory";

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

    const userRepo = getUserRepository();
    const companyRepo = getCompanyRepository();

    const enriched = await Promise.all(
      logs.map(async (log) => {
        const actor = await userRepo.findById(log.actorId);
        const company = log.companyId
          ? await companyRepo.findById(log.companyId)
          : null;
        return {
          ...log,
          actorName: actor?.name ?? "Unknown",
          actorEmail: actor?.email ?? "",
          companyName: company?.name ?? null,
        };
      }),
    );

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
