import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "@/config/constants";
import { ROLES } from "@/config/roles";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { requirePermission } from "@/lib/auth/rbac";
import { requireApiUser } from "@/lib/api/auth";
import {
  apiError,
  apiSuccess,
  handleApiError,
  sanitizeUser,
} from "@/lib/api/response";
import { assertCompanyRoleBelongsToCompany } from "@/lib/company/rolesServer";
import { getUserRepository } from "@/lib/db/factory";
import { adminUpdateUserSchema, updateUserSchema } from "@/lib/validations/user";

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireApiUser();
    const target = await getUserRepository().findById(params.id);

    if (!target) {
      return apiError("User not found", 404);
    }

    const isSelf = user.userId === target.id;
    if (isSelf) {
      requirePermission(user, "users", "read", { targetUserId: target.id });
    } else {
      requirePermission(user, "users", "read", {
        targetUserId: target.id,
        targetCompanyId: target.companyId,
      });
      if (user.role === ROLES.COMPANY_ADMIN && user.companyId !== target.companyId) {
        return apiError("Forbidden", 403);
      }
      if (user.role === ROLES.USER) {
        return apiError("Forbidden", 403);
      }
    }

    return apiSuccess(sanitizeUser(target));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireApiUser();
    const userRepo = getUserRepository();
    const target = await userRepo.findById(params.id);

    if (!target) {
      return apiError("User not found", 404);
    }

    const isSelf = user.userId === target.id;
    const body: unknown = await request.json();

    if (isSelf) {
      const parsed = updateUserSchema.safeParse(body);
      if (!parsed.success) {
        return apiError(parsed.error.flatten().fieldErrors, 400);
      }
      requirePermission(user, "users", "update", { targetUserId: target.id });
      const { name, password, currentPassword } = parsed.data;

      if (password) {
        if (!currentPassword) {
          return apiError("Current password is required", 400);
        }
        const valid = await bcrypt.compare(currentPassword, target.passwordHash);
        if (!valid) {
          return apiError("Current password is incorrect", 400);
        }
      }

      const updated = await userRepo.update(params.id, {
        name,
        ...(password ? { passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS) } : {}),
      });

      if (!updated) return apiError("Update failed", 500);

      if (password) {
        writeAuditLog({
          actorId: user.userId,
          actorRole: user.role,
          action: AUDIT_ACTIONS.PASSWORD_CHANGED,
          resource: "users",
          resourceId: updated.id,
          companyId: updated.companyId,
          req: request,
        });
      } else {
        writeAuditLog({
          actorId: user.userId,
          actorRole: user.role,
          action: AUDIT_ACTIONS.USER_UPDATED,
          resource: "users",
          resourceId: updated.id,
          companyId: updated.companyId,
          req: request,
        });
      }

      return apiSuccess(sanitizeUser(updated));
    }

    const parsed = adminUpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.flatten().fieldErrors, 400);
    }

    requirePermission(user, "users", "update", {
      targetCompanyId: target.companyId,
    });

    if (user.role === ROLES.COMPANY_ADMIN && user.companyId !== target.companyId) {
      return apiError("Forbidden", 403);
    }

    if (parsed.data.companyRoleId && user.companyId) {
      const customRole = await assertCompanyRoleBelongsToCompany(
        parsed.data.companyRoleId,
        user.companyId,
      );
      if (!customRole) {
        return apiError("Invalid custom role", 400);
      }
    }

    const updatePayload: Parameters<typeof userRepo.update>[1] = { ...parsed.data };

    if (parsed.data.role === ROLES.COMPANY_ADMIN) {
      updatePayload.companyRoleId = null;
    }

    const roleChanged = parsed.data.role && parsed.data.role !== target.role;

    const updated = await userRepo.update(params.id, updatePayload);
    if (!updated) return apiError("Update failed", 500);

    writeAuditLog({
      actorId: user.userId,
      actorRole: user.role,
      action: roleChanged ? AUDIT_ACTIONS.ROLE_CHANGED : AUDIT_ACTIONS.USER_UPDATED,
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

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await requireApiUser();
    const target = await getUserRepository().findById(params.id);

    if (!target) {
      return apiError("User not found", 404);
    }

    requirePermission(user, "users", "delete", { targetCompanyId: target.companyId });

    if (user.role === ROLES.COMPANY_ADMIN && user.companyId !== target.companyId) {
      return apiError("Forbidden", 403);
    }

    if (user.role === ROLES.USER) {
      return apiError("Forbidden", 403);
    }

    if (user.userId === target.id) {
      return apiError("Cannot delete your own account via this endpoint", 400);
    }

    const deleted = await getUserRepository().softDelete(params.id);
    if (!deleted) return apiError("Delete failed", 500);

    writeAuditLog({
      actorId: user.userId,
      actorRole: user.role,
      action: AUDIT_ACTIONS.USER_DELETED,
      resource: "users",
      resourceId: deleted.id,
      companyId: deleted.companyId,
      req: request,
    });

    return apiSuccess(sanitizeUser(deleted));
  } catch (error) {
    return handleApiError(error);
  }
}
