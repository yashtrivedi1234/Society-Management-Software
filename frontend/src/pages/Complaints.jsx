import { useState, useMemo, useEffect } from 'react';
import { Search, MessageSquareWarning, Clock, CheckCircle2, AlertCircle, CircleDot, Plus, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/formatDate';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import {
  useGetComplaintsQuery,
  useCreateComplaintMutation,
  useUpdateComplaintStatusMutation,
  useDeleteComplaintMutation,
} from '../store/apiSlice';

const statusConfig = {
  open: { label: 'Open', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600', icon: CircleDot },
};

const priorityConfig = {
  high: { label: 'High', color: 'bg-red-50 text-red-600 border border-red-200' },
  medium: { label: 'Medium', color: 'bg-amber-50 text-amber-600 border border-amber-200' },
  low: { label: 'Low', color: 'bg-blue-50 text-blue-600 border border-blue-200' },
};

export default function Complaints() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ flat: '', subject: '', category: '', priority: 'medium', description: '' });
  const { toast, showToast, clearToast } = useToast();
  const { user } = useAuth();

  // RTK Query: data is fetched & cached automatically; mutations invalidate the cache to refetch.
  const { data: records = [], isLoading, error } = useGetComplaintsQuery();
  const [createComplaint] = useCreateComplaintMutation();
  const [updateComplaintStatus] = useUpdateComplaintStatusMutation();
  const [deleteComplaint] = useDeleteComplaintMutation();

  useEffect(() => {
    if (error) showToast('error', error?.data?.message || 'Failed to load complaints');
  }, [error, showToast]);

  const stats = useMemo(() => ({
    total: records.length,
    open: records.filter(c => c.status === 'open').length,
    inProgress: records.filter(c => c.status === 'in_progress').length,
    resolved: records.filter(c => c.status === 'resolved' || c.status === 'closed').length,
  }), [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.subject.toLowerCase().includes(q) || c.flat.includes(q) || c.residentName.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    if (priorityFilter !== 'all') list = list.filter(c => c.priority === priorityFilter);
    return list;
  }, [search, statusFilter, priorityFilter, records]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complaints & Helpdesk</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage resident complaints</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Raise Complaint
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Complaints', value: stats.total, color: 'text-gray-900', bg: 'bg-white' },
          { label: 'Open', value: stats.open, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Resolved', value: stats.resolved, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 ${s.bg === 'bg-white' ? 'shadow-sm border border-gray-100' : ''}`}>
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
            placeholder="Search by subject, flat, or resident..."
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
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Priority</option>
          {Object.entries(priorityConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* Complaints list */}
      <div className="md:hidden space-y-3">
        {filtered.map((c) => {
          const st = statusConfig[c.status] || statusConfig.open;
          const pr = priorityConfig[c.priority] || priorityConfig.medium;
          const complaintId = c._id || c.id;
          return (
            <div key={`m-${complaintId}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">{c.subject}</p>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Flat {c.flat} • {c.residentName}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
              <span className={`inline-flex mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${pr.color}`}>{pr.label}</span>
              <div className="flex items-center gap-2 mt-3">
                <select
                  className="text-xs border rounded-md px-2 py-1"
                  value={c.status}
                  onChange={async (e) => {
                    try {
                      await updateComplaintStatus({ id: complaintId, status: e.target.value }).unwrap();
                      showToast('success', 'Complaint status updated');
                    } catch (err) {
                      showToast('error', err?.data?.message || 'Failed to update status');
                    }
                  }}
                >
                  {Object.entries(statusConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                </select>
                <button onClick={() => setDeleteTarget({ id: complaintId, subject: c.subject })} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded">
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-3">
        <div className="hidden md:block space-y-3">
        {filtered.map((c) => {
          const st = statusConfig[c.status] || statusConfig.open;
          const pr = priorityConfig[c.priority] || priorityConfig.medium;
          const StIcon = st.icon;
          const complaintId = c._id || c.id;
          return (
            <div key={complaintId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-xs font-mono text-gray-400">{c.id || complaintId}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                      <StIcon className="w-3 h-3" /> {st.label}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${pr.color}`}>
                      {pr.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{c.subject}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">{c.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 flex-wrap">
                    <span>Flat: <span className="font-medium text-gray-600">{c.flat}</span></span>
                    <span>By: <span className="font-medium text-gray-600">{c.residentName}</span></span>
                    <span>Category: <span className="font-medium text-gray-600">{c.category}</span></span>
                    <span>Assigned: <span className="font-medium text-gray-600">{c.assignedTo}</span></span>
                    <span>Filed: <span className="font-medium text-gray-600">{formatDate(c.date)}</span></span>
                    {c.resolvedDate && <span>Resolved: <span className="font-medium text-emerald-600">{formatDate(c.resolvedDate)}</span></span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <select
                    className="text-xs border rounded-md px-2 py-1"
                    value={c.status}
                    onChange={async (e) => {
                      try {
                        await updateComplaintStatus({ id: complaintId, status: e.target.value }).unwrap();
                        showToast('success', 'Complaint status updated');
                      } catch (err) {
                        showToast('error', err?.data?.message || 'Failed to update status');
                      }
                    }}
                  >
                    {Object.entries(statusConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                  </select>
                  <button
                    onClick={() => setDeleteTarget({ id: complaintId, subject: c.subject })}
                    className="inline-flex items-center justify-center p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                    aria-label="Delete complaint"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-gray-400">Loading complaints…</div>
      )}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <MessageSquareWarning className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No complaints found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}

      {/* Raise complaint modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Raise a Complaint" size="md">
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const payload = {
            flat: (form.flat || user?.flatNumber || '').trim(),
            residentName: user?.name || 'Resident',
            subject: form.subject,
            category: form.category,
            priority: form.priority,
            description: form.description,
          };
          if (!payload.flat) {
            showToast('error', 'Please enter the flat number');
            return;
          }
          createComplaint(payload)
            .unwrap()
            .then(() => {
              setForm({ flat: '', subject: '', category: '', priority: 'medium', description: '' });
              showToast('success', 'Complaint created');
            })
            .catch((err) => showToast('error', err?.data?.message || 'Failed to create complaint'))
            .finally(() => setShowModal(false));
        }}>
          <div>
            <label htmlFor="complaint-flat" className="block text-sm font-medium text-gray-700 mb-1">Flat Number</label>
            <input id="complaint-flat" type="text" value={form.flat} onChange={(e) => setForm((p) => ({ ...p, flat: e.target.value }))} placeholder="e.g. A-101" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label htmlFor="complaint-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input id="complaint-subject" type="text" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Brief description of the issue" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label htmlFor="complaint-category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select id="complaint-category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select category</option>
              {['Plumbing', 'Electrical', 'Elevator', 'Security', 'Parking', 'Noise', 'Housekeeping', 'Civil', 'Amenities', 'Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="complaint-priority-low" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <div className="flex gap-3">
              {['low', 'medium', 'high'].map(p => (
                <label key={p} className="flex items-center gap-1.5 text-sm">
                  <input id={`complaint-priority-${p}`} type="radio" name="priority" value={p} checked={form.priority === p} onChange={(e) => setForm((q) => ({ ...q, priority: e.target.value }))} className="text-blue-600" />
                  <span className="capitalize">{p}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="complaint-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="complaint-description" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Provide detailed description of the issue..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Submit Complaint</button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Complaint" size="sm">
        <p className="text-sm text-gray-600">
          Delete complaint <span className="font-medium text-gray-900">{deleteTarget?.subject}</span>?
        </p>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button
            type="button"
            onClick={() => {
              const id = deleteTarget?.id;
              if (!id) return;
              deleteComplaint(id)
                .unwrap()
                .then(() => showToast('success', 'Complaint deleted'))
                .catch((err) => showToast('error', err?.data?.message || 'Failed to delete complaint'))
                .finally(() => setDeleteTarget(null));
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
