import { and, eq, gt } from "drizzle-orm";
import type {
  EmailVerificationRecord,
  IEmailVerificationRepository,
} from "@/lib/db/interfaces";
import { getPostgresDb } from "@/lib/db/postgres/postgresConnection";
import { emailVerificationTokens } from "@/models/postgres/schema";

function toRecord(row: typeof emailVerificationTokens.$inferSelect): EmailVerificationRecord {
  return {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

export class PostgresEmailVerificationRepository implements IEmailVerificationRepository {
  private static instance: PostgresEmailVerificationRepository | null = null;

  static getInstance(): PostgresEmailVerificationRepository {
    if (!PostgresEmailVerificationRepository.instance) {
      PostgresEmailVerificationRepository.instance =
        new PostgresEmailVerificationRepository();
    }
    return PostgresEmailVerificationRepository.instance;
  }

  async create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<EmailVerificationRecord> {
    const db = getPostgresDb();
    await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, userId));
    const [row] = await db
      .insert(emailVerificationTokens)
      .values({ userId, tokenHash, expiresAt })
      .returning();
    return toRecord(row);
  }

  async findByTokenHash(tokenHash: string): Promise<EmailVerificationRecord | null> {
    const db = getPostgresDb();
    const [row] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.tokenHash, tokenHash),
          gt(emailVerificationTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row ? toRecord(row) : null;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const db = getPostgresDb();
    const deleted = await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, userId))
      .returning({ id: emailVerificationTokens.id });
    return deleted.length;
  }

  async deleteById(id: string): Promise<boolean> {
    const db = getPostgresDb();
    const deleted = await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.id, id))
      .returning({ id: emailVerificationTokens.id });
    return deleted.length > 0;
  }
}
