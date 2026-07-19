import { useState, useMemo } from 'react';
import {
  Home, Wallet, AlertCircle, CheckCircle2, Clock, Plus, MessageSquareWarning, Receipt,
  Bell, FileText, UserCheck, Download, Pin, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { isLiveMode } from '../config/appMode';
import societyConfig from '../config/society';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, formatMonthYear, getCurrentMonth } from '../utils/formatDate';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import {
  useGetMySummaryQuery, useGetMyPaymentsQuery, useGetMyComplaintsQuery, useCreateMyComplaintMutation,
  useGetMyNoticesQuery, useGetMyDocumentsQuery, useGetMyVisitorsQuery, usePreApproveVisitorMutation,
} from '../store/apiSlice';

const statusStyles = {
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  partial: { label: 'Partial', color: 'bg-amber-100 text-amber-700', icon: Clock },
  unpaid: { label: 'Unpaid', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const complaintStatusStyles = {
  open: { label: 'Open', color: 'bg-red-100 text-red-700' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600' },
};

// In demo mode there is no authenticated flat link, so we treat the first resident as "me".
function deriveDemoView(members, payments) {
  const me = members[0];
  if (!me) return { summary: null, payments: [] };
  const myPayments = payments.filter((p) => p.flatNumber === me.flatNumber);
  const month = getCurrentMonth();
  const current = myPayments.find((p) => p.month === month) || null;
  const totalOutstanding = myPayments
    .filter((p) => p.status !== 'paid')
    .reduce((s, p) => s + Math.max((p.totalDue || 0) - (p.paidAmount || 0), 0), 0);
  return {
    summary: {
      flatNumber: me.flatNumber,
      member: { name: me.name, phone: me.phone, email: me.email, isOwner: me.isOwner, familyMembers: me.familyMembers },
      month,
      currentDue: current && {
        month: current.month,
        totalDue: current.totalDue,
        paidAmount: current.paidAmount,
        pendingAmount: Math.max((current.totalDue || 0) - (current.paidAmount || 0), 0),
        status: current.status,
      },
      totalOutstanding,
      openComplaints: 0,
    },
    payments: myPayments,
  };
}

export default function MyFlat() {
  const { user } = useAuth();
  const { members, payments } = useData();
  const { toast, showToast, clearToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject: '', category: '', priority: 'medium', description: '' });

  const live = isLiveMode;
  const { data: summaryLive, isLoading: l1, error: e1 } = useGetMySummaryQuery(undefined, { skip: !live });
  const { data: paymentsLive = [], isLoading: l2 } = useGetMyPaymentsQuery(undefined, { skip: !live });
  const { data: complaintsLive = [], isLoading: l3 } = useGetMyComplaintsQuery(undefined, { skip: !live });
  const [createMyComplaint] = useCreateMyComplaintMutation();
  const { data: notices = [] } = useGetMyNoticesQuery(undefined, { skip: !live });
  const { data: documents = [] } = useGetMyDocumentsQuery(undefined, { skip: !live });
  const { data: visitors = [] } = useGetMyVisitorsQuery(undefined, { skip: !live });
  const [preApproveVisitor] = usePreApproveVisitorMutation();

  const demoView = useMemo(() => (live ? null : deriveDemoView(members, payments)), [live, members, payments]);
  const [demoComplaints, setDemoComplaints] = useState([]);

  // Pay Now (UPI) + visitor pre-approval modal state
  const [showPay, setShowPay] = useState(false);
  const [showVisitor, setShowVisitor] = useState(false);
  const [visitorForm, setVisitorForm] = useState({ name: '', purpose: '', contact: '', vehicle: '' });
  const [lastGatePass, setLastGatePass] = useState('');

  const summary = live ? summaryLive : demoView?.summary;
  const myPayments = live ? paymentsLive : (demoView?.payments || []);
  const myComplaints = live ? complaintsLive : demoComplaints;
  const loading = live ? (l1 || l2 || l3) : false;
  const error = live ? (e1?.data?.message || '') : '';

  const cards = useMemo(() => {
    const due = summary?.currentDue;
    return [
      {
        label: 'This Month',
        value: due ? formatCurrency(due.pendingAmount) : formatCurrency(0),
        sub: due ? statusStyles[due.status]?.label : 'No dues',
        icon: Wallet,
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        tone: due && due.pendingAmount > 0 ? 'text-red-600' : 'text-emerald-600',
      },
      {
        label: 'Total Outstanding',
        value: formatCurrency(summary?.totalOutstanding || 0),
        sub: 'Across all months',
        icon: Receipt,
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-600',
        tone: (summary?.totalOutstanding || 0) > 0 ? 'text-amber-600' : 'text-emerald-600',
      },
      {
        label: 'Open Complaints',
        value: String(summary?.openComplaints ?? myComplaints.filter((c) => c.status === 'open' || c.status === 'in_progress').length),
        sub: 'Awaiting resolution',
        icon: MessageSquareWarning,
        iconBg: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
        tone: 'text-gray-900',
      },
    ];
  }, [summary, myComplaints]);

  const submitComplaint = async (e) => {
    e.preventDefault();
    const payload = { subject: form.subject, category: form.category, priority: form.priority, description: form.description };
    const reset = () => {
      setForm({ subject: '', category: '', priority: 'medium', description: '' });
      setShowModal(false);
    };
    if (!live) {
      setDemoComplaints((prev) => [
        { id: `demo-c-${Date.now()}`, ...payload, flat: summary?.flatNumber, status: 'open', date: getCurrentMonth() },
        ...prev,
      ]);
      showToast('success', 'Complaint raised (demo)');
      reset();
      return;
    }
    try {
      await createMyComplaint(payload).unwrap();
      showToast('success', 'Complaint raised');
    } catch (err) {
      showToast('error', err?.data?.message || 'Failed to raise complaint');
    } finally {
      reset();
    }
  };

  // ---- Pay Now (UPI deep link, no payment gateway needed) ----
  const payAmount = summary?.currentDue?.pendingAmount || summary?.totalOutstanding || 0;
  const upiLink = `upi://pay?pa=${encodeURIComponent(societyConfig.upiId || '')}&pn=${encodeURIComponent(societyConfig.name || '')}&am=${payAmount}&cu=INR&tn=${encodeURIComponent(`Maintenance ${summary?.flatNumber || ''}`)}`;
  const upiQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;

  // ---- Download a payment receipt as PDF ----
  const downloadReceipt = (p) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(societyConfig.name || 'Society', 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(90);
    doc.text('Maintenance Payment Receipt', 14, 26);
    autoTable(doc, {
      startY: 34,
      theme: 'grid',
      body: [
        ['Flat', summary?.flatNumber || '-'],
        ['Resident', user?.name || summary?.member?.name || '-'],
        ['Month', formatMonthYear(p.month)],
        ['Amount Due', formatCurrency(p.totalDue)],
        ['Amount Paid', formatCurrency(p.paidAmount)],
        ['Status', statusStyles[p.status]?.label || p.status],
        ['Paid On', p.paidDate ? formatDate(p.paidDate) : '-'],
        ['Payment Mode', p.paymentMode || '-'],
        ['Reference', p.transactionRef || '-'],
      ],
    });
    doc.save(`receipt-${summary?.flatNumber || 'flat'}-${p.month}.pdf`);
  };

  // ---- Pre-approve a visitor ----
  const handlePreApprove = async (e) => {
    e.preventDefault();
    if (!visitorForm.name.trim() || !visitorForm.purpose.trim()) {
      showToast('error', 'Name and purpose are required');
      return;
    }
    if (!live) {
      const code = `GP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      setLastGatePass(code);
      setVisitorForm({ name: '', purpose: '', contact: '', vehicle: '' });
      showToast('success', 'Guest pre-approved (demo)');
      return;
    }
    try {
      const res = await preApproveVisitor(visitorForm).unwrap();
      setLastGatePass(res?.gatePass || '');
      setVisitorForm({ name: '', purpose: '', contact: '', vehicle: '' });
      showToast('success', 'Guest pre-approved');
    } catch (err) {
      showToast('error', err?.data?.message || 'Failed to pre-approve guest');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading your flat details…</div>;
  }
  if (error) {
    return <div className="py-12 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-blue-100 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold leading-tight">{user?.name || 'Resident'}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm">
                <Home className="w-3.5 h-3.5" /> Flat {summary?.flatNumber || '-'}
              </span>
              {summary?.member?.isOwner !== undefined && (
                <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium">
                  {summary.member.isOwner ? 'Owner' : 'Tenant'}
                </span>
              )}
              {summary?.member?.familyMembers != null && (
                <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium">
                  {summary.member.familyMembers} family members
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 text-sm font-semibold rounded-lg transition-colors shadow-sm self-start"
          >
            <Plus className="w-4 h-4" /> Raise Complaint
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.iconBg}`}>
                  <Icon className={`w-5 h-5 ${c.iconColor}`} />
                </div>
                <p className="text-sm text-gray-500 font-medium">{c.label}</p>
              </div>
              <p className={`text-2xl font-bold mt-3 ${c.tone}`}>{c.value}</p>
              <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Current dues call-to-action */}
      {summary?.currentDue && summary.currentDue.pendingAmount > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-900">
              {formatCurrency(summary.currentDue.pendingAmount)} due for {formatMonthYear(summary.currentDue.month)}
            </p>
            <p className="text-xs text-blue-700 mt-0.5">Pay before the due date to avoid late fees.</p>
          </div>
          <button
            onClick={() => setShowPay(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
          >
            <Wallet className="w-4 h-4" /> Pay Now
          </button>
        </div>
      )}

      {/* Payment history */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">My Payment History</h2>
        </div>
        {myPayments.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Receipt className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">No payment records yet</p>
            <p className="text-xs text-gray-400 mt-1">Your maintenance bills will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider bg-gray-50/60 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Month</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3 font-medium">Paid</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Paid On</th>
                  <th className="px-5 py-3 font-medium">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {myPayments.map((p) => {
                  const st = statusStyles[p.status] || statusStyles.unpaid;
                  return (
                    <tr key={p._id || p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">{formatMonthYear(p.month)}</td>
                      <td className="px-5 py-3 text-gray-600">{formatCurrency(p.totalDue)}</td>
                      <td className="px-5 py-3 text-gray-600">{formatCurrency(p.paidAmount)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{p.paidDate ? formatDate(p.paidDate) : '-'}</td>
                      <td className="px-5 py-3">
                        {(p.status === 'paid' || p.status === 'partial') ? (
                          <button
                            onClick={() => downloadReceipt(p)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My complaints */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">My Complaints</h2>
        </div>
        {myComplaints.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <MessageSquareWarning className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">No complaints raised yet</p>
            <p className="text-xs text-gray-400 mt-1">Use “Raise Complaint” to report an issue.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {myComplaints.map((c) => {
              const cs = complaintStatusStyles[c.status] || complaintStatusStyles.open;
              return (
                <li key={c._id || c.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{c.subject}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
                        {c.category && <span className="capitalize">{c.category}</span>}
                        {c.priority && <span className="capitalize">• {c.priority} priority</span>}
                        {c.date && <span>• {formatDate(c.date)}</span>}
                      </div>
                    </div>
                    <span className={`inline-flex shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${cs.color}`}>{cs.label}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* My Visitors */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><UserCheck className="w-4 h-4 text-blue-600" /> My Visitors</h2>
          <button onClick={() => { setLastGatePass(''); setShowVisitor(true); }} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800">
            <Plus className="w-3.5 h-3.5" /> Pre-approve Guest
          </button>
        </div>
        {visitors.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <UserCheck className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">No visitors yet</p>
            <p className="text-xs text-gray-400 mt-1">Pre-approve a guest to generate a gate pass.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {visitors.map((v) => (
              <li key={v._id || v.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{v.name}</p>
                  <p className="text-xs text-gray-500">{v.purpose}{v.vehicle ? ` • ${v.vehicle}` : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  {v.gatePass && <p className="text-xs font-mono font-semibold text-blue-700">{v.gatePass}</p>}
                  <span className="text-xs text-gray-400 capitalize">{(v.status || 'expected').replace('_', ' ')}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Notices + Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Bell className="w-4 h-4 text-amber-600" /> Latest Notices</h2>
          </div>
          {notices.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No notices</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {notices.slice(0, 5).map((n) => (
                <li key={n._id || n.id} className="px-5 py-3">
                  <div className="flex items-start gap-2">
                    {n.pinned && <Pin className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.description}</p>
                      {n.date && <p className="text-xs text-gray-400 mt-1">{formatDate(n.date)}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" /> Documents</h2>
          </div>
          {documents.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No documents shared</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {documents.map((d) => (
                <li key={d._id || d.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{d.title}</p>
                    {d.category && <p className="text-xs text-gray-400 capitalize">{d.category}</p>}
                  </div>
                  {d.url && (
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 shrink-0">
                      View <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Raise complaint modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Raise a Complaint" size="md">
        <form className="space-y-4" onSubmit={submitComplaint}>
          <div>
            <label htmlFor="my-complaint-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input id="my-complaint-subject" type="text" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Brief description of the issue" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label htmlFor="my-complaint-category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select id="my-complaint-category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select category</option>
              {['Plumbing', 'Electrical', 'Elevator', 'Security', 'Parking', 'Noise', 'Housekeeping', 'Civil', 'Amenities', 'Other'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <div className="flex gap-3">
              {['low', 'medium', 'high'].map((p) => (
                <label key={p} className="flex items-center gap-1.5 text-sm">
                  <input type="radio" name="my-priority" value={p} checked={form.priority === p} onChange={(e) => setForm((q) => ({ ...q, priority: e.target.value }))} className="text-blue-600" />
                  <span className="capitalize">{p}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="my-complaint-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="my-complaint-description" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Provide detailed description…" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Submit Complaint</button>
          </div>
        </form>
      </Modal>

      {/* Pay Now (UPI) modal */}
      <Modal isOpen={showPay} onClose={() => setShowPay(false)} title="Pay Maintenance" size="sm">
        <div className="space-y-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Amount to pay</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(payAmount)}</p>
          </div>
          {societyConfig.upiId ? (
            <>
              <img src={upiQr} alt="UPI QR code" className="mx-auto w-44 h-44 rounded-lg border border-gray-100" />
              <p className="text-xs text-gray-500">Scan with any UPI app, or</p>
              <a
                href={upiLink}
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
              >
                <Wallet className="w-4 h-4" /> Pay via UPI app
              </a>
              <div className="text-left bg-gray-50 rounded-lg p-3 text-sm">
                <p className="flex justify-between"><span className="text-gray-500">UPI ID</span><span className="font-medium text-gray-800">{societyConfig.upiId}</span></p>
                <p className="flex justify-between mt-1"><span className="text-gray-500">Account</span><span className="font-medium text-gray-800">{societyConfig.accountNumber}</span></p>
                <p className="flex justify-between mt-1"><span className="text-gray-500">IFSC</span><span className="font-medium text-gray-800">{societyConfig.ifscCode}</span></p>
              </div>
              <p className="text-[11px] text-gray-400">After paying, your records update once the office confirms the transaction.</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Online payment is not configured yet. Please contact the society office.</p>
          )}
        </div>
      </Modal>

      {/* Pre-approve visitor modal */}
      <Modal isOpen={showVisitor} onClose={() => setShowVisitor(false)} title="Pre-approve a Guest" size="md">
        {lastGatePass ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-600">Share this gate pass with your guest and the security gate:</p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl py-6">
              <p className="text-3xl font-bold tracking-widest font-mono text-blue-700">{lastGatePass}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setLastGatePass(''); setShowVisitor(true); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Add another</button>
              <button onClick={() => setShowVisitor(false)} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Done</button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handlePreApprove}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="visitor-name" className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                <input id="visitor-name" type="text" value={visitorForm.name} onChange={(e) => setVisitorForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label htmlFor="visitor-purpose" className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <input id="visitor-purpose" type="text" value={visitorForm.purpose} onChange={(e) => setVisitorForm((p) => ({ ...p, purpose: e.target.value }))} placeholder="e.g. Guest, Delivery" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label htmlFor="visitor-contact" className="block text-sm font-medium text-gray-700 mb-1">Contact (optional)</label>
                <input id="visitor-contact" type="tel" value={visitorForm.contact} onChange={(e) => setVisitorForm((p) => ({ ...p, contact: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="visitor-vehicle" className="block text-sm font-medium text-gray-700 mb-1">Vehicle (optional)</label>
                <input id="visitor-vehicle" type="text" value={visitorForm.vehicle} onChange={(e) => setVisitorForm((p) => ({ ...p, vehicle: e.target.value }))} placeholder="e.g. DL10AB1234" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowVisitor(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Generate Gate Pass</button>
            </div>
          </form>
        )}
      </Modal>

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
