import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { requirePermission } from "@/lib/auth/rbac";
import { requireApiUser } from "@/lib/api/auth";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { sanitizeAssignablePermissions, slugifyRoleName } from "@/lib/company/rolePermissions";
import { assertCompanyRoleBelongsToCompany } from "@/lib/company/rolesServer";
import { getCompanyRoleRepository } from "@/lib/db/factory";
import { updateCompanyRoleSchema } from "@/lib/validations/companyRole";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireApiUser();
    if (!user.companyId) {
      return apiError("No company assigned", 400);
    }

    requirePermission(user, "roles", "update", { targetCompanyId: user.companyId });

    const existing = await assertCompanyRoleBelongsToCompany(params.id, user.companyId);
    if (!existing) {
      return apiError("Role not found", 404);
    }

    const body: unknown = await request.json();
    const parsed = updateCompanyRoleSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.flatten().fieldErrors, 400);
    }

    const roleRepo = getCompanyRoleRepository();
    const updatePayload: Parameters<typeof roleRepo.update>[1] = {};

    if (parsed.data.name) updatePayload.name = parsed.data.name.trim();
    if (parsed.data.description !== undefined) updatePayload.description = parsed.data.description;
    if (parsed.data.permissions) {
      const permissions = sanitizeAssignablePermissions(parsed.data.permissions);
      if (permissions.length === 0) {
        return apiError("Select at least one valid permission", 400);
      }
      updatePayload.permissions = permissions;
    }

    if (parsed.data.slug) {
      updatePayload.slug = parsed.data.slug.toLowerCase();
    } else if (parsed.data.name) {
      updatePayload.slug = slugifyRoleName(parsed.data.name);
    }

    if (updatePayload.slug && updatePayload.slug !== existing.slug) {
      const conflict = await roleRepo.findBySlug(user.companyId, updatePayload.slug);
      if (conflict && conflict.id !== existing.id) {
        return apiError("A role with this slug already exists", 409);
      }
    }

    const updated = await roleRepo.update(params.id, updatePayload);
    if (!updated) {
      return apiError("Update failed", 500);
    }

    writeAuditLog({
      actorId: user.userId,
      actorRole: user.role,
      action: AUDIT_ACTIONS.COMPANY_ROLE_UPDATED,
      resource: "roles",
      resourceId: updated.id,
      companyId: user.companyId,
      req: request,
    });

    const memberCount = await roleRepo.countUsersWithRole(updated.id);

    return apiSuccess({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      permissions: updated.permissions,
      isSystem: updated.isSystem,
      memberCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await requireApiUser();
    if (!user.companyId) {
      return apiError("No company assigned", 400);
    }

    requirePermission(user, "roles", "delete", { targetCompanyId: user.companyId });

    const existing = await assertCompanyRoleBelongsToCompany(params.id, user.companyId);
    if (!existing) {
      return apiError("Role not found", 404);
    }

    if (existing.isSystem) {
      return apiError("System roles cannot be deleted", 400);
    }

    const roleRepo = getCompanyRoleRepository();
    const memberCount = await roleRepo.countUsersWithRole(params.id);
    if (memberCount > 0) {
      return apiError("Remove all members from this role before deleting", 400);
    }

    const deleted = await roleRepo.delete(params.id);
    if (!deleted) {
      return apiError("Delete failed", 500);
    }

    writeAuditLog({
      actorId: user.userId,
      actorRole: user.role,
      action: AUDIT_ACTIONS.COMPANY_ROLE_DELETED,
      resource: "roles",
      resourceId: params.id,
      companyId: user.companyId,
      req: request,
    });

    return apiSuccess({ id: params.id });
  } catch (error) {
    return handleApiError(error);
  }
}
