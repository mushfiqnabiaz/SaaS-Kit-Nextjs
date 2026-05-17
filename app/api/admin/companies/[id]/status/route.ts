import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { requireSuperadmin } from "@/lib/api/admin";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { getCompanyRepository } from "@/lib/db/factory";
import { adminCompanyStatusSchema } from "@/lib/validations/admin";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const actor = await requireSuperadmin();
    const body: unknown = await request.json();
    const parsed = adminCompanyStatusSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.flatten().fieldErrors, 400);
    }

    const updated = await getCompanyRepository().update(params.id, {
      isActive: parsed.data.isActive,
    });
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
