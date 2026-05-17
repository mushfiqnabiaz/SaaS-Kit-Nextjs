import { headers } from "next/headers";
import { ROLES, type Role } from "@/config/roles";
import type { SessionUser } from "@/types";

/**
 * Build SessionUser from middleware-injected headers (API routes / server components).
 */
export async function getSessionUserFromHeaders(): Promise<SessionUser | null> {
  const headerStore = await headers();
  const userId = headerStore.get("x-user-id");
  const email = headerStore.get("x-user-email");
  const role = headerStore.get("x-user-role") as Role | null;
  const companyId = headerStore.get("x-company-id");

  if (!userId || !role) {
    return null;
  }

  return {
    userId,
    email: email ?? "",
    name: "",
    role,
    companyId: companyId && companyId.length > 0 ? companyId : null,
    plan: null,
  };
}

export async function requireSessionUserFromHeaders(): Promise<SessionUser> {
  const user = await getSessionUserFromHeaders();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function isSuperadmin(user: SessionUser): boolean {
  return user.role === ROLES.SUPERADMIN;
}
