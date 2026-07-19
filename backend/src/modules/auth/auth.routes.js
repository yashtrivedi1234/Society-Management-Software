import { Router } from 'express';
import { login, me, register } from './auth.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import { rateLimit } from '../../middlewares/rateLimit.js';

const router = Router();

// Throttle credential-guessing: cap login attempts per IP+email per window.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again in a few minutes.',
  keyGenerator: (req) => `${req.ip}:${(req.body?.email || '').toLowerCase()}`,
});

router.post('/login', loginLimiter, login);
router.get('/me', requireAuth, me);
// Account creation is admin-only; new users inherit the admin's tenant. No public self-registration.
router.post('/register', requireAuth, requireRole('admin'), register);

export default router;
