import { ROLES } from "@/config/roles";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { requirePermission } from "@/lib/auth/rbac";
import { requireApiUser } from "@/lib/api/auth";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { getCompanyRepository } from "@/lib/db/factory";
import { updateCompanySchema } from "@/lib/validations/company";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await requireApiUser();
    const company = await getCompanyRepository().findById(params.id);

    if (!company) {
      return apiError("Company not found", 404);
    }

    requirePermission(user, "companies", "read", { targetCompanyId: company.id });

    if (user.role === ROLES.COMPANY_ADMIN && user.companyId !== company.id) {
      return apiError("Forbidden", 403);
    }

    return apiSuccess(company);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireApiUser();
    const companyRepo = getCompanyRepository();
    const existing = await companyRepo.findById(params.id);

    if (!existing) {
      return apiError("Company not found", 404);
    }

    requirePermission(user, "companies", "update", { targetCompanyId: existing.id });

    if (user.role === ROLES.COMPANY_ADMIN && user.companyId !== existing.id) {
      return apiError("Forbidden", 403);
    }

    const body: unknown = await request.json();
    const parsed = updateCompanySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.flatten().fieldErrors, 400);
    }

    if (user.role === ROLES.COMPANY_ADMIN) {
      const { isActive: _omitActive, plan: _omitPlan, ...allowed } = parsed.data;
      void _omitActive;
      void _omitPlan;
      const updated = await companyRepo.update(params.id, allowed);
      if (!updated) return apiError("Update failed", 500);

      writeAuditLog({
        actorId: user.userId,
        actorRole: user.role,
        action: AUDIT_ACTIONS.COMPANY_UPDATED,
        resource: "companies",
        resourceId: updated.id,
        companyId: updated.id,
        req: request,
      });

      return apiSuccess(updated);
    }

    const updated = await companyRepo.update(params.id, parsed.data);
    if (!updated) return apiError("Update failed", 500);

    writeAuditLog({
      actorId: user.userId,
      actorRole: user.role,
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

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await requireApiUser();
    requirePermission(user, "companies", "delete");

    if (user.role !== ROLES.SUPERADMIN) {
      return apiError("Forbidden", 403);
    }

    const deleted = await getCompanyRepository().softDelete(params.id);
    if (!deleted) {
      return apiError("Company not found", 404);
    }

    writeAuditLog({
      actorId: user.userId,
      actorRole: user.role,
      action: AUDIT_ACTIONS.COMPANY_DELETED,
      resource: "companies",
      resourceId: deleted.id,
      companyId: deleted.id,
      req: request,
    });

    return apiSuccess(deleted);
  } catch (error) {
    return handleApiError(error);
  }
}
