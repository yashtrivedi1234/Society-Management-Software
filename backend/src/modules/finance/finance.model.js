import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    financialYear: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    budgetedAmount: { type: Number, required: true },
  },
  { timestamps: true }
);
budgetSchema.index({ societyId: 1, financialYear: 1, category: 1 }, { unique: true });

const reconciliationSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, default: 'default', index: true },
    date: { type: String, required: true },
    reference: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    matchedPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    status: { type: String, enum: ['matched', 'unmatched'], default: 'unmatched' },
  },
  { timestamps: true }
);

export const BudgetPlan = mongoose.model('BudgetPlan', budgetSchema);
export const ReconciliationEntry = mongoose.model('ReconciliationEntry', reconciliationSchema);
