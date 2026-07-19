/**
 * Seed realistic society sample data so dashboards aren't empty.
 */
import { Member } from '../modules/members/member.model.js';
import { Payment } from '../modules/payments/payment.model.js';
import { Expense } from '../modules/expenses/expense.model.js';
import { Notice } from '../modules/notices/notice.model.js';
import { Complaint } from '../modules/complaints/complaint.model.js';
import { Visitor } from '../modules/visitors/visitor.model.js';

const societyId = 'default';
const MAINTENANCE = 3500;

function ym(offset = 0) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function day(month, dd) {
  return `${month}-${String(dd).padStart(2, '0')}`;
}

const MEMBER_SEED = [
  { flatNumber: 'A-101', name: 'Rajesh Sharma', phone: '9876543210', email: 'member@greenvalley.demo', familyMembers: 4, isOwner: true },
  { flatNumber: 'A-102', name: 'Pooja Verma', phone: '9876543211', email: 'pooja@gmail.com', familyMembers: 3, isOwner: true },
  { flatNumber: 'B-201', name: 'Amit Singh', phone: '9876543212', email: 'amit@gmail.com', familyMembers: 2, isOwner: true },
  { flatNumber: 'C-301', name: 'Neha Arora', phone: '9876543213', email: 'neha@gmail.com', familyMembers: 5, isOwner: true },
  { flatNumber: 'C-302', name: 'Karan Mehta', phone: '9876543214', email: 'karan@gmail.com', familyMembers: 1, isOwner: false },
  { flatNumber: 'A-103', name: 'Suresh Patel', phone: '9876543215', email: 'suresh@gmail.com', familyMembers: 3, isOwner: true },
  { flatNumber: 'B-202', name: 'Ananya Iyer', phone: '9876543216', email: 'ananya@gmail.com', familyMembers: 2, isOwner: true },
  { flatNumber: 'C-303', name: 'Vikram Joshi', phone: '9876543217', email: 'vikram@gmail.com', familyMembers: 4, isOwner: true },
];

async function upsertMembers() {
  const byFlat = {};
  for (const row of MEMBER_SEED) {
    const doc = await Member.findOneAndUpdate(
      { societyId, flatNumber: row.flatNumber },
      { societyId, ...row, status: 'active' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    byFlat[row.flatNumber] = doc;
  }
  return byFlat;
}

async function upsertPayment(member, month, patch) {
  return Payment.findOneAndUpdate(
    { societyId, memberId: member._id, month },
    {
      societyId,
      memberId: member._id,
      month,
      amount: MAINTENANCE,
      totalDue: patch.totalDue ?? MAINTENANCE,
      paidAmount: patch.paidAmount ?? 0,
      status: patch.status,
      paidDate: patch.paidDate ?? null,
      paymentMode: patch.paymentMode ?? null,
      transactionRef: patch.transactionRef ?? null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function seedPayments(byFlat) {
  const current = ym(0);
  const prev = ym(1);
  const prev2 = ym(2);

  // Current month — mix of paid / partial / overdue / unpaid
  await upsertPayment(byFlat['A-101'], current, {
    status: 'paid',
    paidAmount: MAINTENANCE,
    paidDate: day(current, 3),
    paymentMode: 'upi',
    transactionRef: 'UPI-1001',
  });
  await upsertPayment(byFlat['A-102'], current, {
    status: 'partial',
    totalDue: 3700,
    paidAmount: 2000,
    paidDate: day(current, 9),
    paymentMode: 'cash',
    transactionRef: 'CASH-1002',
  });
  await upsertPayment(byFlat['B-201'], current, {
    status: 'overdue',
    totalDue: 3900,
    paidAmount: 0,
  });
  await upsertPayment(byFlat['C-301'], current, { status: 'unpaid', paidAmount: 0 });
  await upsertPayment(byFlat['C-302'], current, {
    status: 'paid',
    paidAmount: MAINTENANCE,
    paidDate: day(current, 5),
    paymentMode: 'bank_transfer',
    transactionRef: 'NEFT-1005',
  });
  await upsertPayment(byFlat['A-103'], current, { status: 'unpaid', paidAmount: 0 });
  await upsertPayment(byFlat['B-202'], current, {
    status: 'paid',
    paidAmount: MAINTENANCE,
    paidDate: day(current, 7),
    paymentMode: 'upi',
    transactionRef: 'UPI-1007',
  });
  await upsertPayment(byFlat['C-303'], current, {
    status: 'partial',
    totalDue: MAINTENANCE,
    paidAmount: 1500,
    paidDate: day(current, 12),
    paymentMode: 'upi',
    transactionRef: 'UPI-1012',
  });

  // Previous months — mostly paid so charts have history
  for (const month of [prev, prev2]) {
    for (const flat of Object.keys(byFlat)) {
      const late = flat === 'B-201' && month === prev;
      await upsertPayment(byFlat[flat], month, {
        status: late ? 'overdue' : 'paid',
        totalDue: late ? 3700 : MAINTENANCE,
        paidAmount: late ? 0 : MAINTENANCE,
        paidDate: late ? null : day(month, 4 + (flat.charCodeAt(0) % 5)),
        paymentMode: late ? null : 'upi',
        transactionRef: late ? null : `HIST-${month}-${flat}`,
      });
    }
  }
}

async function seedExpenses() {
  const current = ym(0);
  const prev = ym(1);
  const rows = [
    { date: day(current, 2), category: 'security', description: 'Security staff monthly payout', amount: 28000, paidTo: 'Shield Guards Pvt Ltd', paymentMode: 'bank_transfer', receiptNumber: 'EXP-001' },
    { date: day(current, 8), category: 'utilities', description: 'Common area electricity bill', amount: 15400, paidTo: 'State Electricity Board', paymentMode: 'upi', receiptNumber: 'EXP-002' },
    { date: day(current, 11), category: 'maintenance', description: 'Lift preventive maintenance', amount: 7800, paidTo: 'Otis Service Team', paymentMode: 'bank_transfer', receiptNumber: 'EXP-003' },
    { date: day(current, 14), category: 'housekeeping', description: 'Housekeeping consumables', amount: 4200, paidTo: 'CleanPro Supplies', paymentMode: 'cash', receiptNumber: 'EXP-004' },
    { date: day(prev, 5), category: 'security', description: 'Security staff monthly payout', amount: 28000, paidTo: 'Shield Guards Pvt Ltd', paymentMode: 'bank_transfer', receiptNumber: 'EXP-P01' },
    { date: day(prev, 18), category: 'utilities', description: 'Water tanker + pump repair', amount: 9600, paidTo: 'AquaFix Services', paymentMode: 'upi', receiptNumber: 'EXP-P02' },
  ];

  for (const row of rows) {
    await Expense.findOneAndUpdate(
      { societyId, receiptNumber: row.receiptNumber },
      { societyId, ...row },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

async function seedNotices() {
  const current = ym(0);
  const rows = [
    { title: 'Water Tank Cleaning', description: 'Water supply paused 11 AM–2 PM Sunday for tank cleaning.', category: 'maintenance', date: day(current, 7), postedBy: 'RWA Admin', pinned: true },
    { title: 'Yoga Session', description: 'Community hall yoga class every Saturday at 7 AM.', category: 'event', date: day(current, 10), postedBy: 'RWA Admin', pinned: false },
    { title: 'Maintenance Due Reminder', description: 'Please clear pending maintenance by the 15th to avoid late fee.', category: 'general', date: day(current, 1), postedBy: 'RWA Admin', pinned: false },
  ];
  for (const row of rows) {
    await Notice.findOneAndUpdate(
      { societyId, title: row.title, date: row.date },
      { societyId, ...row },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

async function seedComplaints() {
  const current = ym(0);
  const rows = [
    { flat: 'B-201', subject: 'Lift noise', description: 'Lift making unusual noise near 2nd floor.', category: 'facility', status: 'in_progress', priority: 'high', date: day(current, 6), assignedTo: 'Maintenance Team', residentName: 'Amit Singh', slaDueDate: day(current, 8), escalated: true },
    { flat: 'A-102', subject: 'Basement leakage', description: 'Leakage observed near parking slot 14.', category: 'plumbing', status: 'open', priority: 'medium', date: day(current, 12), assignedTo: 'RWA Committee', residentName: 'Pooja Verma', slaDueDate: day(current, 15), escalated: false },
  ];
  for (const row of rows) {
    await Complaint.findOneAndUpdate(
      { societyId, flat: row.flat, subject: row.subject },
      { societyId, ...row },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

async function seedVisitors() {
  const current = ym(0);
  const rows = [
    { name: 'Zomato Delivery', flat: 'A-101', purpose: 'Food Delivery', status: 'checked_in', checkIn: `${day(current, 12)}T19:05:00`, contact: '9988776655', preApproved: true },
    { name: 'Vivek Gupta', flat: 'C-301', purpose: 'Personal Visit', status: 'expected', vehicle: 'DL10AB1234', contact: '9911223344', preApproved: false },
  ];
  for (const row of rows) {
    await Visitor.findOneAndUpdate(
      { societyId, name: row.name, flat: row.flat },
      { societyId, ...row },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

export async function ensureDemoDataset() {
  const byFlat = await upsertMembers();
  await seedPayments(byFlat);
  await seedExpenses();
  await seedNotices();
  await seedComplaints();
  await seedVisitors();
  return {
    members: Object.keys(byFlat).length,
    month: ym(0),
  };
}
