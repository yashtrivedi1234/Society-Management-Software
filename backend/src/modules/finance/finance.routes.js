import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import {
  autoMatchReconciliation,
  createBudget,
  createReconciliationEntry,
  getBudgetVariance,
  getComplianceSummary,
  listBudgets,
  listReconciliationEntries,
} from './finance.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/budgets', requireRole('admin', 'accountant'), listBudgets);
router.post('/budgets', requireRole('admin', 'accountant'), createBudget);
router.get('/budgets/variance', requireRole('admin', 'accountant'), getBudgetVariance);

router.get('/reconciliation', requireRole('admin', 'accountant'), listReconciliationEntries);
router.post('/reconciliation', requireRole('admin', 'accountant'), createReconciliationEntry);
router.post('/reconciliation/auto-match', requireRole('admin', 'accountant'), autoMatchReconciliation);

router.get('/compliance-summary', requireRole('admin', 'accountant'), getComplianceSummary);

export default router;
