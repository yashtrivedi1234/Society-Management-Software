import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import {
  createFacilityBooking,
  listFacilities,
  listFacilityBookings,
  updateFacilityBookingStatus,
} from './facility.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', listFacilities);
// The full booking list (all flats) is management-only.
router.get('/bookings', requireRole('admin', 'accountant'), listFacilityBookings);
router.post('/bookings', createFacilityBooking);
router.patch('/bookings/:id/status', requireRole('admin', 'accountant'), updateFacilityBookingStatus);

export default router;
