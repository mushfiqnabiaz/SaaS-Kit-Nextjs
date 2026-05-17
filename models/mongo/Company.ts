import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const companySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan: { type: String, default: "free" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    settings: { type: Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type MongoCompanyDocument = InferSchemaType<typeof companySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CompanyModel: Model<MongoCompanyDocument> =
  mongoose.models.Company ??
  mongoose.model<MongoCompanyDocument>("Company", companySchema);
