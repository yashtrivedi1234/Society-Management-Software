import { asyncHandler } from '../../utils/asyncHandler.js';
import { Payment } from '../payments/payment.model.js';
import { Expense } from '../expenses/expense.model.js';
import { Member } from '../members/member.model.js';
import { safeYearMonth } from '../../utils/validators.js';

// Build a list of the last N month keys (YYYY-MM), oldest first, ending at `endMonth`.
function lastNMonths(endMonth, n) {
  const [y, m] = endMonth.split('-').map(Number);
  const months = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

// Collected vs due vs expenses across the last N months — drives the trend chart.
export const collectionTrend = asyncHandler(async (req, res) => {
  const endMonth = req.query.month || new Date().toISOString().slice(0, 7);
  const n = Math.min(Math.max(Number(req.query.months) || 6, 1), 24);
  const months = lastNMonths(endMonth, n);

  const payments = await Payment.find({ societyId: req.societyId, month: { $in: months } });
  const expenses = await Expense.find({
    societyId: req.societyId,
    date: { $regex: `^(${months.join('|')})` },
  });

  const series = months.map((month) => {
    const mp = payments.filter((p) => p.month === month);
    const collected = mp.reduce((s, p) => s + (p.paidAmount || 0), 0);
    const due = mp.reduce((s, p) => s + (p.totalDue || p.amount || 0), 0);
    const spent = expenses
      .filter((e) => (e.date || '').startsWith(month))
      .reduce((s, e) => s + (e.amount || 0), 0);
    return {
      month,
      collected,
      due,
      expenses: spent,
      pending: Math.max(due - collected, 0),
      collectionRate: due > 0 ? Math.round((collected / due) * 100) : 0,
    };
  });

  res.json({ data: { months, series } });
});

// Expenses grouped by category for a month — drives the breakdown (pie/bar) chart.
export const expenseBreakdown = asyncHandler(async (req, res) => {
  const month = safeYearMonth(req.query.month, new Date().toISOString().slice(0, 7));
  const expenses = await Expense.find({ societyId: req.societyId, date: { $regex: `^${month}` } });

  const byCategory = new Map();
  for (const e of expenses) {
    const key = e.category || 'Uncategorized';
    byCategory.set(key, (byCategory.get(key) || 0) + (e.amount || 0));
  }
  const total = [...byCategory.values()].reduce((s, v) => s + v, 0);
  const breakdown = [...byCategory.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  res.json({ data: { month, total, breakdown } });
});

// Defaulters with how long they've been overdue, bucketed into aging bands.
export const defaulterAging = asyncHandler(async (req, res) => {
  const asOf = req.query.month || new Date().toISOString().slice(0, 7);

  const unpaid = await Payment.find({
    societyId: req.societyId,
    month: { $lte: asOf },
    status: { $in: ['unpaid', 'overdue', 'partial'] },
  }).populate('memberId', 'name flatNumber phone');

  const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  const [ay, am] = asOf.split('-').map(Number);

  const rows = unpaid.map((p) => {
    const [py, pm] = p.month.split('-').map(Number);
    const monthsOld = (ay - py) * 12 + (am - pm);
    const days = monthsOld * 30;
    const bucket = days <= 30 ? '0-30' : days <= 60 ? '31-60' : days <= 90 ? '61-90' : '90+';
    const pending = Math.max((p.totalDue || 0) - (p.paidAmount || 0), 0);
    buckets[bucket] += pending;
    return {
      flatNumber: p.memberId?.flatNumber || '',
      name: p.memberId?.name || 'Resident',
      phone: p.memberId?.phone || '',
      month: p.month,
      pending,
      monthsOverdue: monthsOld,
      bucket,
    };
  });

  rows.sort((a, b) => b.pending - a.pending);
  const totalOutstanding = rows.reduce((s, r) => s + r.pending, 0);

  res.json({ data: { asOf, totalOutstanding, buckets, rows } });
});

// Lightweight count of members for report headers.
export const reportMeta = asyncHandler(async (req, res) => {
  const totalMembers = await Member.countDocuments({ societyId: req.societyId });
  res.json({ data: { totalMembers, societyId: req.societyId } });
});
