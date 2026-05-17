import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const passwordResetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

passwordResetSchema.index({ userId: 1 });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type MongoPasswordResetDocument = InferSchemaType<typeof passwordResetSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const PasswordResetModel: Model<MongoPasswordResetDocument> =
  mongoose.models.PasswordReset ??
  mongoose.model<MongoPasswordResetDocument>("PasswordReset", passwordResetSchema);
