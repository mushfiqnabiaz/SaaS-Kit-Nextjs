import { getCompanyRepository, getInviteRepository, getUserRepository } from "@/lib/db/factory";
import { getSeatLimit } from "@/lib/plans/seats";

export async function assertSeatAvailable(
  companyId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const company = await getCompanyRepository().findById(companyId);
  if (!company?.isActive) {
    return { ok: false, message: "Company not found or inactive" };
  }

  const limit = getSeatLimit(company.plan);
  const [activeUsers, pendingInvites] = await Promise.all([
    getUserRepository().count({ companyId, isActive: true }),
    getInviteRepository().listPending(companyId),
  ]);

  if (activeUsers + pendingInvites.length >= limit) {
    return {
      ok: false,
      message: `Seat limit reached (${limit} seats on ${company.plan} plan)`,
    };
  }

  return { ok: true };
}
