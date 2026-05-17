import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const companyRoleSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: null },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);

companyRoleSchema.index({ companyId: 1, slug: 1 }, { unique: true });

export type MongoCompanyRoleDocument = InferSchemaType<typeof companyRoleSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CompanyRoleModel: Model<MongoCompanyRoleDocument> =
  mongoose.models.CompanyRole ??
  mongoose.model<MongoCompanyRoleDocument>("CompanyRole", companyRoleSchema);
