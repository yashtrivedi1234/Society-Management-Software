import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { getInvoiceByFlatAndMonth } from './invoice.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/:flatNumber/:month', getInvoiceByFlatAndMonth);

export default router;
