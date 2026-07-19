import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import {
  getSocietySettings,
  listBackups,
  registerDeviceToken,
  triggerBackup,
  updateSocietySettings,
} from './product.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/settings', getSocietySettings);
router.patch('/settings', requireRole('admin'), updateSocietySettings);

router.post('/device-tokens', registerDeviceToken);

router.get('/backups', requireRole('admin', 'accountant'), listBackups);
router.post('/backups/trigger', requireRole('admin'), triggerBackup);

export default router;
