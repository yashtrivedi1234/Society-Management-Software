import { asyncHandler } from '../../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { Notice } from '../notices/notice.model.js';
import { Complaint } from '../complaints/complaint.model.js';
import { Visitor } from '../visitors/visitor.model.js';
import { EmergencyAlert } from '../operations/operations.model.js';
import { NotificationState } from './notification.model.js';
import { NotificationRead } from './notificationRead.model.js';
import { User } from '../users/user.model.js';

function mapNotice(item) {
  return {
    id: `notice:${item._id}`,
    type: 'notice',
    title: item.title,
    subtitle: item.category,
    createdAt: item.createdAt,
    href: '/notices',
  };
}

function mapComplaint(item) {
  return {
    id: `complaint:${item._id}`,
    type: 'complaint',
    title: item.subject,
    subtitle: `Flat ${item.flat} • ${item.status}`,
    createdAt: item.createdAt,
    href: '/complaints',
  };
}

function mapVisitor(item) {
  return {
    id: `visitor:${item._id}`,
    type: 'visitor',
    title: `${item.name} (${item.flat})`,
    subtitle: `Visitor ${item.status}`,
    createdAt: item.createdAt,
    href: '/visitors',
  };
}

function mapAlert(item) {
  return {
    id: `emergency:${item._id}`,
    type: 'emergency',
    title: `Emergency ${item.type}`,
    subtitle: `Flat ${item.flat} • ${item.status}`,
    createdAt: item.createdAt,
    href: '/operations',
  };
}

async function buildNotificationData({ societyId, userId }) {
  const [notices, complaints, visitors, alerts, state, readEntries] = await Promise.all([
    Notice.find({ societyId }).sort({ createdAt: -1 }).limit(10),
    Complaint.find({ societyId, status: { $in: ['open', 'in_progress'] } }).sort({ createdAt: -1 }).limit(10),
    Visitor.find({ societyId, status: { $in: ['expected', 'checked_in'] } }).sort({ createdAt: -1 }).limit(10),
    EmergencyAlert.find({ societyId, status: { $in: ['open', 'acknowledged'] } }).sort({ createdAt: -1 }).limit(10),
    NotificationState.findOne({ societyId, userId }),
    NotificationRead.find({ societyId, userId }).select('notificationId'),
  ]);

  const all = [
    ...notices.map(mapNotice),
    ...complaints.map(mapComplaint),
    ...visitors.map(mapVisitor),
    ...alerts.map(mapAlert),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const lastReadAt = state?.lastReadAt ? new Date(state.lastReadAt) : null;
  const readSet = new Set((readEntries || []).map((entry) => entry.notificationId));
  const withReadState = all.map((item) => {
    const isReadByTimestamp = lastReadAt ? new Date(item.createdAt) <= lastReadAt : false;
    const read = isReadByTimestamp || readSet.has(item.id);
    return { ...item, read };
  });
  const unreadCount = withReadState.filter((item) => !item.read).length;

  return {
    unreadCount,
    lastReadAt,
    items: withReadState.slice(0, 20),
  };
}

export const getNotifications = asyncHandler(async (req, res) => {
  const societyId = req.societyId;
  const userId = req.user.id;
  const data = await buildNotificationData({ societyId, userId });

  res.json({
    data,
  });
});

export const markNotificationsRead = asyncHandler(async (req, res) => {
  const societyId = req.societyId;
  const userId = req.user.id;
  const now = new Date();

  const state = await NotificationState.findOneAndUpdate(
    { societyId, userId },
    { lastReadAt: now },
    { upsert: true, new: true, runValidators: true }
  );

  req.auditEntity = 'notification';
  req.auditAction = 'mark_all_read';
  req.auditEntityId = state._id.toString();
  res.json({ data: { lastReadAt: state.lastReadAt } });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const societyId = req.societyId;
  const userId = req.user.id;
  const notificationId = req.params.id;

  if (!notificationId) {
    res.status(400).json({ message: 'notification id is required' });
    return;
  }

  await NotificationRead.findOneAndUpdate(
    { societyId, userId, notificationId },
    { readAt: new Date() },
    { upsert: true, new: true, runValidators: true }
  );

  req.auditEntity = 'notification';
  req.auditAction = 'mark_single_read';
  req.auditEntityId = notificationId;
  res.json({ data: { notificationId, read: true } });
});

export async function streamNotifications(req, res) {
  try {
    // Header-only: never accept the JWT via the query string (it would leak into access logs,
    // proxy logs and browser history). Clients must send Authorization: Bearer <token>.
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      res.status(401).json({ message: 'Missing token' });
      return;
    }

    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    const user = await User.findById(payload.sub).select('_id societyId');
    if (!user) {
      res.status(401).json({ message: 'Invalid token user' });
      return;
    }

    // SECURITY: tenant comes from the authenticated user, never the client-supplied query string.
    // (This route runs before requireAuth, so it must resolve the tenant itself.)
    const societyId = user.societyId || 'default';
    const userId = user._id.toString();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let previousPayload = '';
    const send = async () => {
      const data = await buildNotificationData({ societyId, userId });
      const nextPayload = JSON.stringify(data);
      if (nextPayload !== previousPayload) {
        previousPayload = nextPayload;
        res.write(`event: notifications\n`);
        res.write(`data: ${nextPayload}\n\n`);
      }
    };

    await send();
    // Poll for changes at a sane interval. 500ms ran ~12 DB queries/sec per connected client and
    // saturated the Atlas/Render connection pool; 15s is plenty for notifications.
    const interval = setInterval(() => {
      send().catch(() => {});
    }, 15000);
    const heartbeat = setInterval(() => {
      res.write(`event: ping\ndata: {}\n\n`);
    }, 25000);

    req.on('close', () => {
      clearInterval(interval);
      clearInterval(heartbeat);
      res.end();
    });
  } catch {
    res.status(401).json({ message: 'Unauthorized stream access' });
  }
}
