import mongoose from 'mongoose';

const facilityBookingSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true, index: true },
    date: { type: String, required: true, index: true },
    timeSlot: { type: String, required: true, trim: true },
    purpose: { type: String, required: true, trim: true },
    flat: { type: String, required: true, trim: true },
    residentName: { type: String, required: true, trim: true },
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
);

export const FacilityBooking = mongoose.model('FacilityBooking', facilityBookingSchema);
