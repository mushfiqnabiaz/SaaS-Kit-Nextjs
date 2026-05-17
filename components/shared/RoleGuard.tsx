import type { ReactNode } from "react";
import { auth } from "@/auth";
import type { Role } from "@/config/roles";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * UI-only role guard. Route security is enforced in middleware and API handlers.
 */
export async function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const session = await auth();

  if (!session?.user?.role || !allowedRoles.includes(session.user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
