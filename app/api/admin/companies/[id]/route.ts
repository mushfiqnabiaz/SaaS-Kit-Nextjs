import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { requireSuperadmin } from "@/lib/api/admin";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { getCompanyRepository, getUserRepository } from "@/lib/db/factory";
import { adminUpdateCompanySchema } from "@/lib/validations/admin";

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireSuperadmin();
    const company = await getCompanyRepository().findById(params.id);
    if (!company) return apiError("Company not found", 404);

    const owner = await getUserRepository().findById(company.ownerId);
    const userCount = await getUserRepository().count({ companyId: company.id });

    return apiSuccess({
      ...company,
      ownerName: owner?.name ?? "Unknown",
      ownerEmail: owner?.email ?? "",
      userCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const actor = await requireSuperadmin();
    const body: unknown = await request.json();
    const parsed = adminUpdateCompanySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.flatten().fieldErrors, 400);
    }

    const updated = await getCompanyRepository().update(params.id, parsed.data);
    if (!updated) return apiError("Company not found", 404);

    writeAuditLog({
      actorId: actor.userId,
      actorRole: actor.role,
      action: AUDIT_ACTIONS.COMPANY_UPDATED,
      resource: "companies",
      resourceId: updated.id,
      companyId: updated.id,
      req: request,
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
