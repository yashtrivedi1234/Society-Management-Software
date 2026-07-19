import { useState, useMemo } from 'react';
import { useManagementLists } from '../hooks/useManagementLists';
import { useMarkPaymentPaidMutation } from '../store/apiSlice';
import { formatCurrency } from '../utils/formatCurrency';
import { getCurrentMonth, formatMonthYear, getMonthsList, formatDate } from '../utils/formatDate';
import { generateWhatsAppLink } from '../utils/whatsappLink';
import societyConfig from '../config/society';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import DataState from '../components/common/DataState';
import {
  getPaymentsForMonth,
  getMonthlyStats,
  getDefaulters,
} from '../utils/financeDerived';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  AlertTriangle,
  MessageCircle,
  CreditCard,
  Home,
} from 'lucide-react';

const blockColors = {
  A: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', accent: 'bg-blue-500' },
  B: { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700', accent: 'bg-green-500' },
  C: { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', accent: 'bg-purple-500' },
};

const statusConfig = {
  paid:    { border: 'border-l-green-500',  bg: 'hover:bg-green-50/50',  icon: Check,       iconColor: 'text-green-500', ring: 'ring-green-200' },
  overdue: { border: 'border-l-red-500',    bg: 'hover:bg-red-50/50',    icon: X,           iconColor: 'text-red-500',   ring: 'ring-red-200' },
  unpaid:  { border: 'border-l-yellow-500', bg: 'hover:bg-yellow-50/50', icon: Clock,       iconColor: 'text-yellow-500', ring: 'ring-yellow-200' },
  partial: { border: 'border-l-blue-500',   bg: 'hover:bg-blue-50/50',   icon: CreditCard,  iconColor: 'text-blue-500',  ring: 'ring-blue-200' },
};
export default function Maintenance() {
  const { members, payments: allPayments, expenses, isLoading, loadError, reloadData } =
    useManagementLists();
  const [markPaidMut] = useMarkPaymentPaidMutation();
  const monthsList = getMonthsList(6);

  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Modal form state
  const [paymentAmount, setPaymentAmount] = useState(societyConfig.monthlyMaintenance);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [markError, setMarkError] = useState('');

  const payments = useMemo(
    () => getPaymentsForMonth(allPayments, currentMonth),
    [allPayments, currentMonth]
  );
  const stats = useMemo(
    () => getMonthlyStats(allPayments, expenses, currentMonth),
    [allPayments, expenses, currentMonth]
  );
  const defaulters = useMemo(
    () => getDefaulters(allPayments, members, currentMonth),
    [allPayments, members, currentMonth]
  );
  const totalFlats = payments.length;

  // Month navigation
  const currentMonthIdx = monthsList.indexOf(currentMonth);
  const canGoNext = currentMonthIdx > 0;
  const canGoPrev = currentMonthIdx < monthsList.length - 1;

  const navigateMonth = (dir) => {
    if (dir === 'prev' && canGoPrev) setCurrentMonth(monthsList[currentMonthIdx + 1]);
    if (dir === 'next' && canGoNext) setCurrentMonth(monthsList[currentMonthIdx - 1]);
  };

  // Group payments by block
  const paymentsByBlock = {};
  for (const block of societyConfig.blocks) {
    paymentsByBlock[block] = payments
      .filter((p) => p.flatNumber.startsWith(block + '-'))
      .sort((a, b) => a.flatNumber.localeCompare(b.flatNumber));
  }

  // Open mark-paid modal
  const openMarkPaid = (payment) => {
    setSelectedPayment(payment);
    setMarkError('');
    // Prefill the full amount owed (base + any late fee), not just the base maintenance.
    setPaymentAmount(payment.totalDue ?? payment.amount);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('upi');
    setTransactionRef('');
    setShowMarkPaidModal(true);
  };

  const handleConfirmPaid = async () => {
    if (!selectedPayment) return;
    setMarkError('');
    try {
      await markPaidMut({
        id: selectedPayment.id,
        payload: {
          paidAmount: paymentAmount,
          paidDate: paymentDate,
          paymentMode,
          transactionRef,
        },
      }).unwrap();
      setShowMarkPaidModal(false);
      setSelectedPayment(null);
    } catch (error) {
      setMarkError(error?.data?.message || 'Failed to mark payment as paid');
    }
  };

  // WhatsApp link for a single payment
  const getWhatsAppUrl = (payment) => {
    const member = members.find((m) => m.id === payment.memberId);
    if (!member) return '#';
    const message = societyConfig.whatsappTemplate(
      member.name,
      payment.amount,
      formatMonthYear(payment.month),
      payment.flatNumber,
      societyConfig.upiId
    );
    return generateWhatsAppLink(member.phone, message);
  };

  // Send reminders to all defaulters
  const sendBulkReminders = () => {
    defaulters.forEach((d, i) => {
      const member = members.find((m) => m.id === d.memberId);
      if (!member) return;
      const message = societyConfig.whatsappTemplate(
        member.name,
        d.amount,
        formatMonthYear(d.month),
        d.flatNumber,
        societyConfig.upiId
      );
      const url = generateWhatsAppLink(member.phone, message);
      setTimeout(() => window.open(url, '_blank'), i * 500);
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Collection</h1>
          {/* Month selector */}
          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 shadow-sm px-1">
            <button
              onClick={() => navigateMonth('prev')}
              disabled={!canGoPrev}
              className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 text-sm font-medium text-gray-700 min-w-[130px] text-center">
              {formatMonthYear(currentMonth)}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              disabled={!canGoNext}
              className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <Check className="w-3.5 h-3.5" />
            Paid: {stats.paidCount}/{totalFlats}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            <Clock className="w-3.5 h-3.5" />
            Pending: {stats.unpaidCount + stats.partialCount}/{totalFlats}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue: {stats.overdueCount}/{totalFlats}
          </span>
        </div>
      </div>

      {/* Main Content - Block Grid */}
      <DataState
        loading={isLoading}
        error={loadError}
        empty={payments.length === 0}
        emptyMessage="No maintenance records found for this month."
        onRetry={reloadData}
      />
      {payments.length > 0 && (
      <div className="space-y-8">
        {societyConfig.blocks.map((block) => {
          const colors = blockColors[block] || blockColors.A;
          const blockPayments = paymentsByBlock[block] || [];

          return (
            <div key={block} className="space-y-4">
              {/* Block Header */}
              <div className={`flex items-center gap-3 border-l-4 ${colors.border} pl-4`}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${colors.bg}`}>
                  <Home className={`w-4 h-4 ${colors.text}`} />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Block {block}</h2>
                <span className="text-sm text-gray-500">
                  ({blockPayments.filter((p) => p.status === 'paid').length}/{blockPayments.length} paid)
                </span>
              </div>

              {/* Flat Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {blockPayments.map((payment) => {
                  const sc = statusConfig[payment.status] || statusConfig.unpaid;
                  const StatusIcon = sc.icon;
                  const isPaid = payment.status === 'paid';

                  return (
                    <div
                      key={payment.id}
                      className={`
                        bg-white rounded-lg border border-gray-200 p-4
                        border-l-4 ${sc.border}
                        hover:shadow-md transition-all duration-200
                        ${sc.bg}
                      `}
                    >
                      {/* Top: flat number + status icon */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 text-sm">{payment.flatNumber}</span>
                        <span className={`p-1 rounded-full ${sc.iconColor} bg-opacity-10`}>
                          <StatusIcon className="w-4 h-4" />
                        </span>
                      </div>

                      {/* Middle: name + amount */}
                      <p className="text-sm text-gray-600 truncate mb-1">{payment.memberName}</p>
                      <p className="text-sm font-medium text-gray-800">
                        {payment.status === 'partial'
                          ? `${formatCurrency(payment.paidAmount)} / ${formatCurrency(payment.totalDue ?? payment.amount)}`
                          : formatCurrency(payment.totalDue ?? payment.amount)}
                      </p>

                      {/* Bottom: action buttons (only if NOT paid) */}
                      {!isPaid && (
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => openMarkPaid(payment)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Mark Paid
                          </button>
                          <a
                            href={getWhatsAppUrl(payment)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center p-1.5 border border-green-500 text-green-600 rounded-md hover:bg-green-50 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Paid badge */}
                      {isPaid && payment.paidDate && (
                        <p className="text-xs text-green-600 mt-2 font-medium">
                          Paid on {formatDate(payment.paidDate)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Bulk Action Bar */}
      {defaulters.length > 0 && (
        <div className="sticky bottom-0 z-10 bg-white/90 backdrop-blur border-t border-gray-200 -mx-4 px-4 py-3 sm:-mx-6 sm:px-6 mt-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-red-600">{defaulters.length}</span> flat(s) with pending/overdue payments
            </p>
            <button
              onClick={sendBulkReminders}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Send Reminder to All Defaulters ({defaulters.length})
            </button>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      <Modal
        isOpen={showMarkPaidModal}
        onClose={() => setShowMarkPaidModal(false)}
        title="Mark Payment as Paid"
      >
        {selectedPayment && (
          <div className="space-y-4">
            {/* Flat and member info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <Home className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedPayment.flatNumber}</p>
                <p className="text-sm text-gray-600">{selectedPayment.memberName}</p>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  {societyConfig.currencySymbol}
                </span>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'upi', label: 'UPI' },
                  { value: 'cash', label: 'Cash' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'cheque', label: 'Cheque' },
                ].map((mode) => (
                  <label
                    key={mode.value}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors text-sm ${
                      paymentMode === mode.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMode"
                      value={mode.value}
                      checked={paymentMode === mode.value}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="sr-only"
                    />
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                        paymentMode === mode.value ? 'border-blue-500' : 'border-gray-300'
                      }`}
                    >
                      {paymentMode === mode.value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                    </span>
                    {mode.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Transaction Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Reference <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g., UTR number or cheque number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {markError && <p className="text-sm text-red-600">{markError}</p>}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleConfirmPaid}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                Confirm Payment
              </button>
              <button
                onClick={() => setShowMarkPaidModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
