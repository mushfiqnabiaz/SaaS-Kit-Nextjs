import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { DEFAULT_PLATFORM_FEATURE_FLAGS } from "@/lib/platform/defaultFeatureFlags";

const platformSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    featureFlags: { type: Schema.Types.Mixed, default: DEFAULT_PLATFORM_FEATURE_FLAGS },
  },
  { timestamps: true },
);

export type MongoPlatformSettingsDocument = InferSchemaType<typeof platformSettingsSchema> & {
  _id: mongoose.Types.ObjectId;
  updatedAt: Date;
};

export const PlatformSettingsModel: Model<MongoPlatformSettingsDocument> =
  mongoose.models.PlatformSettings ??
  mongoose.model<MongoPlatformSettingsDocument>("PlatformSettings", platformSettingsSchema);
