import mongoose from 'mongoose';

const commonOptions = { timestamps: true };

const parkingSlotSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    slotNumber: { type: String, required: true, trim: true },
    vehicleType: { type: String, enum: ['2w', '4w'], default: '4w' },
    assignedFlat: { type: String, default: null, trim: true },
    monthlyCharge: { type: Number, default: 0 },
    status: { type: String, enum: ['available', 'occupied', 'reserved'], default: 'available' },
  },
  commonOptions
);
parkingSlotSchema.index({ societyId: 1, slotNumber: 1 }, { unique: true });

const staffMemberSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    shift: { type: String, default: 'General', trim: true },
    salary: { type: Number, default: 0 },
    attendanceStatus: { type: String, enum: ['present', 'absent', 'leave'], default: 'present' },
  },
  commonOptions
);

const parcelSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    flat: { type: String, required: true, trim: true },
    recipientName: { type: String, required: true, trim: true },
    courierName: { type: String, default: '', trim: true },
    trackingId: { type: String, default: '', trim: true },
    status: { type: String, enum: ['received', 'delivered'], default: 'received' },
    receivedAt: { type: String, default: () => new Date().toISOString() },
    deliveredAt: { type: String, default: null },
  },
  commonOptions
);

const documentSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    visibility: { type: String, enum: ['admin_only', 'members'], default: 'members' },
  },
  commonOptions
);

const emergencyAlertSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    flat: { type: String, required: true, trim: true },
    raisedBy: { type: String, required: true, trim: true },
    type: { type: String, enum: ['medical', 'fire', 'security', 'other'], default: 'other' },
    notes: { type: String, default: '', trim: true },
    status: { type: String, enum: ['open', 'acknowledged', 'closed'], default: 'open' },
  },
  commonOptions
);

export const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);
export const StaffMember = mongoose.model('StaffMember', staffMemberSchema);
export const Parcel = mongoose.model('Parcel', parcelSchema);
export const SocietyDocument = mongoose.model('SocietyDocument', documentSchema);
export const EmergencyAlert = mongoose.model('EmergencyAlert', emergencyAlertSchema);
