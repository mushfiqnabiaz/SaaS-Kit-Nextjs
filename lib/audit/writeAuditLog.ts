import type { Role } from "@/config/roles";
import { getAuditRepository } from "@/lib/db/factory";

export interface WriteAuditLogInput {
  actorId: string;
  actorRole: Role;
  action: string;
  resource: string;
  resourceId?: string | null;
  companyId?: string | null;
  req?: Request;
}

function extractRequestMeta(req?: Request): { ip: string | null; userAgent: string | null } {
  if (!req) return { ip: null, userAgent: null };
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip");
  const userAgent = req.headers.get("user-agent");
  return { ip: ip ?? null, userAgent };
}

export function writeAuditLog(input: WriteAuditLogInput): void {
  const { ip, userAgent } = extractRequestMeta(input.req);

  void getAuditRepository()
    .create({
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      companyId: input.companyId ?? null,
      ip,
      userAgent,
    })
    .catch((error: unknown) => {
      console.error("[audit] Failed to write audit log:", error);
    });
}
