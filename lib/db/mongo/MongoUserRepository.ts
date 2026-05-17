import type { Role } from "@/config/roles";
import type {
  CreateUserDTO,
  IUserRepository,
  UpdateUserDTO,
  UserListFilters,
  UserRecord,
} from "@/lib/db/interfaces";
import { mergeTenantScope, warnUnscopedQuery } from "@/lib/db/tenantScope";
import { connectMongo } from "@/lib/db/mongo/mongoConnection";
import { UserModel } from "@/models/mongo/User";

function toUserRecord(doc: {
  _id: { toString(): string };
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  companyId?: { toString(): string } | null;
  companyRoleId?: { toString(): string } | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    role: doc.role,
    companyId: doc.companyId ? doc.companyId.toString() : null,
    companyRoleId: doc.companyRoleId ? doc.companyRoleId.toString() : null,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoUserRepository implements IUserRepository {
  private static instance: MongoUserRepository | null = null;

  static getInstance(): MongoUserRepository {
    if (!MongoUserRepository.instance) {
      MongoUserRepository.instance = new MongoUserRepository();
    }
    return MongoUserRepository.instance;
  }

  private async ensureConnection(): Promise<void> {
    await connectMongo();
  }

  async findById(id: string): Promise<UserRecord | null> {
    await this.ensureConnection();
    const doc = await UserModel.findById(id).lean();
    return doc ? toUserRecord(doc as Parameters<typeof toUserRecord>[0]) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    await this.ensureConnection();
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean();
    return doc ? toUserRecord(doc as Parameters<typeof toUserRecord>[0]) : null;
  }

  async create(data: CreateUserDTO): Promise<UserRecord> {
    await this.ensureConnection();
    const doc = await UserModel.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      role: data.role,
      companyId: data.companyId ?? null,
      companyRoleId: data.companyRoleId ?? null,
    });
    return toUserRecord(doc);
  }

  async update(id: string, data: UpdateUserDTO): Promise<UserRecord | null> {
    await this.ensureConnection();
    const doc = await UserModel.findByIdAndUpdate(id, data, { new: true }).lean();
    return doc ? toUserRecord(doc as Parameters<typeof toUserRecord>[0]) : null;
  }

  async list(filters: UserListFilters = {}): Promise<{ users: UserRecord[]; total: number }> {
    await this.ensureConnection();
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    let query: Record<string, unknown> = {};

    if (filters.companyId) {
      query = mergeTenantScope(query, filters.companyId);
    } else {
      warnUnscopedQuery("MongoUserRepository.list", "unknown", false);
    }

    if (filters.role) query.role = filters.role;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
      ];
    }

    const [docs, total] = await Promise.all([
      UserModel.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(query),
    ]);

    return {
      users: docs.map((doc) => toUserRecord(doc as Parameters<typeof toUserRecord>[0])),
      total,
    };
  }

  async count(filters: import("@/lib/db/interfaces").UserCountFilters = {}): Promise<number> {
    await this.ensureConnection();
    const query: Record<string, unknown> = {};
    if (filters.companyId) query.companyId = filters.companyId;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.createdAfter) query.createdAt = { $gte: filters.createdAfter };
    return UserModel.countDocuments(query);
  }

  async softDelete(id: string): Promise<UserRecord | null> {
    return this.update(id, { isActive: false });
  }
}
