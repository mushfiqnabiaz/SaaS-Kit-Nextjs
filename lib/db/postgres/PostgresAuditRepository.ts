import { and, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import type { Role } from "@/config/roles";
import type {
  AuditLogListFilters,
  AuditLogRecord,
  CreateAuditLogDTO,
  IAuditRepository,
} from "@/lib/db/interfaces";
import { getPostgresDb } from "@/lib/db/postgres/postgresConnection";
import { auditLogs } from "@/models/postgres/schema";

function toAuditRecord(row: typeof auditLogs.$inferSelect): AuditLogRecord {
  return {
    id: row.id,
    actorId: row.actorId,
    actorRole: row.actorRole as Role,
    action: row.action,
    resource: row.resource,
    resourceId: row.resourceId ?? null,
    companyId: row.companyId ?? null,
    ip: row.ip ?? null,
    userAgent: row.userAgent ?? null,
    createdAt: row.createdAt,
  };
}

export class PostgresAuditRepository implements IAuditRepository {
  private static instance: PostgresAuditRepository | null = null;

  static getInstance(): PostgresAuditRepository {
    if (!PostgresAuditRepository.instance) {
      PostgresAuditRepository.instance = new PostgresAuditRepository();
    }
    return PostgresAuditRepository.instance;
  }

  async create(data: CreateAuditLogDTO): Promise<AuditLogRecord> {
    const db = getPostgresDb();
    const [row] = await db
      .insert(auditLogs)
      .values({
        actorId: data.actorId,
        actorRole: data.actorRole,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId ?? null,
        companyId: data.companyId ?? null,
        ip: data.ip ?? null,
        userAgent: data.userAgent ?? null,
      })
      .returning();
    return toAuditRecord(row);
  }

  async list(
    filters: AuditLogListFilters = {},
  ): Promise<{ logs: AuditLogRecord[]; total: number }> {
    const db = getPostgresDb();
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const conditions: SQL[] = [];

    if (filters.companyId) conditions.push(eq(auditLogs.companyId, filters.companyId));
    if (filters.actorId) conditions.push(eq(auditLogs.actorId, filters.actorId));
    if (filters.actorRole) conditions.push(eq(auditLogs.actorRole, filters.actorRole));
    if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
    if (filters.from) conditions.push(gte(auditLogs.createdAt, filters.from));
    if (filters.to) conditions.push(lte(auditLogs.createdAt, filters.to));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .offset((page - 1) * limit)
        .limit(limit),
      db.select({ total: count() }).from(auditLogs).where(whereClause),
    ]);

    return {
      logs: rows.map(toAuditRecord),
      total: Number(total),
    };
  }
}
