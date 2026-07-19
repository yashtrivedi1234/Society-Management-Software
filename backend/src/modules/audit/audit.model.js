import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    userRole: { type: String, default: null },
    method: { type: String, required: true },
    route: { type: String, required: true },
    statusCode: { type: Number, required: true },
    entity: { type: String, default: null },
    entityId: { type: String, default: null },
    action: { type: String, default: null },
    requestBody: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
