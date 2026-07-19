import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import { createNotice, deleteNotice, listNotices, updateNotice } from './notice.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', listNotices);
router.post('/', requireRole('admin', 'accountant'), createNotice);
router.patch('/:id', requireRole('admin', 'accountant'), updateNotice);
router.delete('/:id', requireRole('admin'), deleteNotice);

export default router;
