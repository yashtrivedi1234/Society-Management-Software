import { useState, useMemo, useEffect } from 'react';
import { Search, Pin, Calendar, User, Bell, AlertTriangle, PartyPopper, Shield, Wrench, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/formatDate';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import {
  useGetNoticesQuery,
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useDeleteNoticeMutation,
} from '../store/apiSlice';

const categoryConfig = {
  general: { label: 'General', color: 'bg-blue-100 text-blue-700', icon: Bell },
  maintenance: { label: 'Maintenance', color: 'bg-amber-100 text-amber-700', icon: Wrench },
  event: { label: 'Event', color: 'bg-pink-100 text-pink-700', icon: PartyPopper },
  rules: { label: 'Rules & Policy', color: 'bg-purple-100 text-purple-700', icon: Shield },
  emergency: { label: 'Emergency', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

export default function Notices() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'general', pinned: false });
  const { toast, showToast, clearToast } = useToast();

  // RTK Query: data is fetched & cached automatically; mutations invalidate the cache to refetch.
  const { data: records = [], error } = useGetNoticesQuery();
  const [createNotice] = useCreateNoticeMutation();
  const [updateNotice] = useUpdateNoticeMutation();
  const [deleteNotice] = useDeleteNoticeMutation();

  useEffect(() => {
    if (error) showToast('error', error?.data?.message || 'Failed to load notices');
  }, [error, showToast]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(n => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q));
    }
    if (selectedCategory !== 'all') {
      list = list.filter(n => n.category === selectedCategory);
    }
    // pinned first, then by date
    list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.date.localeCompare(a.date);
    });
    return list;
  }, [search, selectedCategory, records]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notices & Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">{records.length} notices published</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
          <Bell className="w-4 h-4" />
          Post Notice
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedCategory === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </button>
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedCategory === key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notice cards */}
      <div className="space-y-4">
        {filtered.map((notice) => {
          const cat = categoryConfig[notice.category] || categoryConfig.general;
          const CatIcon = cat.icon;
          const noticeId = notice._id || notice.id;
          return (
            <div key={noticeId} className={`bg-white rounded-xl shadow-sm border ${notice.pinned ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'} p-5 hover:shadow-md transition-shadow`}>
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-lg ${cat.color.split(' ')[0]} flex-shrink-0 mt-0.5`}>
                  <CatIcon className={`w-5 h-5 ${cat.color.split(' ')[1]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {notice.pinned && (
                        <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-semibold">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>
                        {cat.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await updateNotice({ id: noticeId, payload: { pinned: !notice.pinned } }).unwrap();
                            showToast('success', notice.pinned ? 'Notice unpinned' : 'Notice pinned');
                          } catch (err) {
                            showToast('error', err?.data?.message || 'Failed to update notice');
                          }
                        }}
                        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        {notice.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: noticeId, title: notice.title })}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                        title="Delete notice"
                        aria-label="Delete notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mt-1.5">{notice.title}</h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{notice.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(notice.date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> {notice.postedBy}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No notices found</p>
          <p className="text-sm mt-1">Try adjusting your search or filter</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Post Notice" size="md">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await createNotice({
                ...form,
                date: new Date().toISOString().split('T')[0],
              }).unwrap();
              setShowModal(false);
              setForm({ title: '', description: '', category: 'general', pinned: false });
              showToast('success', 'Notice posted');
            } catch (err) {
              showToast('error', err?.data?.message || 'Failed to post notice');
            }
          }}
        >
          <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <textarea className="w-full px-3 py-2 border rounded-lg text-sm" rows={4} placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
          <select className="w-full px-3 py-2 border rounded-lg text-sm bg-white" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
            {Object.keys(categoryConfig).map((k) => <option key={k} value={k}>{categoryConfig[k].label}</option>)}
          </select>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.pinned} onChange={(e) => setForm((p) => ({ ...p, pinned: e.target.checked }))} />
            Pin this notice
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-3 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg">Post</button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Notice" size="sm">
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <span className="font-medium text-gray-900">{deleteTarget?.title}</span>?
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={() => setDeleteTarget(null)} className="px-3 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
          <button
            type="button"
            onClick={async () => {
              const targetId = deleteTarget?.id;
              if (!targetId) return;
              try {
                await deleteNotice(targetId).unwrap();
                showToast('success', 'Notice deleted');
              } catch (err) {
                showToast('error', err?.data?.message || 'Failed to delete notice');
              } finally {
                setDeleteTarget(null);
              }
            }}
            className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg"
          >
            Delete
          </button>
        </div>
      </Modal>
      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
