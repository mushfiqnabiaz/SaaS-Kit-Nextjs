import type { PlatformFeatureFlags } from "@/lib/db/interfaces";

export const DEFAULT_PLATFORM_FEATURE_FLAGS: PlatformFeatureFlags = {
  free: { invites: true, auditLogs: false, apiAccess: false },
  pro: { invites: true, auditLogs: true, apiAccess: true },
  enterprise: { invites: true, auditLogs: true, apiAccess: true },
};
