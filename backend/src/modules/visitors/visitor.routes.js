import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import { createVisitor, deleteVisitor, listVisitors, updateVisitor, updateVisitorStatus } from './visitor.controller.js';

const router = Router();
router.use(requireAuth);

// The society-wide visitor log is management-only (reveals who visits which flat).
router.get('/', requireRole('admin', 'accountant'), listVisitors);
router.post('/', createVisitor);
router.patch('/:id/status', requireRole('admin', 'accountant'), updateVisitorStatus);
router.patch('/:id', requireRole('admin', 'accountant'), updateVisitor);
router.delete('/:id', requireRole('admin'), deleteVisitor);

export default router;
