import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ROLES } from "@/config/roles";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: ROLES.USER,
    },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null },
    companyRoleId: { type: Schema.Types.ObjectId, ref: "CompanyRole", default: null },
    emailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.index({ companyId: 1, role: 1 });
userSchema.index({ email: 1, companyId: 1 });

export type MongoUserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserModel: Model<MongoUserDocument> =
  mongoose.models.User ?? mongoose.model<MongoUserDocument>("User", userSchema);
