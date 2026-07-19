import { createContext, useContext, useMemo } from 'react';
import societyConfig from '../config/society';
import { isLiveMode } from '../config/appMode';
import { useAuth } from './AuthContext';
import {
  useGetMembersQuery,
  useGetExpensesQuery,
  useGetPaymentsQuery,
  useCreateMemberMutation,
  useUpdateMemberMutation,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useMarkPaymentPaidMutation,
} from '../store/apiSlice';

const DataContext = createContext(null);

// --- Normalizers: map both live API shapes (_id, populated memberId) and demo shapes (id) ---
const normalizeMember = (m) => ({
  id: m._id || m.id,
  flatNumber: m.flatNumber,
  block: (m.flatNumber || '').split('-')[0] || 'A',
  name: m.name,
  phone: m.phone || '',
  email: m.email || '',
  isOwner: m.isOwner ?? true,
  familyMembers: m.familyMembers ?? 1,
  status: m.status || 'active',
  role: m.role || 'Member',
  isCommitteeMember: Boolean(m.isCommitteeMember),
  hasLogin: Boolean(m.hasLogin),
});

const normalizeExpense = (e) => ({
  id: e._id || e.id,
  date: e.date,
  category: e.category,
  description: e.description,
  amount: e.amount,
  paidTo: e.paidTo,
  paymentMode: e.paymentMode || 'upi',
  receiptNumber: e.receiptNumber || '',
  addedBy: e.addedBy || 'admin',
});

const normalizePayment = (p) => {
  const member = typeof p.memberId === 'object' && p.memberId ? p.memberId : null;
  return {
    id: p._id || p.id,
    memberId: member?._id || p.memberId,
    memberName: member?.name || p.memberName || 'Resident',
    flatNumber: member?.flatNumber || p.flatNumber || '',
    month: p.month,
    amount: p.amount,
    totalDue: p.totalDue ?? p.amount,
    paidAmount: p.paidAmount || 0,
    status: p.status || 'unpaid',
    paidDate: p.paidDate || null,
    paymentMode: p.paymentMode || null,
    transactionRef: p.transactionRef || null,
  };
};

export function DataProvider({ children }) {
  const { user } = useAuth();
  // Residents can't read the society-wide member/payment/expense lists (management-only, gated),
  // so skip those queries for them in live mode. In demo mode the services return local data.
  const skip = isLiveMode && (!user || user.role === 'member');

  const membersQ = useGetMembersQuery(undefined, { skip });
  const expensesQ = useGetExpensesQuery(undefined, { skip });
  const paymentsQ = useGetPaymentsQuery(undefined, { skip });

  const [createMemberMut] = useCreateMemberMutation();
  const [updateMemberMut] = useUpdateMemberMutation();
  const [createExpenseMut] = useCreateExpenseMutation();
  const [deleteExpenseMut] = useDeleteExpenseMutation();
  const [markPaidMut] = useMarkPaymentPaidMutation();

  const members = useMemo(() => (membersQ.data || []).map(normalizeMember), [membersQ.data]);
  const expenses = useMemo(() => (expensesQ.data || []).map(normalizeExpense), [expensesQ.data]);
  const payments = useMemo(() => (paymentsQ.data || []).map(normalizePayment), [paymentsQ.data]);

  const isLoading = membersQ.isLoading || expensesQ.isLoading || paymentsQ.isLoading;
  const loadError =
    membersQ.error?.data?.message || expensesQ.error?.data?.message || paymentsQ.error?.data?.message || '';

  // Mutations invalidate their tag, which auto-refetches the relevant list query.
  const reloadData = () => {
    if (skip) return;
    membersQ.refetch();
    expensesQ.refetch();
    paymentsQ.refetch();
  };

  const addExpense = (expense) =>
    createExpenseMut({
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: Number(expense.amount),
      paidTo: expense.paidTo,
      paymentMode: expense.paymentMode || 'upi',
      receiptNumber: expense.receiptNumber || '',
    }).unwrap();

  const deleteExpense = (id) => deleteExpenseMut(id).unwrap();

  const addMember = (member) =>
    createMemberMut({
      flatNumber: member.flatNumber,
      name: member.name,
      phone: member.phone,
      email: member.email,
      isOwner: member.isOwner,
      familyMembers: Number(member.familyMembers || 1),
      status: 'active',
      // Optionally also provision a resident login linked to this flat.
      createLogin: Boolean(member.createLogin),
      loginPassword: member.createLogin ? member.loginPassword : undefined,
    }).unwrap();

  const updateMember = (id, updates) => updateMemberMut({ id, payload: updates }).unwrap();

  const markAsPaid = (paymentId, paymentDetails) =>
    markPaidMut({ id: paymentId, payload: paymentDetails }).unwrap();

  const getPaymentsForMonth = (month) => payments.filter((p) => p.month === month);

  const getMonthlyStats = (month) => {
    const monthPayments = getPaymentsForMonth(month);
    // Use each payment's own totalDue (which includes late fees) rather than a flat rate.
    const totalDue = monthPayments.reduce((s, p) => s + (p.totalDue ?? p.amount ?? societyConfig.monthlyMaintenance), 0);
    const totalCollected = monthPayments.reduce((s, p) => s + (p.paidAmount || 0), 0);
    const totalPending = totalDue - totalCollected;
    const paidCount = monthPayments.filter((p) => p.status === 'paid').length;
    const overdueCount = monthPayments.filter((p) => p.status === 'overdue').length;
    const unpaidCount = monthPayments.filter((p) => p.status === 'unpaid').length;
    const partialCount = monthPayments.filter((p) => p.status === 'partial').length;
    const monthExpenses = expenses.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0);

    return {
      totalDue, totalCollected, totalPending,
      paidCount, overdueCount, unpaidCount, partialCount,
      totalExpenses: monthExpenses,
      netBalance: totalCollected - monthExpenses,
      collectionRate: totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0,
    };
  };

  const getLedgerData = (month) => {
    const allMonths = [...new Set([
      ...payments.map((p) => p.month),
      ...expenses.map((e) => e.date.substring(0, 7)),
    ])].sort();

    let openingBalance = 0;
    for (const m of allMonths) {
      if (m >= month) break;
      const mIncome = payments
        .filter((p) => p.month === m && (p.status === 'paid' || p.status === 'partial'))
        .reduce((s, p) => s + p.paidAmount, 0);
      const mExpenses = expenses.filter((e) => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0);
      openingBalance += mIncome - mExpenses;
    }

    const incomeEntries = payments
      .filter((p) => p.month === month && (p.status === 'paid' || p.status === 'partial') && p.paidDate)
      .map((p) => ({
        id: p.id,
        date: p.paidDate,
        description: `Maintenance - Flat ${p.flatNumber} (${p.memberName})`,
        type: 'income',
        amount: p.paidAmount,
        category: null,
        mode: p.paymentMode,
      }));

    const expenseEntries = expenses
      .filter((e) => e.date.startsWith(month))
      .map((e) => ({
        id: e.id,
        date: e.date,
        description: e.description,
        type: 'expense',
        amount: e.amount,
        category: e.category,
        mode: e.paymentMode,
      }));

    const transactions = [...incomeEntries, ...expenseEntries].sort((a, b) => a.date.localeCompare(b.date));

    let balance = openingBalance;
    for (const txn of transactions) {
      balance += txn.type === 'income' ? txn.amount : -txn.amount;
      txn.runningBalance = balance;
    }

    const totalIncome = incomeEntries.reduce((s, t) => s + t.amount, 0);
    const totalExpenses = expenseEntries.reduce((s, t) => s + t.amount, 0);

    return {
      openingBalance,
      transactions,
      totalIncome,
      totalExpenses,
      closingBalance: openingBalance + totalIncome - totalExpenses,
    };
  };

  const getDefaulters = (month) =>
    payments
      .filter((p) => p.month === month && (p.status === 'overdue' || p.status === 'unpaid'))
      .map((p) => {
        const member = members.find((m) => m.id === p.memberId);
        return { ...p, phone: member?.phone };
      });

  const value = useMemo(() => ({
    members, expenses, payments, isLoading, loadError,
    addExpense, deleteExpense, addMember, updateMember, markAsPaid,
    getPaymentsForMonth, getMonthlyStats, getDefaulters, getLedgerData, reloadData,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [members, expenses, payments, isLoading, loadError]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
