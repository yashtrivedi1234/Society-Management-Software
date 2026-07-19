import { useState, useMemo } from 'react';
import { useManagementLists } from '../hooks/useManagementLists';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, getCurrentMonth, getMonthsList, formatMonthYear } from '../utils/formatDate';
import { getCategoryById } from '../data/categories';
import { getLedgerData } from '../utils/financeDerived';
import societyConfig from '../config/society';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Download, Search, ArrowUpRight, ArrowDownRight, Wallet, Scale } from 'lucide-react';

export default function Ledger() {
  const { payments, expenses } = useManagementLists();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const months = useMemo(() => getMonthsList(6), []);

  const ledgerData = useMemo(
    () => getLedgerData(payments, expenses, selectedMonth),
    [payments, expenses, selectedMonth]
  );

  const displayedTransactions = useMemo(() => {
    if (!ledgerData?.transactions) return [];
    return ledgerData.transactions.filter((txn) => {
      if (typeFilter !== 'all' && txn.type !== typeFilter) return false;
      if (searchQuery && !txn.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [ledgerData, typeFilter, searchQuery]);

  const categoryBreakdown = useMemo(() => {
    if (!ledgerData?.transactions) return [];
    const grouped = {};
    ledgerData.transactions.forEach((txn) => {
      if (txn.type === 'expense') {
        if (!grouped[txn.category]) {
          grouped[txn.category] = 0;
        }
        grouped[txn.category] += txn.amount;
      }
    });
    return Object.entries(grouped)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [ledgerData]);

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    setTypeFilter('all');
    setSearchQuery('');
  };

  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const monthLabel = formatMonthYear(selectedMonth);

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(societyConfig.name, 14, 20);
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(30, 64, 175);
    doc.text(`Ledger - ${monthLabel}`, 14, 28);
    doc.setTextColor(0);

    doc.setFontSize(9);
    doc.text(
      `Opening Balance: ${formatCurrency(ledgerData.openingBalance)}   |   Income: ${formatCurrency(ledgerData.totalIncome)}   |   Expenses: ${formatCurrency(ledgerData.totalExpenses)}   |   Closing Balance: ${formatCurrency(ledgerData.closingBalance)}`,
      14,
      36
    );

    const tableData = ledgerData.transactions.map((txn) => [
      txn.date,
      txn.description.substring(0, 50),
      txn.type === 'income' ? 'Income' : 'Expense',
      txn.type === 'income' ? formatCurrency(txn.amount) : '-',
      txn.type === 'expense' ? formatCurrency(txn.amount) : '-',
      formatCurrency(txn.runningBalance),
    ]);

    doc.autoTable({
      startY: 42,
      head: [['Date', 'Description', 'Type', 'Credit (In)', 'Debit (Out)', 'Balance']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 18 },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 28, halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index < ledgerData.transactions.length) {
          const txn = ledgerData.transactions[data.row.index];
          if (txn.type === 'income') {
            data.cell.styles.fillColor = [240, 253, 244];
          } else {
            data.cell.styles.fillColor = [254, 242, 242];
          }
        }
      },
    });

    const finalY = doc.lastAutoTable.finalY + 6;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Closing Balance: ${formatCurrency(ledgerData.closingBalance)}`, 14, finalY);

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(128);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')} | ${societyConfig.name}`, 14, finalY + 8);

    doc.save(`Ledger-${selectedMonth}.pdf`);
  };

  const { openingBalance = 0, totalIncome = 0, totalExpenses = 0, closingBalance = 0 } = ledgerData || {};

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ledger</h1>
          <p className="text-sm text-gray-500">
            Financial transactions for {formatMonthYear(selectedMonth)}
          </p>
        </div>
        <button
          onClick={exportPDF}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Download size={16} />
          Export PDF
        </button>
      </div>

      {/* Month Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {months.map((m) => {
          const parts = formatMonthYear(m).split(' ');
          const label = `${parts[0].substring(0, 3)} ${parts[1]}`;
          const isActive = m === selectedMonth;
          return (
            <button
              key={m}
              onClick={() => handleMonthChange(m)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wallet size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Opening Balance</p>
              <p className="text-xl font-bold text-blue-700">{formatCurrency(openingBalance)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ArrowUpRight size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Income</p>
              <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowDownRight size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Scale size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Closing Balance</p>
              <p className="text-xl font-bold text-purple-700">{formatCurrency(closingBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Transactions</option>
          <option value="income">Income Only</option>
          <option value="expense">Expenses Only</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="w-28 px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="w-24 px-4 py-3 text-left font-medium">Type</th>
                <th className="w-32 px-4 py-3 text-right font-medium">Credit (In)</th>
                <th className="w-32 px-4 py-3 text-right font-medium">Debit (Out)</th>
                <th className="w-36 px-4 py-3 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance Row */}
              <tr className="bg-blue-50/50 font-medium text-blue-800">
                <td colSpan={3} className="px-4 py-3">Opening Balance</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-right">{formatCurrency(openingBalance)}</td>
              </tr>

              {/* Transaction Rows */}
              {displayedTransactions.length > 0 ? (
                displayedTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">{formatDate(txn.date)}</td>
                    <td className="px-4 py-3 text-gray-800 truncate max-w-[300px]">{txn.description}</td>
                    <td className="px-4 py-3">
                      {txn.type === 'income' ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          <ArrowUpRight size={12} /> Income
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                          <ArrowDownRight size={12} /> Expense
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {txn.type === 'income' ? (
                        <span className="text-emerald-600 font-medium">{formatCurrency(txn.amount)}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {txn.type === 'expense' ? (
                        <span className="text-red-500 font-medium">{formatCurrency(txn.amount)}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                      {formatCurrency(txn.runningBalance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No transactions for this month
                  </td>
                </tr>
              )}

              {/* Closing Balance Row */}
              <tr className="bg-purple-50/50 font-semibold text-purple-800 border-t-2 border-purple-200">
                <td className="px-4 py-3">Closing Balance</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(totalIncome)}</td>
                <td className="px-4 py-3 text-right text-red-600">{formatCurrency(totalExpenses)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(closingBalance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-400">{displayedTransactions.length} transactions</p>
        </div>
      </div>

      {/* Category-wise Expense Summary */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Expense Summary by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {categoryBreakdown.map(({ category, total }) => {
              const cat = getCategoryById(category);
              return (
                <div key={category} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat?.color || '#6b7280' }}
                  />
                  <span className="text-sm text-gray-600 truncate">{cat?.label || category}</span>
                  <span className="text-sm font-medium text-gray-800 ml-auto">{formatCurrency(total)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
