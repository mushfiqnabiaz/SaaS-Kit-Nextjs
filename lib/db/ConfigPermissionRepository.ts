import {
  PERMISSIONS,
  permissionKey,
  type PermissionAction,
  type PermissionKey,
  type PermissionResource,
  type Role,
} from "@/config/roles";
import type { IPermissionRepository, PermissionRecord } from "@/lib/db/interfaces";

export class ConfigPermissionRepository implements IPermissionRepository {
  private static instance: ConfigPermissionRepository | null = null;

  static getInstance(): ConfigPermissionRepository {
    if (!ConfigPermissionRepository.instance) {
      ConfigPermissionRepository.instance = new ConfigPermissionRepository();
    }
    return ConfigPermissionRepository.instance;
  }

  async findByRole(role: Role): Promise<PermissionRecord[]> {
    return PERMISSIONS[role].map((key, index) => {
      const [resource, action] = key.split(":") as [PermissionResource, PermissionAction];
      return {
        id: `${role}-${index}`,
        role,
        resource,
        action,
      };
    });
  }

  async hasPermission(
    role: Role,
    resource: PermissionResource,
    action: PermissionAction,
  ): Promise<boolean> {
    const key = permissionKey(resource, action);
    return PERMISSIONS[role].includes(key as PermissionKey);
  }
}
