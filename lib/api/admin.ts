import { ROLES } from "@/config/roles";
import { ForbiddenError } from "@/lib/errors";
import { requireApiUser } from "@/lib/api/auth";
import type { SessionUser } from "@/types";

export async function requireSuperadmin(): Promise<SessionUser> {
  const user = await requireApiUser();
  if (user.role !== ROLES.SUPERADMIN) {
    throw new ForbiddenError("Superadmin access required");
  }
  return user;
}
