import { and, desc, eq, gt } from "drizzle-orm";
import type {
  CreateSessionDTO,
  ISessionRepository,
  SessionRecord,
} from "@/lib/db/interfaces";
import { getPostgresDb } from "@/lib/db/postgres/postgresConnection";
import { sessions } from "@/models/postgres/schema";

function toSessionRecord(row: typeof sessions.$inferSelect): SessionRecord {
  return {
    id: row.id,
    userId: row.userId,
    expiresAt: row.expiresAt,
    deviceInfo: row.deviceInfo ?? null,
    createdAt: row.createdAt,
  };
}

export class PostgresSessionRepository implements ISessionRepository {
  private static instance: PostgresSessionRepository | null = null;

  static getInstance(): PostgresSessionRepository {
    if (!PostgresSessionRepository.instance) {
      PostgresSessionRepository.instance = new PostgresSessionRepository();
    }
    return PostgresSessionRepository.instance;
  }

  async create(data: CreateSessionDTO): Promise<SessionRecord> {
    const db = getPostgresDb();
    const [row] = await db
      .insert(sessions)
      .values({
        userId: data.userId,
        token: data.token,
        expiresAt: data.expiresAt,
        deviceInfo: data.deviceInfo ?? null,
      })
      .returning();
    return toSessionRecord(row);
  }

  async findById(id: string): Promise<SessionRecord | null> {
    const db = getPostgresDb();
    const [row] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
    return row ? toSessionRecord(row) : null;
  }

  async findByToken(token: string): Promise<SessionRecord | null> {
    const db = getPostgresDb();
    const [row] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
    return row ? toSessionRecord(row) : null;
  }

  async listByUserId(userId: string): Promise<SessionRecord[]> {
    const db = getPostgresDb();
    const rows = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())))
      .orderBy(desc(sessions.createdAt));
    return rows.map(toSessionRecord);
  }

  async deleteById(id: string): Promise<boolean> {
    const db = getPostgresDb();
    const deleted = await db.delete(sessions).where(eq(sessions.id, id)).returning({ id: sessions.id });
    return deleted.length > 0;
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    const db = getPostgresDb();
    const deleted = await db.delete(sessions).where(eq(sessions.userId, userId)).returning({ id: sessions.id });
    return deleted.length;
  }
}
