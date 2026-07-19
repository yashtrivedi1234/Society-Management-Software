import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import {
  createDocument,
  createEmergencyAlert,
  createParcel,
  createParkingSlot,
  createStaff,
  listDocuments,
  listEmergencyAlerts,
  listParcels,
  listParkingSlots,
  listStaff,
  markParcelDelivered,
  updateEmergencyStatus,
  updateStaffAttendance,
} from './operations.controller.js';

const router = Router();
router.use(requireAuth);

// Operations data (parking/parcels/documents/alerts) is management-only — these lists span all
// flats. Residents have no UI for them; scoped resident endpoints can be added later if needed.
router.get('/parking', requireRole('admin', 'accountant'), listParkingSlots);
router.post('/parking', requireRole('admin', 'accountant'), createParkingSlot);

router.get('/staff', requireRole('admin', 'accountant'), listStaff);
router.post('/staff', requireRole('admin', 'accountant'), createStaff);
router.patch('/staff/:id/attendance', requireRole('admin', 'accountant'), updateStaffAttendance);

router.get('/parcels', requireRole('admin', 'accountant'), listParcels);
router.post('/parcels', requireRole('admin', 'accountant'), createParcel);
router.patch('/parcels/:id/delivered', requireRole('admin', 'accountant'), markParcelDelivered);

router.get('/documents', requireRole('admin', 'accountant'), listDocuments);
router.post('/documents', requireRole('admin', 'accountant'), createDocument);

router.get('/emergency-alerts', requireRole('admin', 'accountant'), listEmergencyAlerts);
router.post('/emergency-alerts', createEmergencyAlert);
router.patch('/emergency-alerts/:id/status', requireRole('admin', 'accountant'), updateEmergencyStatus);

export default router;
