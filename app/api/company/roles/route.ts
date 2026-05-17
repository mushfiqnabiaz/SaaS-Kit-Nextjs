import { ROLES } from "@/config/roles";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { requirePermission } from "@/lib/auth/rbac";
import { requireApiUser } from "@/lib/api/auth";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { sanitizeAssignablePermissions, slugifyRoleName } from "@/lib/company/rolePermissions";
import { getCompanyRoleRepository } from "@/lib/db/factory";
import {
  createCompanyRoleSchema,
} from "@/lib/validations/companyRole";

export async function GET() {
  try {
    const user = await requireApiUser();
    requirePermission(user, "roles", "list");

    if (user.role !== ROLES.COMPANY_ADMIN || !user.companyId) {
      return apiError("Only company admins can manage roles", 403);
    }

    const roles = await getCompanyRoleRepository().list(user.companyId);
    const withCounts = await Promise.all(
      roles.map(async (role) => ({
        id: role.id,
        name: role.name,
        slug: role.slug,
        description: role.description,
        permissions: role.permissions,
        isSystem: role.isSystem,
        memberCount: await getCompanyRoleRepository().countUsersWithRole(role.id),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
    );

    return apiSuccess(withCounts);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    requirePermission(user, "roles", "create");

    if (user.role !== ROLES.COMPANY_ADMIN || !user.companyId) {
      return apiError("Only company admins can create roles", 403);
    }

    const body: unknown = await request.json();
    const parsed = createCompanyRoleSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.flatten().fieldErrors, 400);
    }

    const permissions = sanitizeAssignablePermissions(parsed.data.permissions);
    if (permissions.length === 0) {
      return apiError("Select at least one valid permission", 400);
    }

    const slug = parsed.data.slug ?? slugifyRoleName(parsed.data.name);
    if (!slug) {
      return apiError("Could not generate a valid slug from name", 400);
    }

    const roleRepo = getCompanyRoleRepository();
    const existing = await roleRepo.findBySlug(user.companyId, slug);
    if (existing) {
      return apiError("A role with this slug already exists", 409);
    }

    const role = await roleRepo.create({
      companyId: user.companyId,
      name: parsed.data.name.trim(),
      slug,
      description: parsed.data.description ?? null,
      permissions,
    });

    writeAuditLog({
      actorId: user.userId,
      actorRole: user.role,
      action: AUDIT_ACTIONS.COMPANY_ROLE_CREATED,
      resource: "roles",
      resourceId: role.id,
      companyId: user.companyId,
      req: request,
    });

    return apiSuccess(
      {
        id: role.id,
        name: role.name,
        slug: role.slug,
        description: role.description,
        permissions: role.permissions,
        isSystem: role.isSystem,
        memberCount: 0,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
      {},
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
