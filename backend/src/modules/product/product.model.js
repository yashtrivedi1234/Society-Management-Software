import mongoose from 'mongoose';

const societySettingSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', unique: true, index: true },
    branding: {
      productName: { type: String, default: 'ClaveSociety' },
      logoUrl: { type: String, default: '' },
      primaryColor: { type: String, default: '#2563EB' },
    },
    locale: { type: String, default: 'en-IN' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    maintenanceConfig: {
      dueDay: { type: Number, default: 10 },
      lateFeePerDay: { type: Number, default: 50 },
    },
    featureFlags: {
      pwaEnabled: { type: Boolean, default: true },
      twoFactorEnabled: { type: Boolean, default: false },
      pushNotificationsEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const backupRecordSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    type: { type: String, enum: ['manual', 'scheduled'], default: 'manual' },
    status: { type: String, enum: ['queued', 'completed', 'failed'], default: 'queued' },
    fileUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const deviceTokenSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, enum: ['web', 'android', 'ios'], default: 'web' },
    token: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

deviceTokenSchema.index({ societyId: 1, userId: 1, token: 1 }, { unique: true });

export const SocietySetting = mongoose.model('SocietySetting', societySettingSchema);
export const BackupRecord = mongoose.model('BackupRecord', backupRecordSchema);
export const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);
