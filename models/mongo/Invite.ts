import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ROLES } from "@/config/roles";

const inviteSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    role: {
      type: String,
      enum: [ROLES.USER, ROLES.COMPANY_ADMIN],
      default: ROLES.USER,
    },
    companyRoleId: { type: Schema.Types.ObjectId, ref: "CompanyRole", default: null },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

inviteSchema.index({ email: 1, companyId: 1 });

export type MongoInviteDocument = InferSchemaType<typeof inviteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const InviteModel: Model<MongoInviteDocument> =
  mongoose.models.Invite ?? mongoose.model<MongoInviteDocument>("Invite", inviteSchema);
