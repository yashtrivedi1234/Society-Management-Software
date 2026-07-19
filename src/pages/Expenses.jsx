import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { expenseCategories, getCategoryById } from '../data/categories';
import Modal from '../components/common/Modal';
import DataState from '../components/common/DataState';
import { isPositiveAmount } from '../utils/validation';
import { Plus, Search, Trash2, Filter } from 'lucide-react';

const ITEMS_PER_PAGE = 12;
const modeLabels = {
  upi: 'UPI',
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
};

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  category: '',
  description: '',
  amount: '',
  paidTo: '',
  paymentMode: 'upi',
  receiptNumber: '',
};

export default function Expenses() {
  const { expenses, addExpense, deleteExpense, isLoading, loadError, reloadData } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = [...expenses];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.paidTo.toLowerCase().includes(q) ||
          e.receiptNumber?.toLowerCase().includes(q)
      );
    }

    if (categoryFilter) {
      result = result.filter((e) => e.category === categoryFilter);
    }

    result.sort((a, b) =>
      sortAsc
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date)
    );

    return result;
  }, [expenses, searchQuery, categoryFilter, sortAsc]);

  const totalExpenses = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered]
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

  // Form handlers
  const openAddModal = () => {
    setFormData(emptyForm);
    setFormErrors({});
    setShowAddModal(true);
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.date) errors.date = 'Date is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.amount || Number(formData.amount) <= 0) errors.amount = 'Valid amount is required';
    if (!formData.paidTo.trim()) errors.paidTo = 'Paid To is required';
    return errors;
  };

  const handleSave = () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    if (!isPositiveAmount(formData.amount)) {
      setFormErrors((prev) => ({ ...prev, amount: 'Valid amount is required' }));
      return;
    }
    addExpense({
      ...formData,
      amount: Number(formData.amount),
      receiptNumber: formData.receiptNumber || `RCP-${Date.now()}`,
    })
      .then(() => setShowAddModal(false))
      .catch((error) => setFormErrors((prev) => ({ ...prev, description: error?.data?.message || 'Failed to save expense' })));
  };

  const confirmDelete = () => {
    if (deleteTarget) deleteExpense(deleteTarget);
    setDeleteTarget(null);
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage society expenses</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-colors"
            >
              <option value="">All Categories</option>
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DataState
          loading={isLoading}
          error={loadError}
          empty={filtered.length === 0}
          emptyMessage="No expenses found"
          onRetry={reloadData}
        />
        {filtered.length > 0 && (
        <>
        <div className="md:hidden divide-y divide-gray-100">
          {paginated.map((expense) => {
            const category = getCategoryById(expense.category);
            return (
              <div key={expense.id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{expense.description}</p>
                  <button onClick={() => setDeleteTarget(expense.id)} className="p-1 rounded text-gray-400 hover:text-red-600" aria-label="Delete expense">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{formatDate(expense.date)} • {category.label}</p>
                <p className="text-sm text-gray-700 mt-1">{expense.paidTo}</p>
                <p className="text-sm font-bold text-gray-900 mt-2">{formatCurrency(expense.amount)}</p>
              </div>
            );
          })}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm hidden md:table">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th
                  className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => setSortAsc((prev) => !prev)}
                >
                  Date {sortAsc ? '\u2191' : '\u2193'}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Description</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Paid To</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Mode</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((expense) => {
                  const category = getCategoryById(expense.category);
                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium max-w-[240px] truncate">
                        {expense.description}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${category.color}18`,
                            color: category.color,
                          }}
                        >
                          {category.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {expense.paidTo}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                          {modeLabels[expense.paymentMode] || expense.paymentMode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setDeleteTarget(expense.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Footer: Total + Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="text-sm text-gray-600">
            Total Expenses:{' '}
            <span className="font-bold text-gray-900">{formatCurrency(totalExpenses)}</span>
            <span className="text-gray-400 ml-2">({filtered.length} records)</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
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
        </div>
        </>
        )}
      </div>

      {/* Add Expense Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Expense" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label htmlFor="expense-date" className="block text-sm font-medium text-gray-700 mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                id="expense-date"
                type="date"
                value={formData.date}
                onChange={(e) => updateField('date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  formErrors.date ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {formErrors.date && (
                <p className="text-xs text-red-500 mt-1">{formErrors.date}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="expense-category" className="block text-sm font-medium text-gray-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="expense-category"
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-colors ${
                  formErrors.category ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                <option value="">Select category</option>
                {expenseCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {formErrors.category && (
                <p className="text-xs text-red-500 mt-1">{formErrors.category}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="expense-description" className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              id="expense-description"
              type="text"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Enter expense description"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                formErrors.description ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {formErrors.description && (
              <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label htmlFor="expense-amount" className="block text-sm font-medium text-gray-700 mb-1.5">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                id="expense-amount"
                type="number"
                min="0"
                step="1"
                value={formData.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  formErrors.amount ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {formErrors.amount && (
                <p className="text-xs text-red-500 mt-1">{formErrors.amount}</p>
              )}
            </div>

            {/* Paid To */}
            <div>
              <label htmlFor="expense-paid-to" className="block text-sm font-medium text-gray-700 mb-1.5">
                Paid To <span className="text-red-500">*</span>
              </label>
              <input
                id="expense-paid-to"
                type="text"
                value={formData.paidTo}
                onChange={(e) => updateField('paidTo', e.target.value)}
                placeholder="Vendor / Payee name"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  formErrors.paidTo ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {formErrors.paidTo && (
                <p className="text-xs text-red-500 mt-1">{formErrors.paidTo}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Mode */}
            <div>
              <label htmlFor="expense-payment-mode" className="block text-sm font-medium text-gray-700 mb-1.5">
                Payment Mode
              </label>
              <select
                id="expense-payment-mode"
                value={formData.paymentMode}
                onChange={(e) => updateField('paymentMode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-colors"
              >
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            {/* Receipt Number */}
            <div>
              <label htmlFor="expense-receipt-number" className="block text-sm font-medium text-gray-700 mb-1.5">
                Receipt Number
              </label>
              <input
                id="expense-receipt-number"
                type="text"
                value={formData.receiptNumber}
                onChange={(e) => updateField('receiptNumber', e.target.value)}
                placeholder="Auto-generated if empty"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Save Expense
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this expense? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
