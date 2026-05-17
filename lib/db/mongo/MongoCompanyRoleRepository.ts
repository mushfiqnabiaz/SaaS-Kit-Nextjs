import type { PermissionKey } from "@/config/roles";
import type {
  CompanyRoleRecord,
  CreateCompanyRoleDTO,
  ICompanyRoleRepository,
  UpdateCompanyRoleDTO,
} from "@/lib/db/interfaces";
import { connectMongo } from "@/lib/db/mongo/mongoConnection";
import { CompanyRoleModel } from "@/models/mongo/CompanyRole";
import { UserModel } from "@/models/mongo/User";

function toRecord(doc: {
  _id: { toString(): string };
  companyId: { toString(): string };
  name: string;
  slug: string;
  description?: string | null;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CompanyRoleRecord {
  return {
    id: doc._id.toString(),
    companyId: doc.companyId.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? null,
    permissions: doc.permissions as PermissionKey[],
    isSystem: doc.isSystem,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoCompanyRoleRepository implements ICompanyRoleRepository {
  private static instance: MongoCompanyRoleRepository | null = null;

  static getInstance(): MongoCompanyRoleRepository {
    if (!MongoCompanyRoleRepository.instance) {
      MongoCompanyRoleRepository.instance = new MongoCompanyRoleRepository();
    }
    return MongoCompanyRoleRepository.instance;
  }

  private async ensureConnection(): Promise<void> {
    await connectMongo();
  }

  async create(data: CreateCompanyRoleDTO): Promise<CompanyRoleRecord> {
    await this.ensureConnection();
    const doc = await CompanyRoleModel.create({
      companyId: data.companyId,
      name: data.name,
      slug: data.slug.toLowerCase(),
      description: data.description ?? null,
      permissions: data.permissions,
      isSystem: data.isSystem ?? false,
    });
    return toRecord(doc);
  }

  async findById(id: string): Promise<CompanyRoleRecord | null> {
    await this.ensureConnection();
    const doc = await CompanyRoleModel.findById(id).lean();
    return doc ? toRecord(doc as Parameters<typeof toRecord>[0]) : null;
  }

  async findBySlug(companyId: string, slug: string): Promise<CompanyRoleRecord | null> {
    await this.ensureConnection();
    const doc = await CompanyRoleModel.findOne({
      companyId,
      slug: slug.toLowerCase(),
    }).lean();
    return doc ? toRecord(doc as Parameters<typeof toRecord>[0]) : null;
  }

  async list(companyId: string): Promise<CompanyRoleRecord[]> {
    await this.ensureConnection();
    const docs = await CompanyRoleModel.find({ companyId }).sort({ name: 1 }).lean();
    return docs.map((d) => toRecord(d as Parameters<typeof toRecord>[0]));
  }

  async update(id: string, data: UpdateCompanyRoleDTO): Promise<CompanyRoleRecord | null> {
    await this.ensureConnection();
    const doc = await CompanyRoleModel.findByIdAndUpdate(
      id,
      {
        ...data,
        ...(data.slug ? { slug: data.slug.toLowerCase() } : {}),
      },
      { new: true },
    ).lean();
    return doc ? toRecord(doc as Parameters<typeof toRecord>[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureConnection();
    const result = await CompanyRoleModel.findOneAndDelete({ _id: id, isSystem: false });
    return Boolean(result);
  }

  async countUsersWithRole(roleId: string): Promise<number> {
    await this.ensureConnection();
    return UserModel.countDocuments({ companyRoleId: roleId });
  }
}
