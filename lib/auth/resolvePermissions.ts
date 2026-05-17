import {
  PERMISSIONS,
  ROLES,
  type PermissionKey,
  type Role,
} from "@/config/roles";
import type { CompanyRoleRecord, UserRecord } from "@/lib/db/interfaces";
import { getCompanyRoleRepository } from "@/lib/db/factory";

export function permissionsForBuiltinRole(role: Role): PermissionKey[] {
  return [...PERMISSIONS[role]];
}

export function permissionsForCompanyRole(role: CompanyRoleRecord): PermissionKey[] {
  return [...role.permissions];
}

export function mergePermissions(
  base: readonly PermissionKey[],
  custom: readonly PermissionKey[],
): PermissionKey[] {
  return Array.from(new Set([...base, ...custom]));
}

export async function resolveUserPermissions(user: UserRecord): Promise<PermissionKey[]> {
  if (user.role === ROLES.SUPERADMIN) {
    return permissionsForBuiltinRole(ROLES.SUPERADMIN);
  }

  if (user.role === ROLES.COMPANY_ADMIN) {
    return permissionsForBuiltinRole(ROLES.COMPANY_ADMIN);
  }

  const base = permissionsForBuiltinRole(ROLES.USER);

  if (!user.companyRoleId) {
    return base;
  }

  const companyRole = await getCompanyRoleRepository().findById(user.companyRoleId);
  if (!companyRole || companyRole.companyId !== user.companyId) {
    return base;
  }

  return mergePermissions(base, companyRole.permissions);
}

export async function enrichSessionUser<T extends { userId: string; role: Role }>(
  session: T,
): Promise<T & { permissions: PermissionKey[]; companyRoleId: string | null }> {
  const { getUserRepository } = await import("@/lib/db/factory");
  const record = await getUserRepository().findById(session.userId);

  if (!record) {
    return {
      ...session,
      permissions: permissionsForBuiltinRole(session.role),
      companyRoleId: null,
    };
  }

  const permissions = await resolveUserPermissions(record);
  return {
    ...session,
    permissions,
    companyRoleId: record.companyRoleId,
  };
}
