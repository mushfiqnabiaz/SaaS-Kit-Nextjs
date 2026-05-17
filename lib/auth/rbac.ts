import {
  PERMISSIONS,
  ROLES,
  type PermissionAction,
  type PermissionKey,
  type PermissionResource,
  permissionKey,
} from "@/config/roles";
import { ForbiddenError } from "@/lib/errors";
import type { SessionUser } from "@/types";

export interface PermissionContext {
  /** Target company for company-scoped actions */
  targetCompanyId?: string | null;
  /** Target user for self-service checks */
  targetUserId?: string | null;
}

function hasPermission(user: SessionUser, key: PermissionKey): boolean {
  if (user.permissions?.length) {
    return user.permissions.includes(key);
  }
  return PERMISSIONS[user.role].includes(key);
}

const TENANT_SCOPED_RESOURCES = new Set<string>([
  "users",
  "companies",
  "audit_logs",
  "billing",
  "roles",
]);

/**
 * Returns true if the user may perform `action` on `resource`.
 * Superadmin always passes. Company admins are scoped to their own company when context is provided.
 */
export function checkPermission(
  user: SessionUser,
  resource: PermissionResource | string,
  action: PermissionAction | string,
  context: PermissionContext = {},
): boolean {
  if (user.role === ROLES.SUPERADMIN) {
    return true;
  }

  const key = permissionKey(
    resource as PermissionResource,
    action as PermissionAction,
  );

  if (!hasPermission(user, key)) {
    return false;
  }

  if (user.role === ROLES.COMPANY_ADMIN || user.permissions?.includes(key)) {
    if (resource === "companies" && context.targetCompanyId) {
      return context.targetCompanyId === user.companyId;
    }
    if (
      TENANT_SCOPED_RESOURCES.has(resource) &&
      context.targetCompanyId !== undefined &&
      context.targetCompanyId !== null
    ) {
      return context.targetCompanyId === user.companyId;
    }
  }

  if (user.role === ROLES.USER) {
    if (resource === "users" && (action === "read" || action === "update")) {
      if (context.targetUserId) {
        return context.targetUserId === user.userId;
      }
    }
    if (resource === "companies" && context.targetCompanyId) {
      return context.targetCompanyId === user.companyId;
    }
    if (resource === "workspace") {
      return Boolean(user.companyId);
    }
  }

  if (
    user.role === ROLES.USER &&
    TENANT_SCOPED_RESOURCES.has(resource) &&
    (action === "read" || action === "update" || action === "delete")
  ) {
    if (
      (context.targetCompanyId === undefined || context.targetCompanyId === null) &&
      context.targetUserId === undefined
    ) {
      return false;
    }
  }

  return true;
}

export function requirePermission(
  user: SessionUser,
  resource: PermissionResource | string,
  action: PermissionAction | string,
  context: PermissionContext = {},
): void {
  if (!checkPermission(user, resource, action, context)) {
    throw new ForbiddenError();
  }
}
