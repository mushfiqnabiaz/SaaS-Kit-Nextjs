import { eq } from "drizzle-orm";
import type {
  IPlatformSettingsRepository,
  PlatformFeatureFlags,
  PlatformSettingsRecord,
} from "@/lib/db/interfaces";
import { getPostgresDb } from "@/lib/db/postgres/postgresConnection";
import { DEFAULT_PLATFORM_FEATURE_FLAGS } from "@/lib/platform/defaultFeatureFlags";
import { platformSettings } from "@/models/postgres/schema";

export class PostgresPlatformSettingsRepository implements IPlatformSettingsRepository {
  private static instance: PostgresPlatformSettingsRepository | null = null;

  static getInstance(): PostgresPlatformSettingsRepository {
    if (!PostgresPlatformSettingsRepository.instance) {
      PostgresPlatformSettingsRepository.instance = new PostgresPlatformSettingsRepository();
    }
    return PostgresPlatformSettingsRepository.instance;
  }

  async get(): Promise<PlatformSettingsRecord> {
    const db = getPostgresDb();
    const [row] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, "default"))
      .limit(1);

    if (!row) {
      const [created] = await db
        .insert(platformSettings)
        .values({ key: "default", featureFlags: DEFAULT_PLATFORM_FEATURE_FLAGS })
        .returning();
      return {
        id: created.id,
        featureFlags: created.featureFlags as PlatformFeatureFlags,
        updatedAt: created.updatedAt,
      };
    }

    return {
      id: row.id,
      featureFlags: row.featureFlags as PlatformFeatureFlags,
      updatedAt: row.updatedAt,
    };
  }

  async updateFeatureFlags(flags: PlatformFeatureFlags): Promise<PlatformSettingsRecord> {
    const db = getPostgresDb();
    const existing = await this.get();
    const [row] = await db
      .update(platformSettings)
      .set({ featureFlags: flags, updatedAt: new Date() })
      .where(eq(platformSettings.id, existing.id))
      .returning();
    return {
      id: row.id,
      featureFlags: row.featureFlags as PlatformFeatureFlags,
      updatedAt: row.updatedAt,
    };
  }
}
