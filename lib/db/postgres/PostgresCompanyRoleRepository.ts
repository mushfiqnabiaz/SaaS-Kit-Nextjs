import { and, count, eq } from "drizzle-orm";
import type { PermissionKey } from "@/config/roles";
import type {
  CompanyRoleRecord,
  CreateCompanyRoleDTO,
  ICompanyRoleRepository,
  UpdateCompanyRoleDTO,
} from "@/lib/db/interfaces";
import { getPostgresDb } from "@/lib/db/postgres/postgresConnection";
import { companyRoles, users } from "@/models/postgres/schema";

function toRecord(row: typeof companyRoles.$inferSelect): CompanyRoleRecord {
  return {
    id: row.id,
    companyId: row.companyId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    permissions: row.permissions as PermissionKey[],
    isSystem: row.isSystem,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PostgresCompanyRoleRepository implements ICompanyRoleRepository {
  private static instance: PostgresCompanyRoleRepository | null = null;

  static getInstance(): PostgresCompanyRoleRepository {
    if (!PostgresCompanyRoleRepository.instance) {
      PostgresCompanyRoleRepository.instance = new PostgresCompanyRoleRepository();
    }
    return PostgresCompanyRoleRepository.instance;
  }

  async create(data: CreateCompanyRoleDTO): Promise<CompanyRoleRecord> {
    const db = getPostgresDb();
    const [row] = await db
      .insert(companyRoles)
      .values({
        companyId: data.companyId,
        name: data.name,
        slug: data.slug.toLowerCase(),
        description: data.description ?? null,
        permissions: data.permissions,
        isSystem: data.isSystem ?? false,
      })
      .returning();
    return toRecord(row);
  }

  async findById(id: string): Promise<CompanyRoleRecord | null> {
    const db = getPostgresDb();
    const [row] = await db.select().from(companyRoles).where(eq(companyRoles.id, id)).limit(1);
    return row ? toRecord(row) : null;
  }

  async findBySlug(companyId: string, slug: string): Promise<CompanyRoleRecord | null> {
    const db = getPostgresDb();
    const [row] = await db
      .select()
      .from(companyRoles)
      .where(and(eq(companyRoles.companyId, companyId), eq(companyRoles.slug, slug.toLowerCase())))
      .limit(1);
    return row ? toRecord(row) : null;
  }

  async list(companyId: string): Promise<CompanyRoleRecord[]> {
    const db = getPostgresDb();
    const rows = await db
      .select()
      .from(companyRoles)
      .where(eq(companyRoles.companyId, companyId))
      .orderBy(companyRoles.name);
    return rows.map(toRecord);
  }

  async update(id: string, data: UpdateCompanyRoleDTO): Promise<CompanyRoleRecord | null> {
    const db = getPostgresDb();
    const [row] = await db
      .update(companyRoles)
      .set({
        ...data,
        ...(data.slug ? { slug: data.slug.toLowerCase() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(companyRoles.id, id))
      .returning();
    return row ? toRecord(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const db = getPostgresDb();
    const [row] = await db
      .delete(companyRoles)
      .where(and(eq(companyRoles.id, id), eq(companyRoles.isSystem, false)))
      .returning({ id: companyRoles.id });
    return Boolean(row);
  }

  async countUsersWithRole(roleId: string): Promise<number> {
    const db = getPostgresDb();
    const [result] = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.companyRoleId, roleId));
    return Number(result?.value ?? 0);
  }
}
