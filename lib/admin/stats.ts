import {
  getAuditRepository,
  getCompanyRepository,
  getUserRepository,
} from "@/lib/db/factory";

export async function getAdminDashboardStats() {
  const companyRepo = getCompanyRepository();
  const userRepo = getUserRepository();
  const auditRepo = getAuditRepository();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalCompanies, activeCompanies, totalUsers, newSignups, recentLogs] =
    await Promise.all([
      companyRepo.count(),
      companyRepo.count({ isActive: true }),
      userRepo.count(),
      userRepo.count({ createdAfter: thirtyDaysAgo }),
      auditRepo.list({ limit: 10 }),
    ]);

  const userRepoForEnrich = getUserRepository();
  const enrichedLogs = await Promise.all(
    recentLogs.logs.map(async (log) => {
      const actor = await userRepoForEnrich.findById(log.actorId);
      return {
        ...log,
        actorName: actor?.name ?? "Unknown",
      };
    }),
  );

  return {
    totalCompanies,
    activeCompanies,
    totalUsers,
    newSignups,
    recentAuditLogs: enrichedLogs,
  };
}
