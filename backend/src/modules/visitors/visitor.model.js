import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    name: { type: String, required: true, trim: true },
    flat: { type: String, required: true, trim: true },
    purpose: { type: String, required: true, trim: true },
    status: { type: String, enum: ['checked_in', 'checked_out', 'expected', 'denied'], default: 'expected' },
    checkIn: { type: String, default: null },
    checkOut: { type: String, default: null },
    vehicle: { type: String, default: null },
    preApproved: { type: Boolean, default: false },
    contact: { type: String, default: null },
  },
  { timestamps: true }
);

export const Visitor = mongoose.model('Visitor', visitorSchema);
