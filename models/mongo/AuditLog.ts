import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ROLES } from "@/config/roles";

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorRole: { type: String, enum: Object.values(ROLES), required: true },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String, default: null },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ companyId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });

export type MongoAuditLogDocument = InferSchemaType<typeof auditLogSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const AuditLogModel: Model<MongoAuditLogDocument> =
  mongoose.models.AuditLog ??
  mongoose.model<MongoAuditLogDocument>("AuditLog", auditLogSchema);
