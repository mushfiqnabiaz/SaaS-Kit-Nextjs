import type {
  EmailVerificationRecord,
  IEmailVerificationRepository,
} from "@/lib/db/interfaces";
import { connectMongo } from "@/lib/db/mongo/mongoConnection";
import { EmailVerificationModel } from "@/models/mongo/EmailVerification";

function toRecord(doc: {
  _id: { toString(): string };
  userId: { toString(): string };
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}): EmailVerificationRecord {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    tokenHash: doc.tokenHash,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
  };
}

export class MongoEmailVerificationRepository implements IEmailVerificationRepository {
  private static instance: MongoEmailVerificationRepository | null = null;

  static getInstance(): MongoEmailVerificationRepository {
    if (!MongoEmailVerificationRepository.instance) {
      MongoEmailVerificationRepository.instance = new MongoEmailVerificationRepository();
    }
    return MongoEmailVerificationRepository.instance;
  }

  private async ensureConnection(): Promise<void> {
    await connectMongo();
  }

  async create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<EmailVerificationRecord> {
    await this.ensureConnection();
    await EmailVerificationModel.deleteMany({ userId });
    const doc = await EmailVerificationModel.create({ userId, tokenHash, expiresAt });
    return toRecord(doc);
  }

  async findByTokenHash(tokenHash: string): Promise<EmailVerificationRecord | null> {
    await this.ensureConnection();
    const doc = await EmailVerificationModel.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    }).lean();
    return doc ? toRecord(doc as Parameters<typeof toRecord>[0]) : null;
  }

  async deleteByUserId(userId: string): Promise<number> {
    await this.ensureConnection();
    const result = await EmailVerificationModel.deleteMany({ userId });
    return result.deletedCount ?? 0;
  }

  async deleteById(id: string): Promise<boolean> {
    await this.ensureConnection();
    const result = await EmailVerificationModel.findByIdAndDelete(id);
    return Boolean(result);
  }
}
