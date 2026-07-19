import { Router } from 'express';
import {
  collectionTrend,
  expenseBreakdown,
  defaulterAging,
  reportMeta,
} from './report.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';

const router = Router();

// Financial reporting is for the management roles only.
router.use(requireAuth, requireRole('admin', 'accountant'));
router.get('/meta', reportMeta);
router.get('/collection-trend', collectionTrend);
router.get('/expense-breakdown', expenseBreakdown);
router.get('/defaulter-aging', defaulterAging);

export default router;
