import { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TrendingUp, PieChart, AlertTriangle, Download, FileText } from 'lucide-react';
import { useData } from '../context/DataContext';
import societyConfig from '../config/society';
import { formatCurrency } from '../utils/formatCurrency';
import { formatMonthYear, getCurrentMonth, getMonthsList } from '../utils/formatDate';

const AGING_BUCKETS = ['0-30', '31-60', '61-90', '90+'];

function downloadCsv(filename, rows) {
  const csv = rows
    .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { members, payments, expenses } = useData();
  const [month, setMonth] = useState(getCurrentMonth());

  // ----- Collection trend (last 6 months) -----
  const trend = useMemo(() => {
    const months = getMonthsList(6).reverse(); // oldest -> newest
    return months.map((m) => {
      const mp = payments.filter((p) => p.month === m);
      const collected = mp.reduce((s, p) => s + (p.paidAmount || 0), 0);
      const due = mp.reduce((s, p) => s + (p.totalDue || p.amount || 0), 0);
      const spent = expenses.filter((e) => (e.date || '').startsWith(m)).reduce((s, e) => s + (e.amount || 0), 0);
      return { month: m, collected, due, expenses: spent, rate: due > 0 ? Math.round((collected / due) * 100) : 0 };
    });
  }, [payments, expenses]);

  const trendMax = Math.max(1, ...trend.map((t) => Math.max(t.collected, t.expenses)));

  // ----- Expense breakdown for selected month -----
  const breakdown = useMemo(() => {
    const map = new Map();
    expenses
      .filter((e) => (e.date || '').startsWith(month))
      .forEach((e) => map.set(e.category || 'other', (map.get(e.category || 'other') || 0) + (e.amount || 0)));
    const total = [...map.values()].reduce((s, v) => s + v, 0);
    const rows = [...map.entries()]
      .map(([category, amount]) => ({ category, amount, pct: total > 0 ? Math.round((amount / total) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount);
    return { rows, total };
  }, [expenses, month]);

  // ----- Defaulter aging (unpaid up to selected month) -----
  const aging = useMemo(() => {
    const [ay, am] = month.split('-').map(Number);
    const buckets = Object.fromEntries(AGING_BUCKETS.map((b) => [b, 0]));
    const rows = payments
      .filter((p) => p.month <= month && p.status !== 'paid')
      .map((p) => {
        const [py, pm] = p.month.split('-').map(Number);
        const monthsOld = (ay - py) * 12 + (am - pm);
        const days = monthsOld * 30;
        const bucket = days <= 30 ? '0-30' : days <= 60 ? '31-60' : days <= 90 ? '61-90' : '90+';
        const pending = Math.max((p.totalDue || 0) - (p.paidAmount || 0), 0);
        buckets[bucket] += pending;
        const member = members.find((m) => m.id === p.memberId || m.flatNumber === p.flatNumber);
        return { flatNumber: p.flatNumber, name: p.memberName || member?.name || 'Resident', month: p.month, pending, monthsOld, bucket };
      })
      .filter((r) => r.pending > 0)
      .sort((a, b) => b.pending - a.pending);
    const total = rows.reduce((s, r) => s + r.pending, 0);
    return { rows, buckets, total };
  }, [payments, members, month]);

  const kpis = useMemo(() => {
    const mp = payments.filter((p) => p.month === month);
    const collected = mp.reduce((s, p) => s + (p.paidAmount || 0), 0);
    const due = mp.reduce((s, p) => s + (p.totalDue || p.amount || 0), 0);
    const spent = expenses.filter((e) => (e.date || '').startsWith(month)).reduce((s, e) => s + (e.amount || 0), 0);
    return {
      collected, due, spent,
      pending: Math.max(due - collected, 0),
      rate: due > 0 ? Math.round((collected / due) * 100) : 0,
    };
  }, [payments, expenses, month]);

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${societyConfig.name} — Financial Report`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Period: ${formatMonthYear(month)}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [['Metric', 'Amount']],
      body: [
        ['Total Due', formatCurrency(kpis.due)],
        ['Total Collected', formatCurrency(kpis.collected)],
        ['Pending', formatCurrency(kpis.pending)],
        ['Total Expenses', formatCurrency(kpis.spent)],
        ['Net Balance', formatCurrency(kpis.collected - kpis.spent)],
        ['Collection Rate', `${kpis.rate}%`],
      ],
    });

    if (breakdown.rows.length) {
      autoTable(doc, {
        head: [['Expense Category', 'Amount', '%']],
        body: breakdown.rows.map((r) => [r.category, formatCurrency(r.amount), `${r.pct}%`]),
      });
    }

    if (aging.rows.length) {
      autoTable(doc, {
        head: [['Flat', 'Resident', 'Month', 'Pending', 'Bucket (days)']],
        body: aging.rows.map((r) => [r.flatNumber, r.name, formatMonthYear(r.month), formatCurrency(r.pending), r.bucket]),
      });
    }

    doc.save(`report-${month}.pdf`);
  };

  const exportCsv = () => {
    const rows = [
      ['Defaulter Report', formatMonthYear(month)],
      [],
      ['Flat', 'Resident', 'Month', 'Pending', 'Months Overdue', 'Bucket'],
      ...aging.rows.map((r) => [r.flatNumber, r.name, r.month, r.pending, r.monthsOld, r.bucket]),
    ];
    downloadCsv(`defaulters-${month}.csv`, rows);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports &amp; Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Collection trends, expense breakdown and defaulter aging</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={exportPdf} className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Collected', value: formatCurrency(kpis.collected), tone: 'text-emerald-600' },
          { label: 'Pending', value: formatCurrency(kpis.pending), tone: 'text-red-600' },
          { label: 'Expenses', value: formatCurrency(kpis.spent), tone: 'text-amber-600' },
          { label: 'Collection Rate', value: `${kpis.rate}%`, tone: 'text-blue-600' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${k.tone}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Collection trend chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">Collection vs Expenses (last 6 months)</h2>
        </div>
        <div className="flex items-end justify-between gap-3 h-48">
          {trend.map((t) => (
            <div key={t.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center gap-1 h-40">
                <div
                  className="w-1/2 max-w-[24px] bg-emerald-400 rounded-t"
                  style={{ height: `${(t.collected / trendMax) * 100}%` }}
                  title={`Collected ${formatCurrency(t.collected)}`}
                />
                <div
                  className="w-1/2 max-w-[24px] bg-amber-400 rounded-t"
                  style={{ height: `${(t.expenses / trendMax) * 100}%` }}
                  title={`Expenses ${formatCurrency(t.expenses)}`}
                />
              </div>
              <span className="text-[10px] text-gray-400">{formatMonthYear(t.month).slice(0, 3)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400" /> Collected</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400" /> Expenses</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-gray-900">Expense Breakdown — {formatMonthYear(month)}</h2>
          </div>
          {breakdown.rows.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No expenses recorded this month</p>
          ) : (
            <div className="space-y-3">
              {breakdown.rows.map((r) => (
                <div key={r.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize text-gray-700">{r.category}</span>
                    <span className="text-gray-500">{formatCurrency(r.amount)} · {r.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Defaulter aging */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-semibold text-gray-900">Defaulter Aging</h2>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {AGING_BUCKETS.map((b) => (
              <div key={b} className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-400">{b} days</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatCurrency(aging.buckets[b])}</p>
              </div>
            ))}
          </div>
          {aging.rows.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No outstanding dues 🎉</p>
          ) : (
            <div className="overflow-x-auto max-h-56 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                    <th className="py-2 font-medium">Flat</th>
                    <th className="py-2 font-medium">Resident</th>
                    <th className="py-2 font-medium text-right">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {aging.rows.map((r) => (
                    <tr key={`${r.flatNumber}-${r.month}`} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 font-medium text-gray-700">{r.flatNumber}</td>
                      <td className="py-2 text-gray-600">{r.name}</td>
                      <td className="py-2 text-right text-red-600 font-medium">{formatCurrency(r.pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Total Outstanding</span>
            <span className="text-sm font-bold text-red-600">{formatCurrency(aging.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
