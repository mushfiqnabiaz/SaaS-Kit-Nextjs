import { ROLES, ROLE_LABELS, type Role } from "@/config/roles";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import {
  getAuditRepository,
  getCompanyRepository,
  getUserRepository,
} from "@/lib/db/factory";
import type { UserRecord } from "@/lib/db/interfaces";
import { format } from "date-fns";

export interface PersonalActivityItem {
  id: string;
  action: string;
  icon: "login" | "profile" | "security" | "default";
  createdAt: Date;
}

export interface TeammatePreview {
  id: string;
  name: string;
  email: string;
  role: Role;
  isAdmin: boolean;
}

export interface UserDashboardData {
  user: UserRecord;
  companyName: string | null;
  companyInitial: string;
  roleLabel: string;
  memberSince: string;
  teamSize: number;
  isActive: boolean;
  lastLoginText: string;
  recentActivity: PersonalActivityItem[];
  teammates: TeammatePreview[];
  totalTeammates: number;
}

export interface UserProfileData {
  user: UserRecord;
  companyName: string | null;
  memberSince: string;
}

function activityIcon(action: string): PersonalActivityItem["icon"] {
  if (action.includes("LOGIN")) return "login";
  if (action.includes("PASSWORD") || action.includes("UPDATED")) return "security";
  if (action.includes("USER")) return "profile";
  return "default";
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatDistance(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export async function getUserDashboardData(
  userId: string,
  companyId: string | null,
): Promise<UserDashboardData> {
  const userRepo = getUserRepository();
  const auditRepo = getAuditRepository();
  const companyRepo = getCompanyRepository();

  const user = await userRepo.findById(userId);
  if (!user) throw new Error("User not found");

  const company = companyId ? await companyRepo.findById(companyId) : null;
  const teamSize = companyId ? await userRepo.count({ companyId }) : 0;

  const [{ logs: activityLogs }, { logs: loginLogs }, teammatesResult] = await Promise.all([
    auditRepo.list({ actorId: userId, limit: 6 }),
    auditRepo.list({
      actorId: userId,
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      limit: 3,
    }),
    companyId
      ? userRepo.list({ companyId, isActive: true, limit: 50 })
      : Promise.resolve({ users: [], total: 0 }),
  ]);

  const lastLogin = loginLogs[0];
  const lastLoginText = lastLogin
    ? `Last signed in ${formatDistance(lastLogin.createdAt)}${lastLogin.ip ? ` from ${lastLogin.ip}` : ""}`
    : "Welcome — this is your first session";

  const recentActivity: PersonalActivityItem[] = activityLogs.map((log) => ({
    id: log.id,
    action: formatAction(log.action),
    icon: activityIcon(log.action),
    createdAt: log.createdAt,
  }));

  const teammates: TeammatePreview[] = teammatesResult.users
    .filter((u) => u.id !== userId)
    .slice(0, 8)
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isAdmin: u.role === ROLES.COMPANY_ADMIN,
    }));

  const companyName = company?.name ?? null;

  return {
    user,
    companyName,
    companyInitial: (companyName ?? user.name).charAt(0).toUpperCase(),
    roleLabel:
      user.role === ROLES.USER
        ? `Member at ${companyName ?? "your workspace"}`
        : `${ROLE_LABELS[user.role]} at ${companyName ?? "your workspace"}`,
    memberSince: format(user.createdAt, "MMMM yyyy"),
    teamSize,
    isActive: user.isActive,
    lastLoginText,
    recentActivity,
    teammates,
    totalTeammates: Math.max(0, teammatesResult.total - 1),
  };
}

export async function getUserProfileData(
  userId: string,
  companyId: string | null,
): Promise<UserProfileData> {
  const user = await getUserRepository().findById(userId);
  if (!user) throw new Error("User not found");

  const company = companyId
    ? await getCompanyRepository().findById(companyId)
    : null;

  return {
    user,
    companyName: company?.name ?? null,
    memberSince: format(user.createdAt, "MMMM d, yyyy"),
  };
}

export async function getTeamPageData(
  companyId: string,
  currentUserId: string,
  search?: string,
): Promise<{ companyName: string; members: TeammatePreview[]; total: number }> {
  const company = await getCompanyRepository().findById(companyId);
  if (!company) throw new Error("Company not found");

  const { users, total } = await getUserRepository().list({
    companyId,
    search,
    isActive: true,
    limit: 100,
  });

  const members: TeammatePreview[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isAdmin: u.role === ROLES.COMPANY_ADMIN,
  }));

  return {
    companyName: company.name,
    members,
    total,
  };
}
