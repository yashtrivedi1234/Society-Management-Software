import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    date: { type: String, required: true, index: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    paidTo: { type: String, required: true, trim: true },
    paymentMode: { type: String, enum: ['upi', 'cash', 'bank_transfer', 'cheque'], default: 'upi' },
    receiptNumber: { type: String, trim: true, default: '' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const Expense = mongoose.model('Expense', expenseSchema);
