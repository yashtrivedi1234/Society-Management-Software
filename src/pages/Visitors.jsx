import { useState, useMemo, useEffect } from 'react';
import { Search, UserCheck, UserPlus, LogIn, LogOut, Clock, XCircle, Package, Car, Users, Briefcase, ShieldCheck, Trash2 } from 'lucide-react';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import {
  useGetVisitorsQuery,
  useCreateVisitorMutation,
  useUpdateVisitorStatusMutation,
  useDeleteVisitorMutation,
} from '../store/apiSlice';

const statusConfig = {
  checked_in: { label: 'Checked In', color: 'bg-emerald-100 text-emerald-700', icon: LogIn },
  checked_out: { label: 'Checked Out', color: 'bg-gray-100 text-gray-600', icon: LogOut },
  expected: { label: 'Expected', color: 'bg-blue-100 text-blue-700', icon: Clock },
  denied: { label: 'Denied', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const purposeIcons = {
  'Guest': Users,
  'Delivery': Package,
  'Cab': Car,
  'Domestic Help': Briefcase,
  'Service': ShieldCheck,
};

export default function Visitors() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', flat: '', purpose: '', contact: '', vehicle: '' });
  const { toast, showToast, clearToast } = useToast();

  // RTK Query: data is fetched & cached automatically; mutations invalidate the cache to refetch.
  const { data: records = [], error } = useGetVisitorsQuery();
  const [createVisitor] = useCreateVisitorMutation();
  const [updateVisitorStatus] = useUpdateVisitorStatusMutation();
  const [deleteVisitor] = useDeleteVisitorMutation();

  useEffect(() => {
    if (error) showToast('error', error?.data?.message || 'Failed to load visitors');
  }, [error, showToast]);

  const stats = useMemo(() => ({
    total: records.length,
    checkedIn: records.filter(v => v.status === 'checked_in').length,
    expected: records.filter(v => v.status === 'expected').length,
    checkedOut: records.filter(v => v.status === 'checked_out').length,
  }), [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(v => v.name.toLowerCase().includes(q) || v.flat.includes(q) || v.purpose.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') list = list.filter(v => v.status === statusFilter);
    return list;
  }, [search, statusFilter, records]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visitor Management</h1>
          <p className="text-sm text-gray-500 mt-1">Today's visitor log</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" />
          Pre-approve Visitor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Visitors', value: stats.total, color: 'text-gray-900', bg: 'bg-white border border-gray-100 shadow-sm' },
          { label: 'Currently In', value: stats.checkedIn, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Expected', value: stats.expected, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Checked Out', value: stats.checkedOut, color: 'text-gray-600', bg: 'bg-gray-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, flat, or purpose..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Status</option>
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* Visitor table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.map((v) => {
            const st = statusConfig[v.status] || statusConfig.expected;
            return (
              <div key={`m-${v._id || v.id}`} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{v.name}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Flat {v.flat} • {v.purpose}</p>
                <p className="text-xs text-gray-500 mt-1">In: {v.checkIn || '—'} | Out: {v.checkOut || '—'}</p>
                <div className="flex items-center gap-2 mt-3">
                  <select
                    className="text-xs border rounded px-2 py-1"
                    value={v.status}
                    onChange={async (e) => {
                      try {
                        await updateVisitorStatus({ id: v._id || v.id, status: e.target.value }).unwrap();
                        showToast('success', 'Visitor status updated');
                      } catch (err) {
                        showToast('error', err?.data?.message || 'Failed to update visitor');
                      }
                    }}
                  >
                    {Object.entries(statusConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                  </select>
                  <button onClick={() => setDeleteTarget({ id: v._id || v.id, name: v.name })} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm hidden md:table">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Visitor</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Flat</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Purpose</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Check In</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Check Out</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Vehicle</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const st = statusConfig[v.status] || statusConfig.expected;
                const PurposeIcon = purposeIcons[v.purpose] || Users;
                return (
                  <tr key={v._id || v.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <PurposeIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{v.name}</p>
                          {v.preApproved && (
                            <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">Pre-approved</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-700">{v.flat}</td>
                    <td className="py-3 px-4 text-gray-600">{v.purpose}</td>
                    <td className="py-3 px-4 text-gray-600">{v.checkIn || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{v.checkOut || '—'}</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-xs">{v.vehicle || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <select
                          className="text-xs border rounded px-1.5 py-1"
                          value={v.status}
                          onChange={async (e) => {
                            try {
                              await updateVisitorStatus({ id: v._id || v.id, status: e.target.value }).unwrap();
                              showToast('success', 'Visitor status updated');
                            } catch (err) {
                              showToast('error', err?.data?.message || 'Failed to update visitor');
                            }
                          }}
                        >
                          {Object.entries(statusConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                        </select>
                        <button
                          onClick={() => setDeleteTarget({ id: v._id || v.id, name: v.name })}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                          aria-label="Delete visitor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No visitors found</p>
        </div>
      )}

      {/* Pre-approve modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Pre-approve Visitor" size="md">
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          try {
            await createVisitor({
              ...form,
              preApproved: true,
              status: 'expected',
            }).unwrap();
            setForm({ name: '', flat: '', purpose: '', contact: '', vehicle: '' });
            showToast('success', 'Visitor pre-approved');
          } catch (err) {
            showToast('error', err?.data?.message || 'Failed to create visitor');
          } finally {
            setShowModal(false);
          }
        }}>
          <div>
            <label htmlFor="visitor-name" className="block text-sm font-medium text-gray-700 mb-1">Visitor Name</label>
            <input id="visitor-name" type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Enter visitor's name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="visitor-contact" className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input id="visitor-contact" type="tel" value={form.contact} onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))} placeholder="+91 XXXXX XXXXX" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="visitor-vehicle" className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
              <input id="visitor-vehicle" type="text" value={form.vehicle} onChange={(e) => setForm((p) => ({ ...p, vehicle: e.target.value }))} placeholder="DL XX AB XXXX" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label htmlFor="visitor-purpose" className="block text-sm font-medium text-gray-700 mb-1">Purpose of Visit</label>
            <select id="visitor-purpose" value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select purpose</option>
              {['Guest', 'Delivery', 'Cab', 'Domestic Help', 'Service'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="visitor-flat" className="block text-sm font-medium text-gray-700 mb-1">Flat Number</label>
            <input id="visitor-flat" type="text" value={form.flat} onChange={(e) => setForm((p) => ({ ...p, flat: e.target.value }))} placeholder="e.g. A-101" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Pre-approve</button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Visitor" size="sm">
        <p className="text-sm text-gray-600">
          Delete visitor record for <span className="font-medium text-gray-900">{deleteTarget?.name}</span>?
        </p>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button
            type="button"
            onClick={async () => {
              const id = deleteTarget?.id;
              if (!id) return;
              try {
                await deleteVisitor(id).unwrap();
                showToast('success', 'Visitor deleted');
              } catch (err) {
                showToast('error', err?.data?.message || 'Failed to delete visitor');
              } finally {
                setDeleteTarget(null);
              }
            }}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
          >
            Delete
          </button>
        </div>
      </Modal>

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
