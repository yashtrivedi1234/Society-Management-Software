import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    flatNumber: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    isOwner: { type: Boolean, default: true },
    familyMembers: { type: Number, default: 1 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

memberSchema.index({ societyId: 1, flatNumber: 1 }, { unique: true });

export const Member = mongoose.model('Member', memberSchema);
