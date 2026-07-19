import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import { listAuditLogs } from './audit.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', requireRole('admin', 'accountant'), listAuditLogs);

export default router;
