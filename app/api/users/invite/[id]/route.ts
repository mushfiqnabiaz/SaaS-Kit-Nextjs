import { ROLES } from "@/config/roles";
import { requirePermission } from "@/lib/auth/rbac";
import { requireApiUser } from "@/lib/api/auth";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { getInviteRepository } from "@/lib/db/factory";

interface RouteParams {
  params: { id: string };
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireApiUser();
    requirePermission(user, "users", "delete");

    if (user.role !== ROLES.COMPANY_ADMIN || !user.companyId) {
      return apiError("Forbidden", 403);
    }

    const inviteRepo = getInviteRepository();
    const invite = await inviteRepo.findById(params.id);

    if (!invite || invite.companyId !== user.companyId) {
      return apiError("Invite not found", 404);
    }

    if (invite.usedAt) {
      return apiError("Invite already accepted", 400);
    }

    await inviteRepo.delete(params.id);
    return apiSuccess({ revoked: true });
  } catch (error) {
    return handleApiError(error);
  }
}
