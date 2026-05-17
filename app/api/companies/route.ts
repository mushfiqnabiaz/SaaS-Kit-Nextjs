import { ROLES } from "@/config/roles";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { requirePermission } from "@/lib/auth/rbac";
import { requireApiUser } from "@/lib/api/auth";
import { apiError, apiSuccess, handleApiError, parsePagination } from "@/lib/api/response";
import { getCompanyRepository } from "@/lib/db/factory";
import { createCompanySchema } from "@/lib/validations/company";
import { uniqueSlug } from "@/lib/utils/slug";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    requirePermission(user, "companies", "list");

    if (user.role !== ROLES.SUPERADMIN) {
      return apiError("Forbidden", 403);
    }

    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);
    const search = searchParams.get("search") ?? undefined;
    const isActiveParam = searchParams.get("isActive");
    const isActive =
      isActiveParam === null ? undefined : isActiveParam === "true";

    const { companies, total } = await getCompanyRepository().list({
      page,
      limit,
      search,
      isActive,
    });

    return apiSuccess(companies, { page, limit, total });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    requirePermission(user, "companies", "create");

    if (user.role !== ROLES.SUPERADMIN) {
      return apiError("Forbidden", 403);
    }

    const body: unknown = await request.json();
    const parsed = createCompanySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.flatten().fieldErrors, 400);
    }

    const companyRepo = getCompanyRepository();
    const slug =
      parsed.data.slug ??
      (await uniqueSlug(parsed.data.name, (s) => companyRepo.findBySlug(s).then(Boolean)));

    const company = await companyRepo.create({
      name: parsed.data.name,
      slug,
      plan: parsed.data.plan,
      ownerId: parsed.data.ownerId,
    });

    writeAuditLog({
      actorId: user.userId,
      actorRole: user.role,
      action: AUDIT_ACTIONS.COMPANY_CREATED,
      resource: "companies",
      resourceId: company.id,
      companyId: company.id,
      req: request,
    });

    return apiSuccess(company, {}, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
