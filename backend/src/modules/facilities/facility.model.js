import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    pricePerSlot: { type: Number, default: 0 },
    slotDuration: { type: String, default: 'Per session' },
    capacity: { type: Number, default: 0 },
    type: { type: String, default: 'general' },
  },
  { timestamps: true }
);

export const Facility = mongoose.model('Facility', facilitySchema);
