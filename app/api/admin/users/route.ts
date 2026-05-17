import { ROLES } from "@/config/roles";
import { requireSuperadmin } from "@/lib/api/admin";
import {
  apiSuccess,
  handleApiError,
  parsePagination,
  sanitizeUser,
} from "@/lib/api/response";
import type { UserListFilters } from "@/lib/db/interfaces";
import { getCompanyRepository, getUserRepository } from "@/lib/db/factory";

export async function GET(request: Request) {
  try {
    await requireSuperadmin();
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);

    const filters: UserListFilters = { page, limit };

    const roleFilter = searchParams.get("role");
    if (
      roleFilter === ROLES.SUPERADMIN ||
      roleFilter === ROLES.COMPANY_ADMIN ||
      roleFilter === ROLES.USER
    ) {
      filters.role = roleFilter;
    }

    const companyId = searchParams.get("companyId");
    if (companyId) {
      filters.companyId = companyId;
    } else {
      filters.allowUnscoped = true;
    }

    const isActiveParam = searchParams.get("isActive");
    if (isActiveParam !== null) filters.isActive = isActiveParam === "true";

    const search = searchParams.get("search");
    if (search) filters.search = search;

    const { users, total } = await getUserRepository().list(filters);
    const companyRepo = getCompanyRepository();

    const enriched = await Promise.all(
      users.map(async (user) => {
        const company = user.companyId
          ? await companyRepo.findById(user.companyId)
          : null;
        return {
          ...sanitizeUser(user),
          companyName: company?.name ?? null,
        };
      }),
    );

    return apiSuccess(enriched, { page, limit, total });
  } catch (error) {
    return handleApiError(error);
  }
}
