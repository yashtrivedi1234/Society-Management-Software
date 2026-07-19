import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Expense } from './expense.model.js';
import { safeYearMonth } from '../../utils/validators.js';

export const listExpenses = asyncHandler(async (req, res) => {
  const month = safeYearMonth(req.query.month);
  // Only a validated YYYY-MM ever reaches $regex — no raw user string (prevents ReDoS / .* bypass).
  const filter = month ? { societyId: req.societyId, date: { $regex: `^${month}` } } : { societyId: req.societyId };
  const data = await Expense.find(filter).sort({ date: -1, createdAt: -1 }).limit(2000);
  res.json({ data });
});

export const createExpense = asyncHandler(async (req, res) => {
  const { date, category, description, amount, paidTo, paymentMode, receiptNumber } = req.body;
  if (!date || !category || !description || !Number.isFinite(amount) || amount < 0 || !paidTo) {
    throw new ApiError(400, 'date, category, description, a non-negative amount and paidTo are required');
  }

  // Whitelist fields (never spread req.body) so a client can't inject addedBy/societyId/etc.
  const expense = await Expense.create({
    societyId: req.societyId,
    date,
    category,
    description,
    amount,
    paidTo,
    paymentMode,
    receiptNumber,
    addedBy: req.user.id,
  });
  req.auditEntity = 'expense';
  req.auditAction = 'create';
  req.auditEntityId = expense._id.toString();
  res.status(201).json({ data: expense });
});

const EXPENSE_UPDATABLE = ['date', 'category', 'description', 'amount', 'paidTo', 'paymentMode', 'receiptNumber'];

export const updateExpense = asyncHandler(async (req, res) => {
  // Whitelist editable fields so a client can't forge `addedBy` (who recorded the expense).
  const updates = {};
  for (const key of EXPENSE_UPDATABLE) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, societyId: req.societyId },
    updates,
    { new: true, runValidators: true }
  );
  if (!expense) throw new ApiError(404, 'Expense not found');
  req.auditEntity = 'expense';
  req.auditAction = 'update';
  req.auditEntityId = expense._id.toString();
  res.json({ data: expense });
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, societyId: req.societyId });
  if (!expense) throw new ApiError(404, 'Expense not found');
  req.auditEntity = 'expense';
  req.auditAction = 'delete';
  req.auditEntityId = expense._id.toString();
  res.status(204).send();
});
