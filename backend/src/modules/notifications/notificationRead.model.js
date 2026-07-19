import mongoose from 'mongoose';

const notificationReadSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    notificationId: { type: String, required: true, trim: true, index: true },
    readAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

notificationReadSchema.index({ societyId: 1, userId: 1, notificationId: 1 }, { unique: true });

export const NotificationRead = mongoose.model('NotificationRead', notificationReadSchema);
