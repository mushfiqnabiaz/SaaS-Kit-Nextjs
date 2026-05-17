import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { signImpersonationToken } from "@/lib/auth/impersonation";
import { requireSuperadmin } from "@/lib/api/admin";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { getUserRepository } from "@/lib/db/factory";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const actor = await requireSuperadmin();
    const target = await getUserRepository().findById(params.id);

    if (!target || !target.isActive) {
      return apiError("User not found", 404);
    }

    if (target.id === actor.userId) {
      return apiError("Cannot impersonate yourself", 400);
    }

    const token = await signImpersonationToken(target.id, actor.userId);
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const redirectUrl = `${baseUrl}/api/admin/impersonate?token=${encodeURIComponent(token)}`;

    writeAuditLog({
      actorId: actor.userId,
      actorRole: actor.role,
      action: AUDIT_ACTIONS.IMPERSONATION_START,
      resource: "users",
      resourceId: target.id,
      companyId: target.companyId,
      req: request,
    });

    return apiSuccess({ token, redirectUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
