import { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, IndianRupee, Users, MapPin, CheckCircle2, XCircle, AlertCircle, Plus, Dumbbell, Waves, Home, Gamepad2, BedDouble } from 'lucide-react';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import {
  useGetFacilitiesQuery,
  useGetFacilityBookingsQuery,
  useCreateFacilityBookingMutation,
  useUpdateFacilityBookingStatusMutation,
} from '../store/apiSlice';

const bookingStatusConfig = {
  confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const iconByType = {
  hall: Home,
  pool: Waves,
  gym: Dumbbell,
  sport: Gamepad2,
  room: BedDouble,
  general: Home,
};

const colorByType = {
  hall: 'bg-blue-50 text-blue-600 border-blue-200',
  pool: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  gym: 'bg-orange-50 text-orange-600 border-orange-200',
  sport: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  room: 'bg-purple-50 text-purple-600 border-purple-200',
  general: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function Facilities() {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('facilities');
  const [form, setForm] = useState({
    facilityId: '',
    date: '',
    timeSlot: '',
    purpose: '',
    flat: '',
    residentName: '',
  });
  const { toast, showToast, clearToast } = useToast();

  // RTK Query: data is fetched & cached automatically; mutations invalidate the cache to refetch.
  const { data: facilities = [] } = useGetFacilitiesQuery();
  const { data: bookings = [], error } = useGetFacilityBookingsQuery();
  const [createBooking] = useCreateFacilityBookingMutation();
  const [updateBookingStatus] = useUpdateFacilityBookingStatusMutation();

  const todayIso = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (error) showToast('error', error?.data?.message || 'Failed to load facilities');
  }, [error, showToast]);

  const upcomingBookings = useMemo(() => {
    return bookings
      .filter(b => b.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [bookings, todayIso]);

  const pastBookings = useMemo(() => {
    return bookings
      .filter(b => b.date < todayIso)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [bookings, todayIso]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facility Booking</h1>
          <p className="text-sm text-gray-500 mt-1">Book and manage society amenities</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Book Facility
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: 'facilities', label: 'Amenities' },
          { key: 'bookings', label: 'Bookings' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'facilities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map((f) => {
            const Icon = iconByType[f.type] || Home;
            const color = colorByType[f.type] || colorByType.general;
            return (
              <div key={f._id || f.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${color} border flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{f.name}</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{f.description}</p>
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Max {f.capacity}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {f.slotDuration}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-900">
                    {f.pricePerSlot > 0 ? formatCurrency(f.pricePerSlot) : 'Free for residents'}
                    {f.pricePerSlot > 0 && <span className="text-xs text-gray-400 font-normal"> / {f.slotDuration.toLowerCase()}</span>}
                  </span>
                  <button
                    onClick={() => {
                      setForm((prev) => ({ ...prev, facilityId: f._id || f.id }));
                      setShowModal(true);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Upcoming */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming & Today</h2>
            <div className="space-y-3">
              {upcomingBookings.map((b) => {
                const st = bookingStatusConfig[b.status] || bookingStatusConfig.pending;
                const StIcon = st.icon;
                const bookingId = b._id || b.id;
                const facilityName = b.facilityId?.name || b.facilityName;
                return (
                  <div key={bookingId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400">{bookingId}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                            <StIcon className="w-3 h-3" /> {st.label}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">{facilityName} — {b.purpose}</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                          <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(b.date)}</span>
                          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {b.timeSlot}</span>
                          <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Flat {b.flat}</span>
                          <span>{b.residentName}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-2">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(b.amount)}</p>
                        <select
                          value={b.status}
                          onChange={async (e) => {
                            try {
                              await updateBookingStatus({ id: bookingId, status: e.target.value }).unwrap();
                              showToast('success', 'Booking status updated');
                            } catch (err) {
                              showToast('error', err?.data?.message || 'Failed to update booking');
                            }
                          }}
                          className="text-xs border rounded-md px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
              {upcomingBookings.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No upcoming bookings</p>
              )}
            </div>
          </div>

          {/* Past */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Past Bookings</h2>
            <div className="space-y-3">
              {pastBookings.map((b) => {
                const st = bookingStatusConfig[b.status] || bookingStatusConfig.pending;
                const StIcon = st.icon;
                const facilityName = b.facilityId?.name || b.facilityName;
                return (
                  <div key={b._id || b.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 opacity-75">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400">{b._id || b.id}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                            <StIcon className="w-3 h-3" /> {st.label}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">{facilityName} — {b.purpose}</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                          <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(b.date)}</span>
                          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {b.timeSlot}</span>
                          <span>Flat {b.flat} — {b.residentName}</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-600">{formatCurrency(b.amount)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Book facility modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Book a Facility" size="md">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const selected = facilities.find((f) => (f._id || f.id) === form.facilityId);
            try {
              await createBooking({
                ...form,
                amount: selected?.pricePerSlot || 0,
                status: 'pending',
              }).unwrap();
              setShowModal(false);
              setForm({ facilityId: '', date: '', timeSlot: '', purpose: '', flat: '', residentName: '' });
              showToast('success', 'Booking created');
            } catch (err) {
              showToast('error', err?.data?.message || 'Failed to create booking');
            }
          }}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Facility</label>
            <select value={form.facilityId} onChange={(e) => setForm((p) => ({ ...p, facilityId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Choose a facility</option>
              {facilities.map(f => (
                <option key={f._id || f.id} value={f._id || f.id}>{f.name} {f.pricePerSlot > 0 ? `(${formatCurrency(f.pricePerSlot)} / ${f.slotDuration.toLowerCase()})` : '(Free)'}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
              <select value={form.timeSlot} onChange={(e) => setForm((p) => ({ ...p, timeSlot: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Select time</option>
                {['6:00 AM - 10:00 AM', '10:00 AM - 2:00 PM', '2:00 PM - 6:00 PM', '6:00 PM - 10:00 PM'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <input type="text" value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} placeholder="e.g. Birthday party, Family gathering" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flat</label>
              <input type="text" value={form.flat} onChange={(e) => setForm((p) => ({ ...p, flat: e.target.value }))} placeholder="A-101" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resident Name</label>
              <input type="text" value={form.residentName} onChange={(e) => setForm((p) => ({ ...p, residentName: e.target.value }))} placeholder="Resident name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Confirm Booking</button>
          </div>
        </form>
      </Modal>

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
