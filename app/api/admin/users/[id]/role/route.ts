import { ROLES } from "@/config/roles";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { requireSuperadmin } from "@/lib/api/admin";
import { apiError, apiSuccess, handleApiError, sanitizeUser } from "@/lib/api/response";
import { getUserRepository } from "@/lib/db/factory";
import { adminChangeRoleSchema } from "@/lib/validations/admin";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const actor = await requireSuperadmin();
    const body: unknown = await request.json();
    const parsed = adminChangeRoleSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.flatten().fieldErrors, 400);
    }

    const target = await getUserRepository().findById(params.id);
    if (!target) return apiError("User not found", 404);

    if (target.id === actor.userId && parsed.data.role !== ROLES.SUPERADMIN) {
      return apiError("Cannot remove your own superadmin role", 400);
    }

    const updated = await getUserRepository().update(params.id, { role: parsed.data.role });
    if (!updated) return apiError("Update failed", 500);

    writeAuditLog({
      actorId: actor.userId,
      actorRole: actor.role,
      action: AUDIT_ACTIONS.ROLE_CHANGED,
      resource: "users",
      resourceId: updated.id,
      companyId: updated.companyId,
      req: request,
    });

    return apiSuccess(sanitizeUser(updated));
  } catch (error) {
    return handleApiError(error);
  }
}
