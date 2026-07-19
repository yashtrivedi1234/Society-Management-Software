// In-memory "fake backend" used when VITE_APP_MODE !== 'live'.
// It lets every page work offline (no server) with realistic, mutable data that persists for the
// browser session. Shapes mirror the real API responses (see backend seed.js) so pages need no
// special-casing. State resets on page reload — that's the expected demo behaviour.

import { getCurrentMonth } from '../utils/formatDate';
import { demoMembers, demoExpenses, demoPayments } from '../data/demoData';

const month = getCurrentMonth();
const today = `${month}-15`;

let seq = 1000;
const nextId = (prefix) => `demo-${prefix}-${seq++}`;

// Lazily seeded so the module import stays cheap and order-independent.
let db = null;
function ensureSeed() {
  if (db) return db;
  db = {
    members: demoMembers.map((m) => ({ ...m, hasLogin: false })),
    payments: demoPayments.map((p) => ({ ...p })),
    expenses: demoExpenses.map((e) => ({ ...e })),
    notices: [
      { id: 'notice-1', title: 'Water Tank Cleaning', description: 'Water supply paused 11 AM–2 PM Sunday for tank cleaning.', category: 'maintenance', date: `${month}-07`, postedBy: 'RWA Admin', pinned: true },
      { id: 'notice-2', title: 'Yoga Session', description: 'Community hall yoga class every Saturday at 7 AM.', category: 'event', date: `${month}-10`, postedBy: 'RWA Admin', pinned: false },
    ],
    complaints: [
      { id: 'cmp-1', flat: 'B-201', subject: 'Lift noise', description: 'Lift making unusual noise near 2nd floor.', category: 'facility', status: 'in_progress', priority: 'high', date: `${month}-06`, assignedTo: 'Maintenance Team', residentName: 'Amit Singh', slaDueDate: `${month}-07`, escalated: true },
      { id: 'cmp-2', flat: 'A-102', subject: 'Basement leakage', description: 'Leakage observed near parking slot 14.', category: 'plumbing', status: 'open', priority: 'medium', date: `${month}-12`, assignedTo: 'RWA Committee', residentName: 'Pooja Verma', slaDueDate: `${month}-15`, escalated: false },
    ],
    visitors: [
      { id: 'vis-1', name: 'Zomato Delivery', flat: 'A-101', purpose: 'Food Delivery', status: 'checked_in', checkIn: `${month}-12T19:05:00`, contact: '9988776655', preApproved: true },
      { id: 'vis-2', name: 'Vivek Gupta', flat: 'C-301', purpose: 'Personal Visit', status: 'expected', vehicle: 'DL10AB1234', contact: '9911223344', preApproved: false },
    ],
    facilities: [
      { id: 'fac-1', name: 'Community Hall', description: 'For parties and meetings', pricePerSlot: 2000, slotDuration: '4 hours', capacity: 100, type: 'hall' },
      { id: 'fac-2', name: 'Badminton Court', description: 'Indoor court with lights', pricePerSlot: 500, slotDuration: '1 hour', capacity: 4, type: 'sport' },
    ],
    facilityBookings: [
      { id: 'fb-1', facilityId: 'fac-1', date: `${month}-18`, timeSlot: '06:00 PM - 10:00 PM', purpose: 'Birthday function', flat: 'A-101', residentName: 'Rajesh Sharma', amount: 2000, status: 'confirmed' },
      { id: 'fb-2', facilityId: 'fac-2', date: `${month}-15`, timeSlot: '07:00 AM - 08:00 AM', purpose: 'Morning game', flat: 'C-302', residentName: 'Karan Mehta', amount: 500, status: 'pending' },
    ],
    parking: [
      { id: 'pk-1', slotNumber: 'P-01', vehicleType: '4w', assignedFlat: 'A-101', monthlyCharge: 800, status: 'occupied' },
      { id: 'pk-2', slotNumber: 'P-02', vehicleType: '4w', assignedFlat: 'A-102', monthlyCharge: 800, status: 'occupied' },
      { id: 'pk-3', slotNumber: 'P-03', vehicleType: '2w', monthlyCharge: 300, status: 'available' },
    ],
    staff: [
      { id: 'st-1', name: 'Ramesh Yadav', role: 'Security Guard', phone: '9000011111', shift: 'Night', salary: 18000, attendanceStatus: 'present' },
      { id: 'st-2', name: 'Sanjana Devi', role: 'Housekeeping', phone: '9000011112', shift: 'Morning', salary: 14000, attendanceStatus: 'leave' },
    ],
    parcels: [
      { id: 'pc-1', flat: 'C-301', recipientName: 'Neha Arora', courierName: 'BlueDart', trackingId: 'BD12345', status: 'received' },
      { id: 'pc-2', flat: 'A-101', recipientName: 'Rajesh Sharma', courierName: 'Amazon', trackingId: 'AMZ5566', status: 'delivered', deliveredAt: `${today}T10:00:00` },
    ],
    documents: [
      { id: 'doc-1', title: 'RWA Bylaws 2026', category: 'legal', url: 'https://example.com/docs/bylaws-2026.pdf', visibility: 'members' },
      { id: 'doc-2', title: 'Vendor Contracts', category: 'finance', url: 'https://example.com/docs/vendor-contracts.pdf', visibility: 'admin_only' },
    ],
    emergencyAlerts: [
      { id: 'em-1', flat: 'B-201', raisedBy: 'Amit Singh', type: 'medical', notes: 'Need immediate ambulance support', status: 'acknowledged' },
      { id: 'em-2', flat: 'A-102', raisedBy: 'Pooja Verma', type: 'security', notes: 'Suspicious movement near parking', status: 'open' },
    ],
    budgets: [
      { id: 'bg-1', financialYear: '2026-2027', category: 'security', budgetedAmount: 360000 },
      { id: 'bg-2', financialYear: '2026-2027', category: 'utilities', budgetedAmount: 220000 },
      { id: 'bg-3', financialYear: '2026-2027', category: 'maintenance', budgetedAmount: 150000 },
    ],
    reconciliation: [
      { id: 'rc-1', date: `${month}-05`, reference: 'NEFT-1005', amount: 3500, type: 'credit', status: 'matched' },
      { id: 'rc-2', date: `${month}-09`, reference: 'CASH-1002', amount: 2000, type: 'credit', status: 'unmatched' },
    ],
    polls: [
      { id: 'poll-1', title: 'Install EV Charging Point?', options: ['Yes', 'No'], createdBy: 'RWA Admin', isClosed: false, votes: [{ flat: 'A-101', optionIndex: 0 }, { flat: 'A-102', optionIndex: 0 }, { flat: 'C-302', optionIndex: 1 }] },
    ],
    events: [
      { id: 'ev-1', title: 'Monthly RWA Meeting', description: 'Discuss budget and pending issues', date: `${month}-20`, location: 'Community Hall', rsvps: [{ flat: 'A-101', residentName: 'Rajesh Sharma', status: 'yes' }, { flat: 'B-201', residentName: 'Amit Singh', status: 'maybe' }] },
    ],
    announcements: [
      { id: 'an-1', title: 'Maintenance Reminder', message: 'Please clear pending maintenance by 15th to avoid late fee.', channel: 'whatsapp', target: 'defaulters' },
    ],
    backups: [
      { id: 'bk-1', type: 'manual', status: 'completed', fileUrl: 'https://storage.clave.local/default/backup-1.zip', notes: 'Seed backup snapshot', createdAt: `${today}T09:00:00` },
    ],
  };
  db.settings = {
    branding: { productName: 'ClaveSociety', logoUrl: '', primaryColor: '#2563EB' },
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    maintenanceConfig: { dueDay: 10, lateFeePerDay: 50 },
    featureFlags: { pwaEnabled: true, twoFactorEnabled: false, pushNotificationsEnabled: true },
  };
  return db;
}

// ---- Generic CRUD over a collection ----
const deep = (v) => JSON.parse(JSON.stringify(v));
// Mirror id -> _id so pages that read either field (some use _id, some use id) both work.
const norm = (o) => (o && typeof o === 'object' && !Array.isArray(o) && o.id && !o._id ? { _id: o.id, ...o } : o);
const clone = (v) => (Array.isArray(v) ? v.map((o) => norm(deep(o))) : norm(deep(v)));

export function list(key) {
  return clone(ensureSeed()[key] || []);
}
export function create(key, obj, idPrefix = key.slice(0, 3)) {
  const created = { id: nextId(idPrefix), ...obj };
  ensureSeed()[key].unshift(created);
  return clone(created);
}
export function update(key, id, patch) {
  const coll = ensureSeed()[key];
  const idx = coll.findIndex((x) => (x.id || x._id) === id);
  if (idx === -1) return null;
  coll[idx] = { ...coll[idx], ...patch };
  return clone(coll[idx]);
}
export function remove(key, id) {
  const coll = ensureSeed()[key];
  const idx = coll.findIndex((x) => (x.id || x._id) === id);
  if (idx !== -1) coll.splice(idx, 1);
}

// ---- Domain-specific demo computations ----
export function budgetVariance() {
  const seeded = ensureSeed();
  const actualByCategory = demoExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
    return acc;
  }, {});
  return seeded.budgets.map((b) => ({
    category: b.category,
    budgetedAmount: b.budgetedAmount,
    actualAmount: actualByCategory[b.category] || 0,
    variance: b.budgetedAmount - (actualByCategory[b.category] || 0),
  }));
}

export function complianceSummary() {
  const totalDue = demoPayments.reduce((s, p) => s + (p.totalDue || 0), 0);
  const totalCollected = demoPayments.reduce((s, p) => s + (p.paidAmount || 0), 0);
  const overdueCount = demoPayments.filter((p) => p.status === 'overdue' || p.status === 'unpaid').length;
  return {
    month,
    overdueCount,
    totalDue,
    totalCollected,
    outstanding: Math.max(totalDue - totalCollected, 0),
    collectionRate: totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0,
  };
}

export function autoMatch() {
  const coll = ensureSeed().reconciliation;
  const unmatched = coll.filter((e) => e.status === 'unmatched');
  let matched = 0;
  for (const e of unmatched) {
    const hit = demoPayments.find((p) => p.transactionRef === e.reference && p.paidAmount === e.amount);
    if (hit) { e.status = 'matched'; e.matchedPaymentId = hit.id; matched += 1; }
  }
  return { processed: unmatched.length, matched };
}

export function votePoll(id, { flat, optionIndex }) {
  const poll = ensureSeed().polls.find((p) => p.id === id);
  if (!poll) return null;
  poll.votes = (poll.votes || []).filter((v) => v.flat !== flat);
  poll.votes.push({ flat, optionIndex });
  return clone(poll);
}
export function closePoll(id) {
  return update('polls', id, { isClosed: true });
}
export function rsvpEvent(id, { flat, residentName, status }) {
  const ev = ensureSeed().events.find((e) => e.id === id);
  if (!ev) return null;
  ev.rsvps = (ev.rsvps || []).filter((r) => r.flat !== flat);
  ev.rsvps.push({ flat, residentName, status });
  return clone(ev);
}

export function escalateComplaints() {
  const coll = ensureSeed().complaints;
  let escalatedCount = 0;
  for (const c of coll) {
    if ((c.status === 'open' || c.status === 'in_progress') && !c.escalated && c.slaDueDate <= today) {
      c.escalated = true; escalatedCount += 1;
    }
  }
  return { escalatedCount };
}

export function getSettings() { return clone(ensureSeed().settings); }
export function updateSettings(patch) {
  const s = ensureSeed();
  s.settings = { ...s.settings, ...patch };
  return clone(s.settings);
}
export function triggerBackup(payload = {}) {
  return create('backups', { type: payload.type || 'manual', status: 'completed', fileUrl: 'https://storage.clave.local/default/backup-demo.zip', notes: payload.notes || 'Demo backup', createdAt: `${today}T12:00:00` }, 'bk');
}
export function registerDeviceToken(payload) {
  return { id: nextId('dt'), platform: payload.platform || 'web', token: payload.token || 'demo-token' };
}
