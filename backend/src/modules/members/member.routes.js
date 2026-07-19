import { Router } from 'express';
import { createMember, createMemberLogin, deleteMember, listMembers, updateMember } from './member.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';

const router = Router();

router.use(requireAuth);
// Full member directory is management-only; residents use /portal/summary for their own record.
router.get('/', requireRole('admin', 'accountant'), listMembers);
router.post('/', requireRole('admin', 'accountant'), createMember);
router.post('/:id/login', requireRole('admin', 'accountant'), createMemberLogin);
router.patch('/:id', requireRole('admin', 'accountant'), updateMember);
router.delete('/:id', requireRole('admin'), deleteMember);

export default router;
