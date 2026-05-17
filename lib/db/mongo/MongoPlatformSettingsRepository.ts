import type {
  IPlatformSettingsRepository,
  PlatformFeatureFlags,
  PlatformSettingsRecord,
} from "@/lib/db/interfaces";
import { connectMongo } from "@/lib/db/mongo/mongoConnection";
import { DEFAULT_PLATFORM_FEATURE_FLAGS } from "@/lib/platform/defaultFeatureFlags";
import { PlatformSettingsModel } from "@/models/mongo/PlatformSettings";

export class MongoPlatformSettingsRepository implements IPlatformSettingsRepository {
  private static instance: MongoPlatformSettingsRepository | null = null;

  static getInstance(): MongoPlatformSettingsRepository {
    if (!MongoPlatformSettingsRepository.instance) {
      MongoPlatformSettingsRepository.instance = new MongoPlatformSettingsRepository();
    }
    return MongoPlatformSettingsRepository.instance;
  }

  private async ensureConnection(): Promise<void> {
    await connectMongo();
  }

  async get(): Promise<PlatformSettingsRecord> {
    await this.ensureConnection();
    let doc = await PlatformSettingsModel.findOne({ key: "default" }).lean();
    if (!doc) {
      const created = await PlatformSettingsModel.create({
        key: "default",
        featureFlags: DEFAULT_PLATFORM_FEATURE_FLAGS,
      });
      doc = created.toObject();
    }
    return {
      id: doc._id.toString(),
      featureFlags: (doc.featureFlags ?? DEFAULT_PLATFORM_FEATURE_FLAGS) as PlatformFeatureFlags,
      updatedAt: doc.updatedAt,
    };
  }

  async updateFeatureFlags(flags: PlatformFeatureFlags): Promise<PlatformSettingsRecord> {
    await this.ensureConnection();
    const doc = await PlatformSettingsModel.findOneAndUpdate(
      { key: "default" },
      { featureFlags: flags },
      { upsert: true, new: true },
    ).lean();
    if (!doc) {
      return this.get();
    }
    return {
      id: doc._id.toString(),
      featureFlags: doc.featureFlags as PlatformFeatureFlags,
      updatedAt: doc.updatedAt,
    };
  }
}
