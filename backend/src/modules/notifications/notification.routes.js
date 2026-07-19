import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { getNotifications, markNotificationRead, markNotificationsRead, streamNotifications } from './notification.controller.js';

const router = Router();

router.get('/stream', streamNotifications);
router.use(requireAuth);
router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);
router.patch('/read-all', markNotificationsRead);

export default router;
