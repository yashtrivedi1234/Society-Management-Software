import { getCurrentMonth } from '../utils/formatDate';

const month = getCurrentMonth();

export const demoMembers = [
  { id: 'demo-m1', flatNumber: 'A-101', block: 'A', name: 'Rajesh Sharma', phone: '9876543210', email: 'rajesh@gmail.com', familyMembers: 4, isOwner: true, status: 'active', role: 'Member', isCommitteeMember: false },
  { id: 'demo-m2', flatNumber: 'A-102', block: 'A', name: 'Pooja Verma', phone: '9876543211', email: 'pooja@gmail.com', familyMembers: 3, isOwner: true, status: 'active', role: 'Member', isCommitteeMember: false },
  { id: 'demo-m3', flatNumber: 'B-201', block: 'B', name: 'Amit Singh', phone: '9876543212', email: 'amit@gmail.com', familyMembers: 2, isOwner: true, status: 'active', role: 'Member', isCommitteeMember: false },
  { id: 'demo-m4', flatNumber: 'C-301', block: 'C', name: 'Neha Arora', phone: '9876543213', email: 'neha@gmail.com', familyMembers: 5, isOwner: true, status: 'active', role: 'Member', isCommitteeMember: true },
  { id: 'demo-m5', flatNumber: 'C-302', block: 'C', name: 'Karan Mehta', phone: '9876543214', email: 'karan@gmail.com', familyMembers: 1, isOwner: false, status: 'active', role: 'Member', isCommitteeMember: false },
];

export const demoExpenses = [
  { id: 'demo-e1', date: `${month}-02`, category: 'security', description: 'Security staff monthly payout', amount: 28000, paidTo: 'Shield Guards Pvt Ltd', paymentMode: 'bank_transfer', receiptNumber: 'EXP-001', addedBy: 'admin' },
  { id: 'demo-e2', date: `${month}-08`, category: 'utilities', description: 'Common area electricity bill', amount: 15400, paidTo: 'State Electricity Board', paymentMode: 'upi', receiptNumber: 'EXP-002', addedBy: 'admin' },
  { id: 'demo-e3', date: `${month}-11`, category: 'maintenance', description: 'Lift preventive maintenance', amount: 7800, paidTo: 'Otis Service Team', paymentMode: 'bank_transfer', receiptNumber: 'EXP-003', addedBy: 'admin' },
];

export const demoPayments = [
  { id: 'demo-p1', memberId: 'demo-m1', memberName: 'Rajesh Sharma', flatNumber: 'A-101', month, amount: 3500, totalDue: 3500, paidAmount: 3500, status: 'paid', paidDate: `${month}-03`, paymentMode: 'upi', transactionRef: 'UPI-1001' },
  { id: 'demo-p2', memberId: 'demo-m2', memberName: 'Pooja Verma', flatNumber: 'A-102', month, amount: 3500, totalDue: 3700, paidAmount: 2000, status: 'partial', paidDate: `${month}-09`, paymentMode: 'cash', transactionRef: 'CASH-1002' },
  { id: 'demo-p3', memberId: 'demo-m3', memberName: 'Amit Singh', flatNumber: 'B-201', month, amount: 3500, totalDue: 3900, paidAmount: 0, status: 'overdue', paidDate: null, paymentMode: null, transactionRef: null },
  { id: 'demo-p4', memberId: 'demo-m4', memberName: 'Neha Arora', flatNumber: 'C-301', month, amount: 3500, totalDue: 3500, paidAmount: 0, status: 'unpaid', paidDate: null, paymentMode: null, transactionRef: null },
  { id: 'demo-p5', memberId: 'demo-m5', memberName: 'Karan Mehta', flatNumber: 'C-302', month, amount: 3500, totalDue: 3500, paidAmount: 3500, status: 'paid', paidDate: `${month}-05`, paymentMode: 'bank_transfer', transactionRef: 'NEFT-1005' },
];

export function createDemoDataset() {
  return {
    members: demoMembers.map((m) => ({ ...m })),
    expenses: demoExpenses.map((e) => ({ ...e })),
    payments: demoPayments.map((p) => ({ ...p })),
  };
}
