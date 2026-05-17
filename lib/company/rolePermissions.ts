import {
  ASSIGNABLE_COMPANY_PERMISSIONS,
  parsePermissionKey,
  type PermissionKey,
} from "@/config/roles";

export function slugifyRoleName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function sanitizeAssignablePermissions(permissions: string[]): PermissionKey[] {
  const unique = new Set<PermissionKey>();
  for (const key of permissions) {
    if ((ASSIGNABLE_COMPANY_PERMISSIONS as readonly string[]).includes(key)) {
      unique.add(key as PermissionKey);
    }
  }
  return Array.from(unique);
}

export const PERMISSION_GROUPS = ASSIGNABLE_COMPANY_PERMISSIONS.reduce<
  Record<string, { key: PermissionKey; label: string }[]>
>((groups, key) => {
  const parsed = parsePermissionKey(key);
  if (!parsed) return groups;
  const resourceLabel =
    parsed.resource === "audit_logs"
      ? "Audit logs"
      : parsed.resource.charAt(0).toUpperCase() + parsed.resource.slice(1);
  if (!groups[resourceLabel]) groups[resourceLabel] = [];
  groups[resourceLabel].push({
    key,
    label: parsed.action.charAt(0).toUpperCase() + parsed.action.slice(1),
  });
  return groups;
}, {});
