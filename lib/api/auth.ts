import { auth } from "@/auth";
import { enrichSessionUser } from "@/lib/auth/resolvePermissions";
import { UnauthorizedError } from "@/lib/errors";
import { getSessionUserFromHeaders } from "@/lib/auth/requestContext";
import type { SessionUser } from "@/types";

export async function getApiUser(): Promise<SessionUser | null> {
  const session = await auth();

  if (session?.user?.id) {
    const base: SessionUser = {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name ?? "",
      role: session.user.role,
      companyId: session.user.companyId,
      plan: session.user.plan,
    };
    return enrichSessionUser(base);
  }

  const fromHeaders = await getSessionUserFromHeaders();
  if (!fromHeaders) return null;
  return enrichSessionUser(fromHeaders);
}

export async function requireApiUser(): Promise<SessionUser> {
  const user = await getApiUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}
