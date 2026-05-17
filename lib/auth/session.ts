import type { Role } from "@/config/roles";
import type { SessionUser } from "@/types";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: Role;
  companyId: string | null;
  plan: string | null;
  sessionId?: string;
  impersonatedBy?: string;
}

export function toSessionUser(payload: AuthTokenPayload, name: string): SessionUser {
  return {
    userId: payload.userId,
    email: payload.email,
    name,
    role: payload.role,
    companyId: payload.companyId,
    plan: payload.plan,
  };
}

export function getDashboardPath(role: Role): string {
  switch (role) {
    case "superadmin":
      return "/superadmin/dashboard";
    case "company_admin":
      return "/company/dashboard";
    default:
      return "/app/dashboard";
  }
}
