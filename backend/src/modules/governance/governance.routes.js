import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import {
  closePoll,
  createAnnouncement,
  createEvent,
  createPoll,
  listAnnouncements,
  listEvents,
  listPolls,
  rsvpEvent,
  voteInPoll,
} from './governance.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/polls', listPolls);
router.post('/polls', requireRole('admin', 'accountant'), createPoll);
router.post('/polls/:id/vote', voteInPoll);
router.patch('/polls/:id/close', requireRole('admin', 'accountant'), closePoll);

router.get('/events', listEvents);
router.post('/events', requireRole('admin', 'accountant'), createEvent);
router.post('/events/:id/rsvp', rsvpEvent);

router.get('/announcements', listAnnouncements);
router.post('/announcements', requireRole('admin', 'accountant'), createAnnouncement);

export default router;
