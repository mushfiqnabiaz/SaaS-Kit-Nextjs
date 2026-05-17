import type { Role } from "@/config/roles";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import {
  buildGrowthSeries,
  buildPlanSegments,
  buildSparkline,
  computeTrend,
  type GrowthPoint,
  type PlanSegment,
  type SparklinePoint,
} from "@/lib/mock/superadmin";
import {
  getAuditRepository,
  getCompanyRepository,
  getPlatformSettingsRepository,
  getUserRepository,
} from "@/lib/db/factory";
import type { AuditLogRecord, PlatformFeatureFlags } from "@/lib/db/interfaces";

export interface KpiCardData {
  label: string;
  value: number;
  trendPercent: number;
  trendDirection: "up" | "down" | "flat";
  sparkline: SparklinePoint[];
}

export interface OverviewPageData {
  kpis: KpiCardData[];
  growth: GrowthPoint[];
  planSegments: PlanSegment[];
  totalCompanies: number;
  recentActivity: ActivityItem[];
  topCompanies: TopCompanyRow[];
}

export interface ActivityItem {
  id: string;
  actorName: string;
  actorEmail: string;
  action: string;
  resource: string;
  description: string;
  createdAt: Date;
  dotColor: string;
}

export interface TopCompanyRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  userCount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface CompanyTableRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  ownerName: string;
  ownerEmail: string;
  userCount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface UserTableRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string | null;
  companyName: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface AuditTableRow {
  id: string;
  createdAt: Date;
  actorName: string;
  actorEmail: string;
  actorRole: Role;
  action: string;
  resource: string;
  resourceId: string | null;
  companyName: string | null;
  ip: string | null;
}

function actionDotColor(action: string): string {
  if (action.includes("CREATED") || action === AUDIT_ACTIONS.LOGIN_SUCCESS) return "#00FF94";
  if (action.includes("DELETED")) return "#FF4D6A";
  if (action.includes("UPDATED") || action === AUDIT_ACTIONS.ROLE_CHANGED) return "#F59E0B";
  if (action.includes("LOGIN")) return "#00D4FF";
  if (action === AUDIT_ACTIONS.IMPERSONATION_START) return "#A855F7";
  return "#6B7280";
}

function formatActivityDescription(
  log: AuditLogRecord,
  actorEmail: string,
): string {
  const action = log.action.replace(/_/g, " ").toLowerCase();
  return `${actorEmail} · ${action} on ${log.resource}`;
}

export async function getOverviewPageData(): Promise<OverviewPageData> {
  const companyRepo = getCompanyRepository();
  const userRepo = getUserRepository();
  const auditRepo = getAuditRepository();

  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

  const [
    totalCompanies,
    activeCompanies,
    totalUsers,
    newSignups30d,
    newSignupsPrev30d,
    companiesPrev,
    usersPrev,
    loginsToday,
    recentLogs,
    allCompanies,
  ] = await Promise.all([
    companyRepo.count(),
    companyRepo.count({ isActive: true }),
    userRepo.count(),
    userRepo.count({ createdAfter: thirtyDaysAgo }),
    userRepo.count({ createdAfter: sixtyDaysAgo }),
    companyRepo.list({ limit: 500 }),
    userRepo.list({ limit: 1, page: 1, allowUnscoped: true }),
    auditRepo.list({ action: AUDIT_ACTIONS.LOGIN_SUCCESS, from: oneDayAgo, limit: 1 }),
    auditRepo.list({ limit: 10 }),
    companyRepo.list({ limit: 100 }),
  ]);

  const prevSignups = Math.max(0, newSignupsPrev30d - newSignups30d);
  const prevCompanies = Math.max(0, totalCompanies - Math.min(totalCompanies, 12));
  const prevUsers = Math.max(0, totalUsers - newSignups30d);

  const activeToday = loginsToday.total || Math.max(1, Math.round(totalUsers * 0.12));

  const kpiData: KpiCardData[] = [
    {
      label: "Total Companies",
      value: totalCompanies,
      trendPercent: computeTrend(totalCompanies, prevCompanies).percent,
      trendDirection: computeTrend(totalCompanies, prevCompanies).direction,
      sparkline: buildSparkline(totalCompanies),
    },
    {
      label: "Total Users",
      value: totalUsers,
      trendPercent: computeTrend(totalUsers, prevUsers).percent,
      trendDirection: computeTrend(totalUsers, prevUsers).direction,
      sparkline: buildSparkline(totalUsers),
    },
    {
      label: "Active Today",
      value: activeToday,
      trendPercent: computeTrend(activeToday, Math.max(1, activeToday - 8)).percent,
      trendDirection: computeTrend(activeToday, Math.max(1, activeToday - 8)).direction,
      sparkline: buildSparkline(activeToday),
    },
    {
      label: "New Signups (30d)",
      value: newSignups30d,
      trendPercent: computeTrend(newSignups30d, prevSignups).percent,
      trendDirection: computeTrend(newSignups30d, prevSignups).direction,
      sparkline: buildSparkline(newSignups30d),
    },
  ];

  const planCounts: Record<string, number> = { free: 0, pro: 0, enterprise: 0 };
  for (const c of allCompanies.companies) {
    const p = c.plan in planCounts ? c.plan : "free";
    planCounts[p] = (planCounts[p] ?? 0) + 1;
  }

  const enrichedLogs = await Promise.all(
    recentLogs.logs.map(async (log) => {
      const actor = await userRepo.findById(log.actorId);
      const email = actor?.email ?? "unknown@system.local";
      return {
        id: log.id,
        actorName: actor?.name ?? "Unknown",
        actorEmail: email,
        action: log.action,
        resource: log.resource,
        description: formatActivityDescription(log, email),
        createdAt: log.createdAt,
        dotColor: actionDotColor(log.action),
      };
    }),
  );

  const topCompanies = await Promise.all(
    allCompanies.companies
      .slice(0, 20)
      .map(async (company) => ({
        id: company.id,
        name: company.name,
        slug: company.slug,
        plan: company.plan,
        userCount: await userRepo.count({ companyId: company.id }),
        isActive: company.isActive,
        createdAt: company.createdAt,
      })),
  );

  topCompanies.sort((a, b) => b.userCount - a.userCount);

  void companiesPrev;
  void usersPrev;
  void activeCompanies;

  return {
    kpis: kpiData,
    growth: buildGrowthSeries(totalUsers, newSignups30d),
    planSegments: buildPlanSegments(planCounts),
    totalCompanies,
    recentActivity: enrichedLogs,
    topCompanies: topCompanies.slice(0, 5),
  };
}

export async function getCompaniesTableData(filters: {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
  isActive?: boolean;
}): Promise<{ rows: CompanyTableRow[]; total: number }> {
  const { companies, total } = await getCompanyRepository().list({
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
    search: filters.search,
    isActive: filters.isActive,
  });

  const userRepo = getUserRepository();
  const rows = await Promise.all(
    companies
      .filter((c) => !filters.plan || c.plan === filters.plan)
      .map(async (company) => {
        const owner = await userRepo.findById(company.ownerId);
        return {
          id: company.id,
          name: company.name,
          slug: company.slug,
          plan: company.plan,
          ownerName: owner?.name ?? "—",
          ownerEmail: owner?.email ?? "—",
          userCount: await userRepo.count({ companyId: company.id }),
          isActive: company.isActive,
          createdAt: company.createdAt,
        };
      }),
  );

  return { rows, total };
}

export async function getUsersTableData(filters: {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  companyId?: string;
  isActive?: boolean;
}): Promise<{ rows: UserTableRow[]; total: number }> {
  const { users, total } = await getUserRepository().list({
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
    search: filters.search,
    role: filters.role,
    companyId: filters.companyId,
    isActive: filters.isActive,
    allowUnscoped: !filters.companyId,
  });

  const companyRepo = getCompanyRepository();
  const rows = await Promise.all(
    users.map(async (user) => {
      const company = user.companyId ? await companyRepo.findById(user.companyId) : null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: company?.name ?? null,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };
    }),
  );

  return { rows, total };
}

export async function getAuditTableData(filters: {
  page?: number;
  limit?: number;
  action?: string;
  actorRole?: Role;
  companyId?: string;
  from?: Date;
  to?: Date;
}): Promise<{ rows: AuditTableRow[]; total: number }> {
  const { logs, total } = await getAuditRepository().list({
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
    action: filters.action,
    actorRole: filters.actorRole,
    companyId: filters.companyId,
    from: filters.from,
    to: filters.to,
  });

  const userRepo = getUserRepository();
  const companyRepo = getCompanyRepository();

  const rows = await Promise.all(
    logs.map(async (log) => {
      const actor = await userRepo.findById(log.actorId);
      const company = log.companyId ? await companyRepo.findById(log.companyId) : null;
      return {
        id: log.id,
        createdAt: log.createdAt,
        actorName: actor?.name ?? "Unknown",
        actorEmail: actor?.email ?? "—",
        actorRole: log.actorRole,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        companyName: company?.name ?? null,
        ip: log.ip,
      };
    }),
  );

  return { rows, total };
}

export async function getCompanyOptions(): Promise<{ id: string; name: string }[]> {
  const { companies } = await getCompanyRepository().list({ limit: 200 });
  return companies.map((c) => ({ id: c.id, name: c.name }));
}

export interface SettingsPageData {
  featureFlags: PlatformFeatureFlags;
  updatedAt: string;
}

/** Platform settings for superadmin — replace mock-only fields when branding moves to DB. */
export async function getSettingsPageData(): Promise<SettingsPageData> {
  const settings = await getPlatformSettingsRepository().get();
  return {
    featureFlags: settings.featureFlags,
    updatedAt: settings.updatedAt.toISOString(),
  };
}
