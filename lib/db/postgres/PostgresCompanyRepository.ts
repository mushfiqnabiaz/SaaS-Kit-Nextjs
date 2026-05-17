import { and, count, desc, eq, ilike, type SQL } from "drizzle-orm";
import type {
  CompanyListFilters,
  CompanyRecord,
  CreateCompanyDTO,
  ICompanyRepository,
  UpdateCompanyDTO,
} from "@/lib/db/interfaces";
import { invalidateTenantCache, setTenantCache } from "@/lib/cache/tenantCache";
import { getPostgresDb } from "@/lib/db/postgres/postgresConnection";
import { companies } from "@/models/postgres/schema";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toCompanyRecord(row: typeof companies.$inferSelect): CompanyRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: row.plan,
    ownerId: row.ownerId,
    settings: (row.settings ?? {}) as Record<string, unknown>,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PostgresCompanyRepository implements ICompanyRepository {
  private static instance: PostgresCompanyRepository | null = null;

  static getInstance(): PostgresCompanyRepository {
    if (!PostgresCompanyRepository.instance) {
      PostgresCompanyRepository.instance = new PostgresCompanyRepository();
    }
    return PostgresCompanyRepository.instance;
  }

  async findById(id: string): Promise<CompanyRecord | null> {
    const db = getPostgresDb();
    const [row] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    const record = row ? toCompanyRecord(row) : null;
    if (record) {
      await setTenantCache(record);
    }
    return record;
  }

  async findBySlug(slug: string): Promise<CompanyRecord | null> {
    const db = getPostgresDb();
    const [row] = await db.select().from(companies).where(eq(companies.slug, slug)).limit(1);
    return row ? toCompanyRecord(row) : null;
  }

  async create(data: CreateCompanyDTO): Promise<CompanyRecord> {
    const db = getPostgresDb();
    const [row] = await db
      .insert(companies)
      .values({
        name: data.name,
        slug: data.slug || slugify(data.name),
        plan: (data.plan ?? "free") as "free" | "pro" | "enterprise",
        ownerId: data.ownerId,
        settings: data.settings ?? {},
      })
      .returning();
    const record = toCompanyRecord(row);
    await setTenantCache(record);
    return record;
  }

  async update(id: string, data: UpdateCompanyDTO): Promise<CompanyRecord | null> {
    const db = getPostgresDb();
    const [row] = await db
      .update(companies)
      .set({
        ...data,
        plan: data.plan as "free" | "pro" | "enterprise" | undefined,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id))
      .returning();
    const record = row ? toCompanyRecord(row) : null;
    if (record) {
      await setTenantCache(record);
    } else {
      await invalidateTenantCache(id);
    }
    return record;
  }

  async list(
    filters: CompanyListFilters = {},
  ): Promise<{ companies: CompanyRecord[]; total: number }> {
    const db = getPostgresDb();
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const conditions: SQL[] = [];

    if (filters.isActive !== undefined) {
      conditions.push(eq(companies.isActive, filters.isActive));
    }
    if (filters.search) {
      conditions.push(ilike(companies.name, `%${filters.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(companies)
        .where(whereClause)
        .orderBy(desc(companies.createdAt))
        .offset((page - 1) * limit)
        .limit(limit),
      db.select({ total: count() }).from(companies).where(whereClause),
    ]);

    return {
      companies: rows.map(toCompanyRecord),
      total: Number(total),
    };
  }

  async count(
    filters: import("@/lib/db/interfaces").CompanyCountFilters = {},
  ): Promise<number> {
    const db = getPostgresDb();
    const conditions: SQL[] = [];
    if (filters.isActive !== undefined) {
      conditions.push(eq(companies.isActive, filters.isActive));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [{ total }] = await db.select({ total: count() }).from(companies).where(whereClause);
    return Number(total);
  }

  async softDelete(id: string): Promise<CompanyRecord | null> {
    const record = await this.update(id, { isActive: false });
    await invalidateTenantCache(id);
    return record;
  }
}
