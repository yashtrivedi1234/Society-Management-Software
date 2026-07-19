import { asyncHandler } from '../../utils/asyncHandler.js';
import { Member } from '../members/member.model.js';
import { Payment } from '../payments/payment.model.js';
import { ApiError } from '../../utils/ApiError.js';

export const getInvoiceByFlatAndMonth = asyncHandler(async (req, res) => {
  const { flatNumber, month } = req.params;

  // A resident may only view their own flat's invoice; management roles can view any flat.
  if (req.user.role === 'member' && req.user.flatNumber !== flatNumber) {
    throw new ApiError(403, 'You can only view invoices for your own flat');
  }

  const member = await Member.findOne({ societyId: req.societyId, flatNumber });
  if (!member) throw new ApiError(404, 'Member not found');

  const payment = await Payment.findOne({ societyId: req.societyId, memberId: member._id, month });
  if (!payment) throw new ApiError(404, 'Payment not found for this month');

  const invoice = {
    flatNumber,
    month,
    member: {
      name: member.name,
      phone: member.phone,
      email: member.email,
    },
    payment: {
      amount: payment.amount,
      totalDue: payment.totalDue,
      status: payment.status,
      paidAmount: payment.paidAmount,
      paidDate: payment.paidDate,
      paymentMode: payment.paymentMode,
      transactionRef: payment.transactionRef,
    },
  };

  res.json({ data: invoice });
});
