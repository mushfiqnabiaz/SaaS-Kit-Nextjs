import type {
  CreateSessionDTO,
  ISessionRepository,
  SessionRecord,
} from "@/lib/db/interfaces";
import { connectMongo } from "@/lib/db/mongo/mongoConnection";
import { SessionModel } from "@/models/mongo/Session";

function toSessionRecord(doc: {
  _id: { toString(): string };
  userId: { toString(): string };
  expiresAt: Date;
  deviceInfo?: string | null;
  createdAt: Date;
}): SessionRecord {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    expiresAt: doc.expiresAt,
    deviceInfo: doc.deviceInfo ?? null,
    createdAt: doc.createdAt,
  };
}

export class MongoSessionRepository implements ISessionRepository {
  private static instance: MongoSessionRepository | null = null;

  static getInstance(): MongoSessionRepository {
    if (!MongoSessionRepository.instance) {
      MongoSessionRepository.instance = new MongoSessionRepository();
    }
    return MongoSessionRepository.instance;
  }

  private async ensureConnection(): Promise<void> {
    await connectMongo();
  }

  async create(data: CreateSessionDTO): Promise<SessionRecord> {
    await this.ensureConnection();
    const doc = await SessionModel.create({
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
      deviceInfo: data.deviceInfo ?? null,
    });
    return toSessionRecord(doc);
  }

  async findById(id: string): Promise<SessionRecord | null> {
    await this.ensureConnection();
    const doc = await SessionModel.findById(id).lean();
    return doc ? toSessionRecord(doc as Parameters<typeof toSessionRecord>[0]) : null;
  }

  async findByToken(token: string): Promise<SessionRecord | null> {
    await this.ensureConnection();
    const doc = await SessionModel.findOne({ token }).lean();
    return doc ? toSessionRecord(doc as Parameters<typeof toSessionRecord>[0]) : null;
  }

  async listByUserId(userId: string): Promise<SessionRecord[]> {
    await this.ensureConnection();
    const docs = await SessionModel.find({
      userId,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map((doc) => toSessionRecord(doc as Parameters<typeof toSessionRecord>[0]));
  }

  async deleteById(id: string): Promise<boolean> {
    await this.ensureConnection();
    const result = await SessionModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    await this.ensureConnection();
    const result = await SessionModel.deleteMany({ userId });
    return result.deletedCount;
  }
}
