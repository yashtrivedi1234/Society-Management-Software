import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'member', 'accountant'], default: 'member' },
    // Tenant the account belongs to. Tenant scoping is derived from this (never a client header).
    societyId: { type: String, required: true, default: 'default', index: true },
    // For 'member' accounts: link to their flat/resident record so the portal can scope data.
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    flatNumber: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
