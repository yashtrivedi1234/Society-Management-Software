import { useState, useMemo } from 'react';
import { useManagementLists } from '../hooks/useManagementLists';
import { useMarkPaymentPaidMutation } from '../store/apiSlice';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, getCurrentMonth, getMonthsList, formatMonthYear } from '../utils/formatDate';
import { generateWhatsAppLink } from '../utils/whatsappLink';
import societyConfig from '../config/society';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import DataState from '../components/common/DataState';
import { isPositiveAmount } from '../utils/validation';
import { getPaymentsForMonth, getMonthlyStats } from '../utils/financeDerived';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MessageCircle, FileText, CreditCard, Download } from 'lucide-react';

const ITEMS_PER_PAGE = 15;
const STATUS_OPTIONS = ['all', 'paid', 'unpaid', 'overdue', 'partial'];

const modeLabels = {
  upi: 'UPI',
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
};
export default function Payments() {
  const { payments, expenses, isLoading, loadError, reloadData } = useManagementLists();
  const [markPaidMut] = useMarkPaymentPaidMutation();
  const navigate = useNavigate();

  const months = useMemo(() => getMonthsList(6), []);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Mark Paid modal
  const [markPaidTarget, setMarkPaidTarget] = useState(null);
  const [markPaidError, setMarkPaidError] = useState('');
  const [payForm, setPayForm] = useState({
    amount: '',
    paidDate: new Date().toISOString().split('T')[0],
    paymentMode: 'upi',
    transactionRef: '',
  });

  // Filter payments
  const filtered = useMemo(() => {
    let result = getPaymentsForMonth(payments, selectedMonth);

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.memberName.toLowerCase().includes(q) ||
          p.flatNumber.toLowerCase().includes(q)
      );
    }

    return result;
  }, [payments, selectedMonth, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(
    () => getMonthlyStats(payments, expenses, selectedMonth),
    [payments, expenses, selectedMonth]
  );

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Mark as paid
  const openMarkPaid = (payment) => {
    setMarkPaidTarget(payment);
    setMarkPaidError('');
    setPayForm({
      // Prefill the full amount owed (includes late fees), not just the base maintenance.
      amount: payment.totalDue ?? payment.amount,
      paidDate: new Date().toISOString().split('T')[0],
      paymentMode: 'upi',
      transactionRef: '',
    });
  };

  const confirmMarkPaid = async () => {
    if (!markPaidTarget) return;
    const amount = Number(payForm.amount || markPaidTarget.totalDue || markPaidTarget.amount);
    if (!isPositiveAmount(amount)) {
      setMarkPaidError('Paid amount should be greater than zero');
      return;
    }
    try {
      await markPaidMut({
        id: markPaidTarget.id,
        payload: {
          paidAmount: amount,
          paidDate: payForm.paidDate,
          paymentMode: payForm.paymentMode,
          transactionRef: payForm.transactionRef,
        },
      }).unwrap();
      setMarkPaidTarget(null);
      setMarkPaidError('');
    } catch (error) {
      setMarkPaidError(error?.data?.message || 'Failed to mark payment');
    }
  };

  // WhatsApp
  const handleWhatsApp = (payment) => {
    const member = payment;
    const message = societyConfig.whatsappTemplate(
      member.memberName,
      member.amount,
      formatMonthYear(member.month),
      member.flatNumber,
      societyConfig.upiId
    );
    const phone = member.phone || societyConfig.phone;
    const link = generateWhatsAppLink(phone, message);
    window.open(link, '_blank');
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor maintenance payments for {formatMonthYear(selectedMonth)}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Month */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-colors"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {formatMonthYear(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-colors capitalize"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or flat number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DataState
          loading={isLoading}
          error={loadError}
          empty={filtered.length === 0}
          emptyMessage="No payments found"
          onRetry={reloadData}
        />
        {filtered.length > 0 && (
        <>
        <div className="md:hidden divide-y divide-gray-100">
          {paginated.map((payment) => {
            const isUnpaidOrOverdue = payment.status === 'unpaid' || payment.status === 'overdue';
            return (
              <div key={payment.id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{payment.flatNumber}</p>
                  <StatusBadge status={payment.status} />
                </div>
                <p className="text-sm text-gray-600 mt-1">{payment.memberName}</p>
                <p className="text-sm text-gray-700 mt-1">{formatMonthYear(payment.month)}</p>
                <div className="mt-2 text-sm">
                  <p className="text-gray-700">Due: <span className="font-semibold">{formatCurrency(payment.totalDue || payment.amount)}</span></p>
                  <p className="text-gray-700">Paid: {payment.paidAmount > 0 ? formatCurrency(payment.paidAmount) : '-'}</p>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {isUnpaidOrOverdue && (
                    <button onClick={() => openMarkPaid(payment)} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded-md">Pay</button>
                  )}
                  <button onClick={() => navigate(`/invoice/${payment.flatNumber}/${payment.month}`)} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md">Invoice</button>
                  {isUnpaidOrOverdue && (
                    <button onClick={() => handleWhatsApp(payment)} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded-md">WhatsApp</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm hidden md:table">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Flat No.</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Resident</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Month</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount Due</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Paid Amount</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Payment Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Mode</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((payment) => {
                  const isUnpaidOrOverdue =
                    payment.status === 'unpaid' || payment.status === 'overdue';

                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {payment.flatNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {payment.memberName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatMonthYear(payment.month)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(payment.totalDue || payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                        {payment.paidAmount > 0
                          ? formatCurrency(payment.paidAmount)
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(payment.paidDate)}
                      </td>
                      <td className="px-4 py-3">
                        {payment.paymentMode ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            {modeLabels[payment.paymentMode] || payment.paymentMode}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {isUnpaidOrOverdue && (
                            <button
                              onClick={() => openMarkPaid(payment)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                              title="Mark as Paid"
                              aria-label="Mark payment as paid"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() =>
                              navigate(
                                `/invoice/${payment.flatNumber}/${payment.month}`
                              )
                            }
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Invoice"
                            aria-label="View invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {isUnpaidOrOverdue && (
                            <button
                              onClick={() => handleWhatsApp(payment)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="Send WhatsApp Reminder"
                              aria-label="Send WhatsApp reminder"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
        </>
        )}
      </div>

      {/* Summary Bar */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Total Due
            </p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(stats.totalDue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Total Collected
            </p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(stats.totalCollected)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Total Pending
            </p>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(stats.totalPending)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Collection Rate
            </p>
            <p className="text-lg font-bold text-blue-600">
              {stats.collectionRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Mark Paid Modal */}
      <Modal
        isOpen={!!markPaidTarget}
        onClose={() => setMarkPaidTarget(null)}
        title="Mark Payment as Paid"
        size="md"
      >
        {markPaidTarget && (
          <div className="space-y-4">
            {markPaidError && <p className="text-sm text-red-600">{markPaidError}</p>}
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">{markPaidTarget.memberName}</span>
                {' '}&middot; Flat {markPaidTarget.flatNumber}
                {' '}&middot; {formatMonthYear(markPaidTarget.month)}
              </p>
              <p className="text-gray-500 mt-1">
                Amount due: <span className="font-semibold text-gray-900">{formatCurrency(markPaidTarget.totalDue ?? markPaidTarget.amount)}</span>
              </p>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="payment-amount" className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
              <input
                id="payment-amount"
                type="number"
                min="0"
                value={payForm.amount}
                onChange={(e) => setPayForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Payment Date */}
            <div>
              <label htmlFor="payment-date" className="block text-sm font-medium text-gray-700 mb-1.5">Payment Date</label>
              <input
                id="payment-date"
                type="date"
                value={payForm.paidDate}
                onChange={(e) => setPayForm((prev) => ({ ...prev, paidDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'upi', label: 'UPI' },
                  { value: 'cash', label: 'Cash' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'cheque', label: 'Cheque' },
                ].map((mode) => (
                  <label
                    key={mode.value}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer transition-colors ${
                      payForm.paymentMode === mode.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMode"
                      id={`payment-mode-${mode.value}`}
                      value={mode.value}
                      checked={payForm.paymentMode === mode.value}
                      onChange={(e) =>
                        setPayForm((prev) => ({ ...prev, paymentMode: e.target.value }))
                      }
                      className="sr-only"
                    />
                    {mode.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Transaction Ref */}
            <div>
              <label htmlFor="payment-transaction-ref" className="block text-sm font-medium text-gray-700 mb-1.5">
                Transaction Reference
              </label>
              <input
                id="payment-transaction-ref"
                type="text"
                value={payForm.transactionRef}
                onChange={(e) =>
                  setPayForm((prev) => ({ ...prev, transactionRef: e.target.value }))
                }
                placeholder="e.g. UPI ref or cheque number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setMarkPaidTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmMarkPaid}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
