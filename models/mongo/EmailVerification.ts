import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const emailVerificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

emailVerificationSchema.index({ userId: 1 });
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type MongoEmailVerificationDocument = InferSchemaType<
  typeof emailVerificationSchema
> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const EmailVerificationModel: Model<MongoEmailVerificationDocument> =
  mongoose.models.EmailVerification ??
  mongoose.model<MongoEmailVerificationDocument>(
    "EmailVerification",
    emailVerificationSchema,
  );
