import { Router } from 'express';
import {
  getMySummary,
  getMyPayments,
  getMyComplaints,
  createMyComplaint,
  getMyNotices,
  getMyDocuments,
  getMyVisitors,
  preApproveVisitor,
} from './portal.controller.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = Router();

// Resident self-service. All routes are scoped to the logged-in user's own flat (see controller).
router.use(requireAuth);
router.get('/summary', getMySummary);
router.get('/payments', getMyPayments);
router.get('/complaints', getMyComplaints);
router.post('/complaints', createMyComplaint);
router.get('/notices', getMyNotices);
router.get('/documents', getMyDocuments);
router.get('/visitors', getMyVisitors);
router.post('/visitors', preApproveVisitor);

export default router;
