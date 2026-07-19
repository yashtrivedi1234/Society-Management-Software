import { randomUUID } from 'crypto';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Payment } from './payment.model.js';
import { env } from '../../config/env.js';

function todayDateOnly() {
  return new Date().toISOString().split('T')[0];
}

function getLateDays(targetMonth) {
  const dueDate = new Date(`${targetMonth}-${String(env.maintenanceDueDay).padStart(2, '0')}T23:59:59`);
  const now = new Date();
  const diffMs = now.getTime() - dueDate.getTime();
  return diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
}

export const listPayments = asyncHandler(async (req, res) => {
  const { month } = req.query;
  const filter = month ? { societyId: req.societyId, month } : { societyId: req.societyId };
  const data = await Payment.find(filter).populate('memberId', 'name flatNumber phone').sort({ month: -1, createdAt: -1 }).limit(5000);
  res.json({ data });
});

export const createPayment = asyncHandler(async (req, res) => {
  const { memberId, month, amount, totalDue } = req.body;
  if (!memberId || !month || !Number.isFinite(amount) || !Number.isFinite(totalDue) || amount < 0 || totalDue < 0) {
    throw new ApiError(400, 'memberId, month and non-negative numeric amount/totalDue are required');
  }

  const payment = await Payment.create({
    societyId: req.societyId,
    memberId,
    month,
    amount,
    totalDue,
    paidAmount: 0,
    status: 'unpaid',
  });
  req.auditEntity = 'payment';
  req.auditAction = 'create';
  req.auditEntityId = payment._id.toString();
  res.status(201).json({ data: payment });
});

export const markPaymentPaid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paidAmount, paidDate, paymentMode, transactionRef } = req.body;

  const payment = await Payment.findOne({ _id: id, societyId: req.societyId });
  if (!payment) throw new ApiError(404, 'Payment not found');

  const nextPaidAmount = paidAmount === undefined || paidAmount === null
    ? payment.totalDue
    : Number(paidAmount);
  // Must be a finite, non-negative number and can't exceed what's owed — otherwise a single
  // request can inflate society-wide collection totals/reconciliation.
  if (!Number.isFinite(nextPaidAmount) || nextPaidAmount < 0) {
    throw new ApiError(400, 'paidAmount must be a non-negative number');
  }
  if (nextPaidAmount > payment.totalDue) {
    throw new ApiError(400, 'paidAmount cannot exceed the amount due');
  }
  const nextStatus = nextPaidAmount >= payment.totalDue ? 'paid' : 'partial';
  // Don't let a settled payment be silently downgraded back to 'partial' by a smaller re-submit.
  if (payment.status === 'paid' && nextStatus !== 'paid') {
    throw new ApiError(409, 'Payment is already settled and cannot be reduced');
  }

  payment.paidAmount = nextPaidAmount;
  payment.paidDate = paidDate || new Date().toISOString().split('T')[0];
  payment.paymentMode = paymentMode || 'upi';
  payment.transactionRef = transactionRef || `TXN-${randomUUID().slice(0, 12).toUpperCase()}`;
  payment.status = nextStatus;
  payment.updatedBy = req.user.id;
  await payment.save();
  req.auditEntity = 'payment';
  req.auditAction = 'mark_paid';
  req.auditEntityId = payment._id.toString();

  res.json({ data: payment });
});

export const applyLateFees = asyncHandler(async (req, res) => {
  const month = req.body.month || new Date().toISOString().slice(0, 7);
  const lateDays = getLateDays(month);

  if (lateDays <= 0) {
    return res.json({
      data: { month, lateDays: 0, updatedCount: 0, message: 'Due date not crossed yet' },
    });
  }

  const lateFee = lateDays * env.lateFeePerDay;
  const pendingPayments = await Payment.find({
    societyId: req.societyId,
    month,
    status: { $in: ['unpaid', 'overdue', 'partial'] },
  });

  let updatedCount = 0;
  for (const payment of pendingPayments) {
    const baseAmount = payment.amount || 0;
    const newTotalDue = baseAmount + lateFee;
    const nextPaidAmount = payment.paidAmount || 0;
    payment.totalDue = newTotalDue;
    payment.status = nextPaidAmount >= newTotalDue ? 'paid' : 'overdue';
    await payment.save();
    updatedCount += 1;
  }

  req.auditEntity = 'payment';
  req.auditAction = 'apply_late_fees';
  res.json({
    data: {
      month,
      lateDays,
      lateFeePerDay: env.lateFeePerDay,
      lateFeeApplied: lateFee,
      updatedCount,
    },
  });
});

export const getDueReminders = asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const duePayments = await Payment.find({
    societyId: req.societyId,
    month,
    status: { $in: ['unpaid', 'overdue', 'partial'] },
  }).populate('memberId', 'name flatNumber phone');

  const reminders = duePayments.map((payment) => {
    const member = payment.memberId;
    const pendingAmount = Math.max((payment.totalDue || 0) - (payment.paidAmount || 0), 0);
    const text = `Dear ${member?.name || 'Resident'}, maintenance of Rs.${pendingAmount} for ${month} is pending for Flat ${member?.flatNumber || '-'}. Please pay soon.`;
    return {
      paymentId: payment._id,
      memberId: member?._id || null,
      name: member?.name || '',
      phone: member?.phone || '',
      flatNumber: member?.flatNumber || '',
      pendingAmount,
      message: text,
      whatsappUrl: member?.phone ? `https://wa.me/${member.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}` : null,
    };
  });

  res.json({ data: reminders });
});

export const createPaymentLink = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, societyId: req.societyId }).populate('memberId', 'flatNumber');
  if (!payment) throw new ApiError(404, 'Payment not found');

  const pendingAmount = Math.max((payment.totalDue || 0) - (payment.paidAmount || 0), 0);
  const reference = `PAY-${payment._id.toString().slice(-6)}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const paymentLink = `${env.paymentGatewayBaseUrl}?amount=${pendingAmount}&ref=${reference}&society=${encodeURIComponent(req.societyId)}`;

  req.auditEntity = 'payment';
  req.auditAction = 'create_payment_link';
  req.auditEntityId = payment._id.toString();
  res.json({
    data: {
      paymentId: payment._id,
      reference,
      amount: pendingAmount,
      provider: 'upi_link',
      paymentLink,
      expiresAt: `${todayDateOnly()}T23:59:59Z`,
    },
  });
});
