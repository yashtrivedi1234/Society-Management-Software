import { Router } from 'express';
import {
  applyLateFees,
  createPayment,
  createPaymentLink,
  getDueReminders,
  listPayments,
  markPaymentPaid,
} from './payment.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';

const router = Router();

router.use(requireAuth);
// Society-wide payment list is management-only; residents use /portal/payments (own flat).
router.get('/', requireRole('admin', 'accountant'), listPayments);
router.get('/reminders', requireRole('admin', 'accountant'), getDueReminders);
router.post('/', requireRole('admin', 'accountant'), createPayment);
router.post('/apply-late-fees', requireRole('admin', 'accountant'), applyLateFees);
router.patch('/:id/mark-paid', requireRole('admin', 'accountant'), markPaymentPaid);
router.post('/:id/payment-link', requireRole('admin', 'accountant'), createPaymentLink);

export default router;
