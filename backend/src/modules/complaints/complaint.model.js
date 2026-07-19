import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    flat: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    date: { type: String, required: true, index: true },
    assignedTo: { type: String, trim: true, default: 'RWA Committee' },
    residentName: { type: String, required: true, trim: true },
    resolvedDate: { type: String, default: null },
    slaDueDate: { type: String, default: null },
    escalated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Complaint = mongoose.model('Complaint', complaintSchema);
