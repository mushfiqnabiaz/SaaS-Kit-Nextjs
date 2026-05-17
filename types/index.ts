import type { PermissionKey, Role } from "@/config/roles";

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
  companyId: string | null;
  companyRoleId?: string | null;
  plan: string | null;
  permissions?: PermissionKey[];
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
}
