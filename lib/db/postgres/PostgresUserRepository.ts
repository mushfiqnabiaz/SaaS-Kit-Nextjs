import { and, count, desc, eq, gte, ilike, or, type SQL } from "drizzle-orm";
import type { Role } from "@/config/roles";
import type {
  CreateUserDTO,
  IUserRepository,
  UpdateUserDTO,
  UserListFilters,
  UserRecord,
} from "@/lib/db/interfaces";
import { warnUnscopedQuery } from "@/lib/db/tenantScope";
import { getPostgresDb } from "@/lib/db/postgres/postgresConnection";
import { users } from "@/models/postgres/schema";

function toUserRecord(row: typeof users.$inferSelect): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role as Role,
    companyId: row.companyId,
    companyRoleId: row.companyRoleId,
    emailVerified: row.emailVerified,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PostgresUserRepository implements IUserRepository {
  private static instance: PostgresUserRepository | null = null;

  static getInstance(): PostgresUserRepository {
    if (!PostgresUserRepository.instance) {
      PostgresUserRepository.instance = new PostgresUserRepository();
    }
    return PostgresUserRepository.instance;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const db = getPostgresDb();
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return row ? toUserRecord(row) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const db = getPostgresDb();
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return row ? toUserRecord(row) : null;
  }

  async create(data: CreateUserDTO): Promise<UserRecord> {
    const db = getPostgresDb();
    const [row] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role,
        companyId: data.companyId ?? null,
        companyRoleId: data.companyRoleId ?? null,
        emailVerified: data.emailVerified ?? false,
      })
      .returning();
    return toUserRecord(row);
  }

  async update(id: string, data: UpdateUserDTO): Promise<UserRecord | null> {
    const db = getPostgresDb();
    const [row] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return row ? toUserRecord(row) : null;
  }

  async list(filters: UserListFilters = {}): Promise<{ users: UserRecord[]; total: number }> {
    const db = getPostgresDb();
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const conditions: SQL[] = [];

    if (filters.companyId) {
      conditions.push(eq(users.companyId, filters.companyId));
    } else if (!filters.allowUnscoped) {
      throw new Error("companyId is required for tenant-scoped user list");
    } else {
      warnUnscopedQuery("PostgresUserRepository.list", "unknown", true);
    }

    if (filters.role) conditions.push(eq(users.role, filters.role));
    if (filters.isActive !== undefined) conditions.push(eq(users.isActive, filters.isActive));
    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(or(ilike(users.name, term), ilike(users.email, term))!);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .offset((page - 1) * limit)
        .limit(limit),
      db.select({ total: count() }).from(users).where(whereClause),
    ]);

    return {
      users: rows.map(toUserRecord),
      total: Number(total),
    };
  }

  async count(filters: import("@/lib/db/interfaces").UserCountFilters = {}): Promise<number> {
    const db = getPostgresDb();
    const conditions: SQL[] = [];
    if (filters.companyId) conditions.push(eq(users.companyId, filters.companyId));
    if (filters.isActive !== undefined) conditions.push(eq(users.isActive, filters.isActive));
    if (filters.createdAfter) conditions.push(gte(users.createdAt, filters.createdAfter));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [{ total }] = await db.select({ total: count() }).from(users).where(whereClause);
    return Number(total);
  }

  async softDelete(id: string): Promise<UserRecord | null> {
    return this.update(id, { isActive: false });
  }
}
