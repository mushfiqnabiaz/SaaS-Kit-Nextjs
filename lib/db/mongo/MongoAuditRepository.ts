import type { Role } from "@/config/roles";
import type {
  AuditLogListFilters,
  AuditLogRecord,
  CreateAuditLogDTO,
  IAuditRepository,
} from "@/lib/db/interfaces";
import { connectMongo } from "@/lib/db/mongo/mongoConnection";
import { AuditLogModel } from "@/models/mongo/AuditLog";

function toAuditRecord(doc: Record<string, unknown>): AuditLogRecord {
  const d = doc as {
    _id: { toString(): string };
    actorId: { toString(): string };
    actorRole: Role;
    action: string;
    resource: string;
    resourceId?: string | null;
    companyId?: { toString(): string } | null;
    ip?: string | null;
    userAgent?: string | null;
    createdAt: Date;
  };

  return {
    id: d._id.toString(),
    actorId: d.actorId.toString(),
    actorRole: d.actorRole,
    action: d.action,
    resource: d.resource,
    resourceId: d.resourceId ?? null,
    companyId: d.companyId ? d.companyId.toString() : null,
    ip: d.ip ?? null,
    userAgent: d.userAgent ?? null,
    createdAt: d.createdAt,
  };
}

export class MongoAuditRepository implements IAuditRepository {
  private static instance: MongoAuditRepository | null = null;

  static getInstance(): MongoAuditRepository {
    if (!MongoAuditRepository.instance) {
      MongoAuditRepository.instance = new MongoAuditRepository();
    }
    return MongoAuditRepository.instance;
  }

  private async ensureConnection(): Promise<void> {
    await connectMongo();
  }

  async create(data: CreateAuditLogDTO): Promise<AuditLogRecord> {
    await this.ensureConnection();
    const doc = await AuditLogModel.create({
      actorId: data.actorId,
      actorRole: data.actorRole,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId ?? null,
      companyId: data.companyId ?? null,
      ip: data.ip ?? null,
      userAgent: data.userAgent ?? null,
    });
    return toAuditRecord(doc as unknown as Record<string, unknown>);
  }

  async list(
    filters: AuditLogListFilters = {},
  ): Promise<{ logs: AuditLogRecord[]; total: number }> {
    await this.ensureConnection();
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const query: Record<string, unknown> = {};

    if (filters.companyId) query.companyId = filters.companyId;
    if (filters.actorId) query.actorId = filters.actorId;
    if (filters.actorRole) query.actorRole = filters.actorRole;
    if (filters.action) query.action = filters.action;
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) {
        (query.createdAt as Record<string, Date>).$gte = filters.from;
      }
      if (filters.to) {
        (query.createdAt as Record<string, Date>).$lte = filters.to;
      }
    }

    const [docs, total] = await Promise.all([
      AuditLogModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLogModel.countDocuments(query),
    ]);

    return {
      logs: docs.map((doc) => toAuditRecord(doc as unknown as Record<string, unknown>)),
      total,
    };
  }
}
