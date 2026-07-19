import mongoose from 'mongoose';

const notificationStateSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lastReadAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationStateSchema.index({ societyId: 1, userId: 1 }, { unique: true });

export const NotificationState = mongoose.model('NotificationState', notificationStateSchema);
