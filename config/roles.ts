export const ROLES = {
  SUPERADMIN: "superadmin",
  COMPANY_ADMIN: "company_admin",
  USER: "user",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.SUPERADMIN]: "Super Admin",
  [ROLES.COMPANY_ADMIN]: "Company Admin",
  [ROLES.USER]: "User",
};

export const PERMISSION_RESOURCES = [
  "users",
  "companies",
  "audit_logs",
  "billing",
  "workspace",
  "roles",
] as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number];

export const PERMISSION_ACTIONS = ["create", "read", "update", "delete", "list"] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export type PermissionKey = `${PermissionResource}:${PermissionAction}`;

function p(resource: PermissionResource, ...actions: PermissionAction[]): PermissionKey[] {
  return actions.map((action) => `${resource}:${action}` as PermissionKey);
}

const ALL_PERMISSIONS: PermissionKey[] = PERMISSION_RESOURCES.flatMap((resource) =>
  PERMISSION_ACTIONS.map((action) => `${resource}:${action}` as PermissionKey),
);

/** Role → allowed (resource, action) pairs */
export const PERMISSIONS: Record<Role, readonly PermissionKey[]> = {
  [ROLES.SUPERADMIN]: ALL_PERMISSIONS,
  [ROLES.COMPANY_ADMIN]: [
    ...p("users", "create", "read", "update", "delete", "list"),
    ...p("companies", "read", "update"),
    ...p("audit_logs", "read", "list"),
    ...p("billing", "read"),
    ...p("workspace", "read", "update", "list"),
    ...p("roles", "create", "read", "update", "delete", "list"),
  ],
  [ROLES.USER]: [
    ...p("users", "read", "update"),
    ...p("companies", "read"),
    ...p("workspace", "read", "list"),
  ],
};

export function permissionKey(
  resource: PermissionResource,
  action: PermissionAction,
): PermissionKey {
  return `${resource}:${action}`;
}

/** Permissions a company admin may grant when creating custom roles */
export const ASSIGNABLE_COMPANY_PERMISSIONS: readonly PermissionKey[] = [
  ...p("users", "create", "read", "update", "list"),
  ...p("users", "delete"),
  ...p("audit_logs", "read", "list"),
  ...p("billing", "read"),
  ...p("workspace", "read", "update", "list"),
] as const;

export const DEFAULT_MEMBER_PERMISSIONS: PermissionKey[] = [
  ...p("users", "read", "update"),
  ...p("companies", "read"),
  ...p("workspace", "read", "list"),
];

export const DEFAULT_TEAM_LEAD_PERMISSIONS: PermissionKey[] = [
  ...p("users", "create", "read", "update", "list"),
  ...p("audit_logs", "read", "list"),
  ...p("workspace", "read", "update", "list"),
];

export function isValidAssignablePermission(key: string): key is PermissionKey {
  return (ASSIGNABLE_COMPANY_PERMISSIONS as readonly string[]).includes(key);
}

export function parsePermissionKey(key: string): {
  resource: PermissionResource;
  action: PermissionAction;
} | null {
  const parts = key.split(":");
  if (parts.length !== 2) return null;
  const [resource, action] = parts;
  if (!(PERMISSION_RESOURCES as readonly string[]).includes(resource)) return null;
  if (!(PERMISSION_ACTIONS as readonly string[]).includes(action)) return null;
  return { resource: resource as PermissionResource, action: action as PermissionAction };
}
