import { useState } from 'react';
import { BadgeDollarSign, ChartPie, Landmark, ShieldCheck } from 'lucide-react';
import Toast from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import {
  useGetBudgetsQuery,
  useGetBudgetVarianceQuery,
  useGetReconciliationQuery,
  useGetComplianceSummaryQuery,
  useCreateBudgetMutation,
  useCreateReconciliationMutation,
  useAutoMatchReconciliationMutation,
} from '../store/apiSlice';
import { formatCurrency } from '../utils/formatCurrency';
import { isPositiveAmount } from '../utils/validation';

export default function FinanceCompliance() {
  const { toast, showToast, clearToast } = useToast();
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const start = currentYear - 2 + i;
    return `${start}-${start + 1}`;
  });
  const [year, setYear] = useState(yearOptions[2]);
  const [budgetForm, setBudgetForm] = useState({ category: '', budgetedAmount: '' });
  const [reconForm, setReconForm] = useState({ date: '', reference: '', amount: '', type: 'credit' });
  const [formError, setFormError] = useState('');

  // RTK Query: data is fetched & cached automatically and refetches when `year` changes.
  const { data: budgets = [] } = useGetBudgetsQuery(year);
  const { data: variance = [] } = useGetBudgetVarianceQuery(year);
  const { data: recon = [] } = useGetReconciliationQuery(year);
  const { data: summary = null } = useGetComplianceSummaryQuery({ financialYear: year });
  const [createBudget] = useCreateBudgetMutation();
  const [createReconciliation] = useCreateReconciliationMutation();
  const [autoMatch] = useAutoMatchReconciliationMutation();

  const stats = [
    { label: 'Budget Heads', value: budgets.length, icon: ChartPie, tone: 'text-blue-700 bg-blue-50' },
    { label: 'Recon Entries', value: recon.length, icon: Landmark, tone: 'text-violet-700 bg-violet-50' },
    { label: 'Overdue Cases', value: summary?.overdueCount || 0, icon: ShieldCheck, tone: 'text-red-700 bg-red-50' },
    { label: 'Collection Rate', value: `${summary?.collectionRate || 0}%`, icon: BadgeDollarSign, tone: 'text-emerald-700 bg-emerald-50' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Finance & Compliance</h1>
            <p className="text-sm text-slate-200 mt-1">Track budgets, variance and reconciliation with compliance visibility.</p>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-2 border border-white/20 bg-white/10 rounded-lg text-sm text-white placeholder:text-slate-200 focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-label="Financial year"
          >
            {yearOptions.map((option) => (
              <option key={option} value={option} className="text-gray-900">
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const StatIcon = stat.icon;
          return (
          <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.tone}`}>
              <StatIcon className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-500 mt-3">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
          );
        })}
      </div>

      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Budget Planning</h2>
          <div className="flex gap-2 mb-4">
            <input id="budget-category" aria-label="Budget category" placeholder="Category" value={budgetForm.category} onChange={(e) => setBudgetForm((p) => ({ ...p, category: e.target.value }))} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input id="budget-amount" aria-label="Budget amount" placeholder="Amount" type="number" value={budgetForm.budgetedAmount} onChange={(e) => setBudgetForm((p) => ({ ...p, budgetedAmount: e.target.value }))} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
              onClick={async () => {
                if (!budgetForm.category.trim() || !isPositiveAmount(budgetForm.budgetedAmount)) {
                  setFormError('Budget category and positive amount are required');
                  return;
                }
                try {
                  await createBudget({ financialYear: year, category: budgetForm.category, budgetedAmount: Number(budgetForm.budgetedAmount) }).unwrap();
                  setBudgetForm({ category: '', budgetedAmount: '' });
                  setFormError('');
                } catch (err) { showToast('error', err?.data?.message || 'Failed to save budget'); }
              }}
            >Save</button>
          </div>
          <ul className="space-y-2 max-h-48 overflow-auto pr-1">
            {budgets.map((item) => (
              <li key={item._id} className="flex justify-between items-center px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/70">
                <span className="text-sm font-medium text-gray-800">{item.category}</span>
                <span className="text-sm text-gray-700">{formatCurrency(item.budgetedAmount)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Budget vs Actual</h2>
          <ul className="space-y-2 max-h-60 overflow-auto pr-1">
            {variance.map((item) => (
              <li key={item.category} className="flex justify-between items-center px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/70">
                <span className="text-sm font-medium text-gray-800">{item.category}</span>
                <span className={`text-sm ${item.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(item.actualAmount)} / {formatCurrency(item.budgetedAmount)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Bank Reconciliation</h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <input id="recon-date" aria-label="Reconciliation date" type="date" value={reconForm.date} onChange={(e) => setReconForm((p) => ({ ...p, date: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input id="recon-reference" aria-label="Reconciliation reference" placeholder="Reference" value={reconForm.reference} onChange={(e) => setReconForm((p) => ({ ...p, reference: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input id="recon-amount" aria-label="Reconciliation amount" placeholder="Amount" type="number" value={reconForm.amount} onChange={(e) => setReconForm((p) => ({ ...p, amount: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select id="recon-type" aria-label="Reconciliation type" value={reconForm.type} onChange={(e) => setReconForm((p) => ({ ...p, type: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="credit">Credit</option><option value="debit">Debit</option></select>
          </div>
          <div className="flex gap-2 mb-4">
            <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors" onClick={async () => {
              if (!reconForm.date || !reconForm.reference.trim() || !isPositiveAmount(reconForm.amount)) {
                setFormError('Reconciliation date, reference and positive amount are required');
                return;
              }
              try {
                await createReconciliation({ ...reconForm, amount: Number(reconForm.amount) }).unwrap();
                setReconForm({ date: '', reference: '', amount: '', type: 'credit' });
                setFormError('');
              } catch (err) { showToast('error', err?.data?.message || 'Failed to add entry'); }
            }}>Add Entry</button>
            <button className="px-3 py-2 bg-gray-900 hover:bg-black text-white text-sm rounded-lg font-medium transition-colors" onClick={async () => {
              try {
                await autoMatch().unwrap();
              } catch (err) { showToast('error', err?.data?.message || 'Failed to auto match'); }
            }}>Auto Match</button>
          </div>
          <ul className="space-y-2 max-h-48 overflow-auto pr-1">
            {recon.map((item) => (
              <li key={item._id} className="flex justify-between items-center px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/70">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.reference}</p>
                  <p className="text-xs text-gray-500">{item.type}</p>
                </div>
                <span className="text-sm text-gray-700">{formatCurrency(item.amount)} - {item.status}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Compliance Snapshot</h2>
          {summary && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                <p className="text-xs text-gray-500">Month</p>
                <p className="text-sm font-semibold text-gray-800">{year}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                <p className="text-xs text-gray-500">Collection Rate</p>
                <p className="text-sm font-semibold text-gray-800">{summary.collectionRate}%</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                <p className="text-xs text-gray-500">Total Due</p>
                <p className="text-sm font-semibold text-gray-800">{formatCurrency(summary.totalDue)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                <p className="text-xs text-gray-500">Collected</p>
                <p className="text-sm font-semibold text-gray-800">{formatCurrency(summary.totalCollected)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                <p className="text-xs text-gray-500">Outstanding</p>
                <p className="text-sm font-semibold text-gray-800">{formatCurrency(summary.outstanding)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                <p className="text-xs text-gray-500">Overdue Cases</p>
                <p className="text-sm font-semibold text-red-700">{summary.overdueCount}</p>
              </div>
            </div>
          )}
        </section>
      </div>
      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
