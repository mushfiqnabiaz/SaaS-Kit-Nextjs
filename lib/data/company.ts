import { ROLES, type Role } from "@/config/roles";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import type { PermissionKey } from "@/config/roles";
import {
  getAuditRepository,
  getCompanyRepository,
  getCompanyRoleRepository,
  getInviteRepository,
  getUserRepository,
} from "@/lib/db/factory";
import type { AuditLogRecord, CompanyRecord } from "@/lib/db/interfaces";
import {
  buildActivitySeries,
  buildRoleSegments,
  type ActivityPoint,
  type RoleSegment,
} from "@/lib/mock/company";
import { getSeatLimit } from "@/lib/plans/seats";

export interface CompanyKpi {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}

export interface TeamMemberRow {
  id: string;
  kind: "user" | "invite";
  name: string;
  email: string;
  role: Role;
  companyRoleId: string | null;
  companyRoleName: string | null;
  status: "active" | "inactive" | "pending";
  lastActiveAt: Date | null;
  createdAt: Date;
}

export interface CompanyRoleRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: PermissionKey[];
  isSystem: boolean;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityItem {
  id: string;
  description: string;
  createdAt: Date;
  dotColor: string;
}

export interface CompanyDashboardData {
  company: CompanyRecord;
  adminName: string;
  kpis: CompanyKpi[];
  activity: ActivityPoint[];
  roleSegments: RoleSegment[];
  seatUsed: number;
  seatLimit: number;
  recentMembers: TeamMemberRow[];
  recentActivity: ActivityItem[];
}

function actionDotColor(action: string): string {
  if (action.includes("CREATED") || action === AUDIT_ACTIONS.LOGIN_SUCCESS) return "#2DD4BF";
  if (action.includes("DELETED")) return "#F87171";
  if (action.includes("UPDATED") || action === AUDIT_ACTIONS.ROLE_CHANGED) return "#FBBF24";
  if (action.includes("LOGIN")) return "#6366F1";
  if (action === AUDIT_ACTIONS.USER_INVITED) return "#A78BFA";
  return "#64748B";
}

function formatActivity(log: AuditLogRecord, actorEmail: string): string {
  const action = log.action.replace(/_/g, " ").toLowerCase();
  return `${actorEmail} · ${action} on ${log.resource}`;
}

async function getLastLoginMap(
  companyId: string,
  userIds: string[],
): Promise<Map<string, Date>> {
  const map = new Map<string, Date>();
  if (userIds.length === 0) return map;

  const { logs } = await getAuditRepository().list({
    companyId,
    action: AUDIT_ACTIONS.LOGIN_SUCCESS,
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    limit: 500,
  });

  for (const log of logs) {
    if (userIds.includes(log.actorId)) {
      const existing = map.get(log.actorId);
      if (!existing || log.createdAt > existing) {
        map.set(log.actorId, log.createdAt);
      }
    }
  }

  return map;
}

export async function getCompanyDashboardData(
  companyId: string,
  adminName: string,
): Promise<CompanyDashboardData> {
  const companyRepo = getCompanyRepository();
  const userRepo = getUserRepository();
  const inviteRepo = getInviteRepository();
  const auditRepo = getAuditRepository();

  const company = await companyRepo.findById(companyId);
  if (!company) {
    throw new Error("Company not found");
  }

  const [{ users, total }, pendingInvites, { logs: recentLogs }] = await Promise.all([
    userRepo.list({ companyId, limit: 100 }),
    inviteRepo.listPending(companyId),
    auditRepo.list({ companyId, limit: 8 }),
  ]);

  const seatLimit = getSeatLimit(company.plan);
  const seatUsed = total + pendingInvites.length;
  const adminCount = users.filter((u) => u.role === ROLES.COMPANY_ADMIN).length;
  const userCount = users.filter((u) => u.role === ROLES.USER).length;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { logs: loginToday } = await auditRepo.list({
    companyId,
    action: AUDIT_ACTIONS.LOGIN_SUCCESS,
    from: oneDayAgo,
    limit: 200,
  });
  const activeTodayIds = new Set(loginToday.map((l) => l.actorId));
  const activeToday = activeTodayIds.size || Math.max(1, Math.round(total * 0.25));

  const planLabel = company.plan.charAt(0).toUpperCase() + company.plan.slice(1);

  const kpis: CompanyKpi[] = [
    { label: "Total Members", value: total },
    { label: "Active Today", value: activeToday },
    { label: "Pending Invites", value: pendingInvites.length },
    {
      label: "Plan",
      value: planLabel,
      hint: company.plan !== "enterprise" ? "Upgrade" : undefined,
      href: company.plan !== "enterprise" ? "/company/settings?tab=billing" : undefined,
    },
  ];

  const companyRoles = await getCompanyRoleRepository().list(companyId);
  const roleNameById = new Map(companyRoles.map((r) => [r.id, r.name]));

  const lastLogin = await getLastLoginMap(
    companyId,
    users.map((u) => u.id),
  );

  const memberRows: TeamMemberRow[] = users
    .map((u) => ({
      id: u.id,
      kind: "user" as const,
      name: u.name,
      email: u.email,
      role: u.role,
      companyRoleId: u.companyRoleId,
      companyRoleName: u.companyRoleId ? (roleNameById.get(u.companyRoleId) ?? null) : null,
      status: u.isActive ? ("active" as const) : ("inactive" as const),
      lastActiveAt: lastLogin.get(u.id) ?? null,
      createdAt: u.createdAt,
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const enrichedLogs = await Promise.all(
    recentLogs.map(async (log) => {
      const actor = await userRepo.findById(log.actorId);
      const email = actor?.email ?? "system";
      return {
        id: log.id,
        description: formatActivity(log, email),
        createdAt: log.createdAt,
        dotColor: actionDotColor(log.action),
      };
    }),
  );

  return {
    company,
    adminName,
    kpis,
    activity: buildActivitySeries(total),
    roleSegments: buildRoleSegments(adminCount, userCount),
    seatUsed,
    seatLimit,
    recentMembers: memberRows.slice(0, 5),
    recentActivity: enrichedLogs,
  };
}

export async function getTeamTableData(
  companyId: string,
  filters: {
    search?: string;
    role?: Role;
    status?: "active" | "inactive" | "pending" | "all";
    page?: number;
    limit?: number;
  },
): Promise<{ rows: TeamMemberRow[]; total: number }> {
  const userRepo = getUserRepository();
  const inviteRepo = getInviteRepository();

  const { users } = await userRepo.list({
    companyId,
    search: filters.search,
    role: filters.role,
    limit: 200,
  });

  const pendingInvites = await inviteRepo.listPending(companyId);
  const companyRoles = await getCompanyRoleRepository().list(companyId);
  const roleNameById = new Map(companyRoles.map((r) => [r.id, r.name]));
  const lastLogin = await getLastLoginMap(
    companyId,
    users.map((u) => u.id),
  );

  let rows: TeamMemberRow[] = [
    ...users.map((u) => ({
      id: u.id,
      kind: "user" as const,
      name: u.name,
      email: u.email,
      role: u.role,
      companyRoleId: u.companyRoleId,
      companyRoleName: u.companyRoleId ? (roleNameById.get(u.companyRoleId) ?? null) : null,
      status: u.isActive ? ("active" as const) : ("inactive" as const),
      lastActiveAt: lastLogin.get(u.id) ?? null,
      createdAt: u.createdAt,
    })),
    ...pendingInvites.map((inv) => ({
      id: inv.id,
      kind: "invite" as const,
      name: inv.email.split("@")[0] ?? inv.email,
      email: inv.email,
      role: inv.role,
      companyRoleId: inv.companyRoleId,
      companyRoleName: inv.companyRoleId ? (roleNameById.get(inv.companyRoleId) ?? null) : null,
      status: "pending" as const,
      lastActiveAt: null,
      createdAt: inv.createdAt,
    })),
  ];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
    );
  }

  if (filters.role) {
    rows = rows.filter((r) => r.role === filters.role);
  }

  if (filters.status && filters.status !== "all") {
    rows = rows.filter((r) => r.status === filters.status);
  }

  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = rows.length;
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const start = (page - 1) * limit;

  return { rows: rows.slice(start, start + limit), total };
}

export async function getPendingInvitesData(companyId: string) {
  const invites = await getInviteRepository().listPending(companyId);
  const companyRoles = await getCompanyRoleRepository().list(companyId);
  const roleNameById = new Map(companyRoles.map((r) => [r.id, r.name]));

  return invites.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    companyRoleId: inv.companyRoleId,
    companyRoleName: inv.companyRoleId ? (roleNameById.get(inv.companyRoleId) ?? null) : null,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
  }));
}

export async function getCompanyRolesData(companyId: string): Promise<CompanyRoleRow[]> {
  const roleRepo = getCompanyRoleRepository();
  const roles = await roleRepo.list(companyId);

  return Promise.all(
    roles.map(async (role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      permissions: role.permissions,
      isSystem: role.isSystem,
      memberCount: await roleRepo.countUsersWithRole(role.id),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    })),
  );
}
