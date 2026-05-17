import { and, desc, eq, gt, isNull } from "drizzle-orm";
import type {
  CreateInviteDTO,
  IInviteRepository,
  InviteRecord,
  InviteRole,
} from "@/lib/db/interfaces";
import { getPostgresDb } from "@/lib/db/postgres/postgresConnection";
import { invites } from "@/models/postgres/schema";

function toInviteRecord(row: typeof invites.$inferSelect): InviteRecord {
  return {
    id: row.id,
    email: row.email,
    companyId: row.companyId,
    role: row.role as InviteRole,
    companyRoleId: row.companyRoleId,
    token: row.token,
    expiresAt: row.expiresAt,
    usedAt: row.usedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PostgresInviteRepository implements IInviteRepository {
  private static instance: PostgresInviteRepository | null = null;

  static getInstance(): PostgresInviteRepository {
    if (!PostgresInviteRepository.instance) {
      PostgresInviteRepository.instance = new PostgresInviteRepository();
    }
    return PostgresInviteRepository.instance;
  }

  async create(data: CreateInviteDTO): Promise<InviteRecord> {
    const db = getPostgresDb();
    const [row] = await db
      .insert(invites)
      .values({
        email: data.email.toLowerCase(),
        companyId: data.companyId,
        role: data.role,
        companyRoleId: data.companyRoleId ?? null,
        token: data.token,
        expiresAt: data.expiresAt,
      })
      .returning();
    return toInviteRecord(row);
  }

  async findById(id: string): Promise<InviteRecord | null> {
    const db = getPostgresDb();
    const [row] = await db.select().from(invites).where(eq(invites.id, id)).limit(1);
    return row ? toInviteRecord(row) : null;
  }

  async findByToken(token: string): Promise<InviteRecord | null> {
    const db = getPostgresDb();
    const [row] = await db.select().from(invites).where(eq(invites.token, token)).limit(1);
    return row ? toInviteRecord(row) : null;
  }

  async updateToken(id: string, token: string): Promise<InviteRecord | null> {
    const db = getPostgresDb();
    const [row] = await db
      .update(invites)
      .set({ token, updatedAt: new Date() })
      .where(eq(invites.id, id))
      .returning();
    return row ? toInviteRecord(row) : null;
  }

  async findPendingByEmail(email: string, companyId: string): Promise<InviteRecord | null> {
    const db = getPostgresDb();
    const [row] = await db
      .select()
      .from(invites)
      .where(
        and(
          eq(invites.email, email.toLowerCase()),
          eq(invites.companyId, companyId),
          isNull(invites.usedAt),
          gt(invites.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row ? toInviteRecord(row) : null;
  }

  async markUsed(id: string): Promise<InviteRecord | null> {
    const db = getPostgresDb();
    const [row] = await db
      .update(invites)
      .set({ usedAt: new Date(), updatedAt: new Date() })
      .where(eq(invites.id, id))
      .returning();
    return row ? toInviteRecord(row) : null;
  }

  async listPending(companyId: string): Promise<InviteRecord[]> {
    const db = getPostgresDb();
    const rows = await db
      .select()
      .from(invites)
      .where(
        and(
          eq(invites.companyId, companyId),
          isNull(invites.usedAt),
          gt(invites.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(invites.createdAt));
    return rows.map(toInviteRecord);
  }

  async delete(id: string): Promise<boolean> {
    const db = getPostgresDb();
    const result = await db.delete(invites).where(eq(invites.id, id)).returning({ id: invites.id });
    return result.length > 0;
  }
}
