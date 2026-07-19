import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, IndianRupee, AlertTriangle,
  MessageCircle, ArrowUpRight, ArrowDownRight,
  CreditCard, Receipt, Bell, UserCheck,
} from 'lucide-react';
import { useManagementLists } from '../hooks/useManagementLists';
import { formatCurrency } from '../utils/formatCurrency';
import { getCurrentMonth, formatMonthYear, getMonthsList, formatDate } from '../utils/formatDate';
import { generateWhatsAppLink } from '../utils/whatsappLink';
import societyConfig from '../config/society';
import { getCategoryById } from '../data/categories';
import { getMonthlyStats, getDefaulters } from '../utils/financeDerived';

const statCardConfig = [
  {
    key: 'totalCollected', label: 'Total Collected', icon: IndianRupee,
    iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valueColor: 'text-emerald-700',
    trend: '+12%', trendUp: true,
    extra: (stats) => `${stats.collectionRate}% collected`,
  },
  {
    key: 'totalPending', label: 'Pending Amount', icon: AlertTriangle,
    iconBg: 'bg-amber-100', iconColor: 'text-amber-600', valueColor: 'text-amber-700',
    trend: '-8%', trendUp: false,
  },
  {
    key: 'totalExpenses', label: 'Total Expenses', icon: TrendingDown,
    iconBg: 'bg-blue-100', iconColor: 'text-blue-600', valueColor: 'text-blue-700',
    trend: '+5%', trendUp: true,
  },
  {
    key: 'netBalance', label: 'Net Balance', icon: TrendingUp,
    iconBg: 'bg-purple-100', iconColor: 'text-purple-600', valueColor: 'text-purple-700',
    trend: '+18%', trendUp: true,
  },
];

function StatCard({ config, value, stats }) {
  const Icon = config.icon;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-teal-100/80 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{config.label}</p>
          <p className={`text-2xl font-bold mt-1.5 ${config.valueColor}`}>{formatCurrency(value)}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {config.trend && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${config.trendUp ? (config.key === 'totalExpenses' ? 'text-red-500' : 'text-emerald-500') : 'text-emerald-500'}`}>
                {config.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {config.trend}
              </span>
            )}
            {config.extra && <span className="text-xs text-gray-400">{config.extra(stats)}</span>}
          </div>
        </div>
        <div className={`${config.iconBg} p-3 rounded-xl`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
      </div>
    </div>
  );
}

function CSSBarChart({ data }) {
  const maxVal = Math.max(...data.flatMap(d => [d.Collected, d.Expenses]), 1);
  return (
    <div className="flex items-end justify-between gap-3 h-[250px] pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <div className="flex items-end gap-1 w-full justify-center flex-1">
            <div className="relative group flex-1 max-w-[28px]">
              <div
                className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 min-h-[2px]"
                style={{ height: `${(d.Collected / maxVal) * 200}px` }}
              />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                {formatCurrency(d.Collected)}
              </div>
            </div>
            <div className="relative group flex-1 max-w-[28px]">
              <div
                className="w-full bg-gradient-to-t from-red-500 to-red-300 rounded-t-md transition-all duration-500 min-h-[2px]"
                style={{ height: `${(d.Expenses / maxVal) * 200}px` }}
              />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                {formatCurrency(d.Expenses)}
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-500 mt-1 font-medium">{d.name}</span>
        </div>
      ))}
    </div>
  );
}

function CSSDonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const segments = useMemo(() => {
    if (total === 0) return [];
    const sorted = [...data].sort((a, b) => b.value - a.value);
    let start = 0;
    return sorted.map((d) => {
      const percent = (d.value / total) * 100;
      const segment = { ...d, start, percent };
      start += percent;
      return segment;
    });
  }, [data, total]);

  if (total === 0) return <div className="h-[250px] flex items-center justify-center text-gray-400">No data</div>;

  const gradientParts = segments.map(s => `${s.color} ${s.start}% ${s.start + s.percent}%`).join(', ');

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-[220px] h-[220px]">
        <div
          className="w-full h-full rounded-full shadow-inner border border-gray-100"
          style={{ background: `conic-gradient(${gradientParts})` }}
        />
        <div className="absolute inset-[29%] bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900 leading-tight">{formatCurrency(total)}</p>
            <p className="text-xs text-gray-500">Total Spent</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{segments.length} categories</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-[520px]">
        {segments.map((d, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-gray-700 font-medium truncate">{d.name}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-700 font-semibold">{formatCurrency(d.value)}</p>
              <p className="text-[11px] text-gray-400">{Math.round(d.percent)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const quickActions = [
  { label: 'Collect Payment', icon: CreditCard, path: '/maintenance', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
  { label: 'Add Expense', icon: Receipt, path: '/expenses', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
  { label: 'Send Reminder', icon: Bell, path: '/payments', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
  { label: 'View Visitors', icon: UserCheck, path: '/visitors', color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
];

export default function Dashboard() {
  const { expenses, payments, members } = useManagementLists();
  const navigate = useNavigate();
  const currentMonth = getCurrentMonth();
  const stats = useMemo(
    () => getMonthlyStats(payments, expenses, currentMonth),
    [payments, expenses, currentMonth]
  );

  const barChartData = useMemo(() => {
    return getMonthsList(6).reverse().map((m) => {
      const s = getMonthlyStats(payments, expenses, m);
      const [, mo] = m.split('-');
      const [y] = m.split('-');
      const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleString('en-IN', { month: 'short' });
      return { name: label, Collected: s.totalCollected, Expenses: s.totalExpenses };
    });
  }, [payments, expenses]);

  const pieChartData = useMemo(() => {
    const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
    const grouped = {};
    for (const e of monthExpenses) {
      const cat = getCategoryById(e.category);
      const key = `${cat.label}__${cat.color}`;
      grouped[key] = (grouped[key] || 0) + e.amount;
    }
    return Object.entries(grouped).map(([key, amount]) => {
      const [name, color] = key.split('__');
      return { name, value: amount, color };
    });
  }, [expenses, currentMonth]);

  const recentActivity = useMemo(() => {
    const paid = payments
      .filter((p) => (p.status === 'paid' || p.status === 'partial') && p.paidDate)
      .map((p) => ({ type: 'payment', description: `${p.memberName} - Flat ${p.flatNumber}`, amount: p.paidAmount, date: p.paidDate }));
    const exp = expenses.map((e) => ({ type: 'expense', description: e.description, amount: e.amount, date: e.date }));
    return [...paid, ...exp].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  }, [payments, expenses]);

  const defaulters = useMemo(
    () => getDefaulters(payments, members, currentMonth),
    [payments, members, currentMonth]
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-teal-950 tracking-tight">Dashboard</h1>
          <p className="text-sm text-teal-800/55 mt-0.5">{formatMonthYear(currentMonth)} Overview — {societyConfig.name}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCardConfig.map((cfg) => (
          <StatCard key={cfg.key} config={cfg} value={stats[cfg.key]} stats={stats} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${action.color}`}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Collection vs Expenses</h2>
          <div className="flex gap-4 mb-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Collected
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm bg-red-400" /> Expenses
            </div>
          </div>
          <CSSBarChart data={barChartData} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Expense Breakdown</h2>
          <CSSDonutChart data={pieChartData} />
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${item.type === 'payment' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    {item.type === 'payment'
                      ? <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{item.description}</p>
                    <p className="text-xs text-gray-400">{formatDate(item.date)}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${item.type === 'payment' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {item.type === 'payment' ? '+' : '-'}{formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Defaulters</h2>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">{defaulters.length} pending</span>
          </div>
          <div className="space-y-3 max-h-[360px] overflow-y-auto">
            {defaulters.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No defaulters this month!</p>
            ) : (
              defaulters.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{d.flatNumber}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{d.memberName}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${d.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{d.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{formatCurrency(d.totalDue)}</span>
                    {d.phone && (
                      <a
                        href={generateWhatsAppLink(d.phone, societyConfig.whatsappTemplate(d.memberName, d.totalDue, formatMonthYear(d.month), d.flatNumber, societyConfig.upiId))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full bg-green-50 hover:bg-green-100 transition-colors"
                        title="Send WhatsApp reminder"
                      >
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
