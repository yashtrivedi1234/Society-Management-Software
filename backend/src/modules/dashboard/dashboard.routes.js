import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import { getDashboardSummary } from './dashboard.controller.js';

const router = Router();
router.use(requireAuth);
// Society-wide financial summary is management-only; residents use /portal/summary.
router.get('/summary', requireRole('admin', 'accountant'), getDashboardSummary);

export default router;
