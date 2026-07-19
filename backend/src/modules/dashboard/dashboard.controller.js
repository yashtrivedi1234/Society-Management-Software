import { asyncHandler } from '../../utils/asyncHandler.js';
import { Expense } from '../expenses/expense.model.js';
import { Payment } from '../payments/payment.model.js';
import { safeYearMonth } from '../../utils/validators.js';

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const month = safeYearMonth(req.query.month, new Date().toISOString().slice(0, 7));
  const payments = await Payment.find({ societyId: req.societyId, month });
  const expenses = await Expense.find({ societyId: req.societyId, date: { $regex: `^${month}` } });

  const totalDue = payments.reduce((s, p) => s + (p.totalDue || p.amount || 0), 0);
  // Sum paidAmount across all statuses: applyLateFees can flip a partially-paid record to
  // 'overdue', so filtering by status would drop real money that was already collected.
  const totalCollected = payments.reduce((s, p) => s + (p.paidAmount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalPending = totalDue - totalCollected;
  const paidCount = payments.filter((p) => p.status === 'paid').length;
  const partialCount = payments.filter((p) => p.status === 'partial').length;
  const overdueCount = payments.filter((p) => p.status === 'overdue').length;
  const unpaidCount = payments.filter((p) => p.status === 'unpaid').length;

  res.json({
    data: {
      month,
      totalDue,
      totalCollected,
      totalPending,
      totalExpenses,
      netBalance: totalCollected - totalExpenses,
      collectionRate: totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0,
      paidCount,
      partialCount,
      overdueCount,
      unpaidCount,
    },
  });
});
