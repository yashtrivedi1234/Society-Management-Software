import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import {
  createComplaint,
  deleteComplaint,
  escalateOverdueComplaints,
  listComplaints,
  updateComplaintStatus,
} from './complaint.controller.js';

const router = Router();
router.use(requireAuth);

// Society-wide complaint list is management-only; residents use /portal/complaints (own flat).
router.get('/', requireRole('admin', 'accountant'), listComplaints);
router.post('/', createComplaint);
router.post('/escalate-overdue', requireRole('admin', 'accountant'), escalateOverdueComplaints);
router.patch('/:id/status', requireRole('admin', 'accountant'), updateComplaintStatus);
router.delete('/:id', requireRole('admin'), deleteComplaint);

export default router;
