import type {
  CreateInviteDTO,
  IInviteRepository,
  InviteRecord,
  InviteRole,
} from "@/lib/db/interfaces";
import { connectMongo } from "@/lib/db/mongo/mongoConnection";
import { InviteModel } from "@/models/mongo/Invite";

function toInviteRecord(doc: {
  _id: { toString(): string };
  email: string;
  companyId: { toString(): string };
  role: InviteRole;
  companyRoleId?: { toString(): string } | null;
  token: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): InviteRecord {
  return {
    id: doc._id.toString(),
    email: doc.email,
    companyId: doc.companyId.toString(),
    role: doc.role,
    companyRoleId: doc.companyRoleId ? doc.companyRoleId.toString() : null,
    token: doc.token,
    expiresAt: doc.expiresAt,
    usedAt: doc.usedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoInviteRepository implements IInviteRepository {
  private static instance: MongoInviteRepository | null = null;

  static getInstance(): MongoInviteRepository {
    if (!MongoInviteRepository.instance) {
      MongoInviteRepository.instance = new MongoInviteRepository();
    }
    return MongoInviteRepository.instance;
  }

  private async ensureConnection(): Promise<void> {
    await connectMongo();
  }

  async create(data: CreateInviteDTO): Promise<InviteRecord> {
    await this.ensureConnection();
    const doc = await InviteModel.create(data);
    return toInviteRecord(doc);
  }

  async findById(id: string): Promise<InviteRecord | null> {
    await this.ensureConnection();
    const doc = await InviteModel.findById(id).lean();
    return doc ? toInviteRecord(doc as Parameters<typeof toInviteRecord>[0]) : null;
  }

  async findByToken(token: string): Promise<InviteRecord | null> {
    await this.ensureConnection();
    const doc = await InviteModel.findOne({ token }).lean();
    return doc ? toInviteRecord(doc as Parameters<typeof toInviteRecord>[0]) : null;
  }

  async updateToken(id: string, token: string): Promise<InviteRecord | null> {
    await this.ensureConnection();
    const doc = await InviteModel.findByIdAndUpdate(id, { token }, { new: true }).lean();
    return doc ? toInviteRecord(doc as Parameters<typeof toInviteRecord>[0]) : null;
  }

  async findPendingByEmail(email: string, companyId: string): Promise<InviteRecord | null> {
    await this.ensureConnection();
    const doc = await InviteModel.findOne({
      email: email.toLowerCase(),
      companyId,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    }).lean();
    return doc ? toInviteRecord(doc as Parameters<typeof toInviteRecord>[0]) : null;
  }

  async markUsed(id: string): Promise<InviteRecord | null> {
    await this.ensureConnection();
    const doc = await InviteModel.findByIdAndUpdate(
      id,
      { usedAt: new Date() },
      { new: true },
    ).lean();
    return doc ? toInviteRecord(doc as Parameters<typeof toInviteRecord>[0]) : null;
  }

  async listPending(companyId: string): Promise<InviteRecord[]> {
    await this.ensureConnection();
    const docs = await InviteModel.find({
      companyId,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map((doc) => toInviteRecord(doc as Parameters<typeof toInviteRecord>[0]));
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureConnection();
    const result = await InviteModel.findByIdAndDelete(id);
    return Boolean(result);
  }
}
