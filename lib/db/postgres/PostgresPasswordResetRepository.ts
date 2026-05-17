import { and, eq, gt } from "drizzle-orm";
import type { IPasswordResetRepository, PasswordResetRecord } from "@/lib/db/interfaces";
import { getPostgresDb } from "@/lib/db/postgres/postgresConnection";
import { passwordResetTokens } from "@/models/postgres/schema";

function toRecord(row: typeof passwordResetTokens.$inferSelect): PasswordResetRecord {
  return {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

export class PostgresPasswordResetRepository implements IPasswordResetRepository {
  private static instance: PostgresPasswordResetRepository | null = null;

  static getInstance(): PostgresPasswordResetRepository {
    if (!PostgresPasswordResetRepository.instance) {
      PostgresPasswordResetRepository.instance = new PostgresPasswordResetRepository();
    }
    return PostgresPasswordResetRepository.instance;
  }

  async create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<PasswordResetRecord> {
    const db = getPostgresDb();
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    const [row] = await db
      .insert(passwordResetTokens)
      .values({ userId, tokenHash, expiresAt })
      .returning();
    return toRecord(row);
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetRecord | null> {
    const db = getPostgresDb();
    const [row] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row ? toRecord(row) : null;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const db = getPostgresDb();
    const deleted = await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId))
      .returning({ id: passwordResetTokens.id });
    return deleted.length;
  }

  async deleteById(id: string): Promise<boolean> {
    const db = getPostgresDb();
    const deleted = await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, id))
      .returning({ id: passwordResetTokens.id });
    return deleted.length > 0;
  }
}
