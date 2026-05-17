import { ROLES } from "@/config/roles";
import { requirePermission } from "@/lib/auth/rbac";
import { requireApiUser } from "@/lib/api/auth";
import {
  apiError,
  apiSuccess,
  handleApiError,
  parsePagination,
  sanitizeUser,
} from "@/lib/api/response";
import type { UserListFilters } from "@/lib/db/interfaces";
import { getUserRepository } from "@/lib/db/factory";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    requirePermission(user, "users", "list");

    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);

    const filters: UserListFilters = { page, limit };

    if (user.role === ROLES.COMPANY_ADMIN) {
      if (!user.companyId) {
        return apiError("No company assigned", 400);
      }
      filters.companyId = user.companyId;
    } else if (user.role === ROLES.USER) {
      return apiError("Forbidden", 403);
    }

    const roleFilter = searchParams.get("role");
    if (roleFilter && (roleFilter === ROLES.USER || roleFilter === ROLES.COMPANY_ADMIN)) {
      filters.role = roleFilter;
    }

    const isActiveParam = searchParams.get("isActive");
    if (isActiveParam !== null) {
      filters.isActive = isActiveParam === "true";
    }

    const companyIdParam = searchParams.get("companyId");
    if (user.role === ROLES.SUPERADMIN) {
      if (companyIdParam) {
        filters.companyId = companyIdParam;
      } else {
        filters.allowUnscoped = true;
      }
    }

    const { users, total } = await getUserRepository().list(filters);

    return apiSuccess(users.map(sanitizeUser), { page, limit, total });
  } catch (error) {
    return handleApiError(error);
  }
}
