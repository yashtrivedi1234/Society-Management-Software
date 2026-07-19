import societyConfig from '../config/society';

/** Map live API (_id, populated memberId) and demo (id) shapes to a stable UI model. */
export function normalizeMember(m) {
  return {
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
  };
}

export function normalizeExpense(e) {
  return {
    id: e._id || e.id,
    date: e.date,
    category: e.category,
    description: e.description,
    amount: e.amount,
    paidTo: e.paidTo,
    paymentMode: e.paymentMode || 'upi',
    receiptNumber: e.receiptNumber || '',
    addedBy: e.addedBy || 'admin',
  };
}

export function normalizePayment(p) {
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
}

export function getPaymentsForMonth(payments, month) {
  return payments.filter((p) => p.month === month);
}

export function getMonthlyStats(payments, expenses, month) {
  const monthPayments = getPaymentsForMonth(payments, month);
  const totalDue = monthPayments.reduce(
    (s, p) => s + (p.totalDue ?? p.amount ?? societyConfig.monthlyMaintenance),
    0
  );
  const totalCollected = monthPayments.reduce((s, p) => s + (p.paidAmount || 0), 0);
  const totalPending = totalDue - totalCollected;
  const paidCount = monthPayments.filter((p) => p.status === 'paid').length;
  const overdueCount = monthPayments.filter((p) => p.status === 'overdue').length;
  const unpaidCount = monthPayments.filter((p) => p.status === 'unpaid').length;
  const partialCount = monthPayments.filter((p) => p.status === 'partial').length;
  const totalExpenses = expenses
    .filter((e) => e.date.startsWith(month))
    .reduce((s, e) => s + e.amount, 0);

  return {
    totalDue,
    totalCollected,
    totalPending,
    paidCount,
    overdueCount,
    unpaidCount,
    partialCount,
    totalExpenses,
    netBalance: totalCollected - totalExpenses,
    collectionRate: totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0,
  };
}

export function getDefaulters(payments, members, month) {
  return payments
    .filter((p) => p.month === month && (p.status === 'overdue' || p.status === 'unpaid'))
    .map((p) => {
      const member = members.find((m) => m.id === p.memberId);
      return { ...p, phone: member?.phone };
    });
}

export function getLedgerData(payments, expenses, month) {
  const allMonths = [
    ...new Set([
      ...payments.map((p) => p.month),
      ...expenses.map((e) => e.date.substring(0, 7)),
    ]),
  ].sort();

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

  const transactions = [...incomeEntries, ...expenseEntries].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

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
}
