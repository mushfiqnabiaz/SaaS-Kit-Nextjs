import type { IPasswordResetRepository, PasswordResetRecord } from "@/lib/db/interfaces";
import { connectMongo } from "@/lib/db/mongo/mongoConnection";
import { PasswordResetModel } from "@/models/mongo/PasswordReset";

function toRecord(doc: {
  _id: { toString(): string };
  userId: { toString(): string };
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}): PasswordResetRecord {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    tokenHash: doc.tokenHash,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
  };
}

export class MongoPasswordResetRepository implements IPasswordResetRepository {
  private static instance: MongoPasswordResetRepository | null = null;

  static getInstance(): MongoPasswordResetRepository {
    if (!MongoPasswordResetRepository.instance) {
      MongoPasswordResetRepository.instance = new MongoPasswordResetRepository();
    }
    return MongoPasswordResetRepository.instance;
  }

  private async ensureConnection(): Promise<void> {
    await connectMongo();
  }

  async create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<PasswordResetRecord> {
    await this.ensureConnection();
    await PasswordResetModel.deleteMany({ userId });
    const doc = await PasswordResetModel.create({ userId, tokenHash, expiresAt });
    return toRecord(doc);
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetRecord | null> {
    await this.ensureConnection();
    const doc = await PasswordResetModel.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    }).lean();
    return doc ? toRecord(doc as Parameters<typeof toRecord>[0]) : null;
  }

  async deleteByUserId(userId: string): Promise<number> {
    await this.ensureConnection();
    const result = await PasswordResetModel.deleteMany({ userId });
    return result.deletedCount;
  }

  async deleteById(id: string): Promise<boolean> {
    await this.ensureConnection();
    const result = await PasswordResetModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
