import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    month: { type: String, required: true, index: true }, // YYYY-MM
    amount: { type: Number, required: true },
    totalDue: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['paid', 'unpaid', 'overdue', 'partial'], default: 'unpaid' },
    paidDate: { type: String, default: null },
    paymentMode: { type: String, enum: ['upi', 'cash', 'bank_transfer', 'cheque', null], default: null },
    transactionRef: { type: String, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ societyId: 1, memberId: 1, month: 1 }, { unique: true });

export const Payment = mongoose.model('Payment', paymentSchema);
