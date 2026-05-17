import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { requireSuperadmin } from "@/lib/api/admin";
import { apiError, apiSuccess, handleApiError, parsePagination } from "@/lib/api/response";
import { getCompanyRepository, getUserRepository } from "@/lib/db/factory";
import { adminCreateCompanySchema } from "@/lib/validations/admin";
import { uniqueSlug } from "@/lib/utils/slug";

export async function GET(request: Request) {
  try {
    await requireSuperadmin();
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

    const userRepo = getUserRepository();
    const enriched = await Promise.all(
      companies.map(async (company) => {
        const owner = await userRepo.findById(company.ownerId);
        const userCount = await userRepo.count({ companyId: company.id });
        return {
          ...company,
          ownerName: owner?.name ?? "Unknown",
          ownerEmail: owner?.email ?? "",
          userCount,
        };
      }),
    );

    return apiSuccess(enriched, { page, limit, total });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSuperadmin();
    const body: unknown = await request.json();
    const parsed = adminCreateCompanySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.flatten().fieldErrors, 400);
    }

    const owner = await getUserRepository().findByEmail(parsed.data.ownerEmail);
    if (!owner) {
      return apiError("Owner user not found for that email", 400);
    }

    const companyRepo = getCompanyRepository();
    const slug =
      parsed.data.slug ??
      (await uniqueSlug(parsed.data.name, (s) => companyRepo.findBySlug(s).then(Boolean)));

    const company = await companyRepo.create({
      name: parsed.data.name,
      slug,
      plan: parsed.data.plan,
      ownerId: owner.id,
    });

    writeAuditLog({
      actorId: actor.userId,
      actorRole: actor.role,
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
