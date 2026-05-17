import type {
  CompanyListFilters,
  CompanyRecord,
  CreateCompanyDTO,
  ICompanyRepository,
  UpdateCompanyDTO,
} from "@/lib/db/interfaces";
import { invalidateTenantCache, setTenantCache } from "@/lib/cache/tenantCache";
import { connectMongo } from "@/lib/db/mongo/mongoConnection";
import { CompanyModel } from "@/models/mongo/Company";

function toCompanyRecord(doc: {
  _id: { toString(): string };
  name: string;
  slug: string;
  plan: string;
  ownerId: { toString(): string };
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CompanyRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    plan: doc.plan,
    ownerId: doc.ownerId.toString(),
    settings: doc.settings ?? {},
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export class MongoCompanyRepository implements ICompanyRepository {
  private static instance: MongoCompanyRepository | null = null;

  static getInstance(): MongoCompanyRepository {
    if (!MongoCompanyRepository.instance) {
      MongoCompanyRepository.instance = new MongoCompanyRepository();
    }
    return MongoCompanyRepository.instance;
  }

  private async ensureConnection(): Promise<void> {
    await connectMongo();
  }

  async findById(id: string): Promise<CompanyRecord | null> {
    await this.ensureConnection();
    const doc = await CompanyModel.findById(id).lean();
    const record = doc ? toCompanyRecord(doc as Parameters<typeof toCompanyRecord>[0]) : null;
    if (record) {
      await setTenantCache(record);
    }
    return record;
  }

  async findBySlug(slug: string): Promise<CompanyRecord | null> {
    await this.ensureConnection();
    const doc = await CompanyModel.findOne({ slug }).lean();
    return doc ? toCompanyRecord(doc as Parameters<typeof toCompanyRecord>[0]) : null;
  }

  async create(data: CreateCompanyDTO): Promise<CompanyRecord> {
    await this.ensureConnection();
    const doc = await CompanyModel.create({
      name: data.name,
      slug: data.slug || slugify(data.name),
      plan: data.plan ?? "free",
      ownerId: data.ownerId,
      settings: data.settings ?? {},
    });
    const record = toCompanyRecord(doc);
    await setTenantCache(record);
    return record;
  }

  async update(id: string, data: UpdateCompanyDTO): Promise<CompanyRecord | null> {
    await this.ensureConnection();
    const doc = await CompanyModel.findByIdAndUpdate(id, data, { new: true }).lean();
    const record = doc ? toCompanyRecord(doc as Parameters<typeof toCompanyRecord>[0]) : null;
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
    await this.ensureConnection();
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const query: Record<string, unknown> = {};

    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.search) {
      query.name = { $regex: filters.search, $options: "i" };
    }

    const [docs, total] = await Promise.all([
      CompanyModel.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CompanyModel.countDocuments(query),
    ]);

    return {
      companies: docs.map((doc) =>
        toCompanyRecord(doc as Parameters<typeof toCompanyRecord>[0]),
      ),
      total,
    };
  }

  async count(
    filters: import("@/lib/db/interfaces").CompanyCountFilters = {},
  ): Promise<number> {
    await this.ensureConnection();
    const query: Record<string, unknown> = {};
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    return CompanyModel.countDocuments(query);
  }

  async softDelete(id: string): Promise<CompanyRecord | null> {
    const record = await this.update(id, { isActive: false });
    await invalidateTenantCache(id);
    return record;
  }
}
