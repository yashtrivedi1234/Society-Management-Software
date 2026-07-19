import { useState } from 'react';
import { AlarmSmoke, CarFront, FileText, Package, Shield, Users } from 'lucide-react';
import Toast from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { isValidFlatNumber } from '../utils/validation';
import {
  useGetParkingQuery,
  useCreateParkingMutation,
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffAttendanceMutation,
  useGetParcelsQuery,
  useCreateParcelMutation,
  useMarkParcelDeliveredMutation,
  useGetDocumentsQuery,
  useCreateDocumentMutation,
  useGetEmergencyAlertsQuery,
  useCreateEmergencyAlertMutation,
  useUpdateEmergencyStatusMutation,
} from '../store/apiSlice';

export default function OperationsCenter() {
  const { toast, showToast, clearToast } = useToast();

  // RTK Query: data is fetched & cached automatically; mutations invalidate the cache to refetch.
  const { data: parking = [] } = useGetParkingQuery();
  const { data: staff = [] } = useGetStaffQuery();
  const { data: parcels = [] } = useGetParcelsQuery();
  const { data: docs = [] } = useGetDocumentsQuery();
  const { data: alerts = [] } = useGetEmergencyAlertsQuery();

  const [createParking] = useCreateParkingMutation();
  const [createStaff] = useCreateStaffMutation();
  const [updateStaffAttendance] = useUpdateStaffAttendanceMutation();
  const [createParcel] = useCreateParcelMutation();
  const [markParcelDelivered] = useMarkParcelDeliveredMutation();
  const [createDocument] = useCreateDocumentMutation();
  const [createEmergencyAlert] = useCreateEmergencyAlertMutation();
  const [updateEmergencyStatus] = useUpdateEmergencyStatusMutation();

  const [slotNumber, setSlotNumber] = useState('');
  const [staffForm, setStaffForm] = useState({ name: '', role: '' });
  const [parcelForm, setParcelForm] = useState({ flat: '', recipientName: '' });
  const [docForm, setDocForm] = useState({ title: '', category: '', url: '' });
  const [alertForm, setAlertForm] = useState({ flat: '', raisedBy: '', type: 'other', notes: '' });
  const [formError, setFormError] = useState('');

  const statCards = [
    { label: 'Parking Slots', value: parking.length, icon: CarFront, tone: 'text-blue-700 bg-blue-50' },
    { label: 'Staff Members', value: staff.length, icon: Users, tone: 'text-violet-700 bg-violet-50' },
    { label: 'Open Parcels', value: parcels.filter((p) => p.status !== 'delivered').length, icon: Package, tone: 'text-amber-700 bg-amber-50' },
    { label: 'Active Alerts', value: alerts.filter((a) => a.status !== 'closed').length, icon: AlarmSmoke, tone: 'text-red-700 bg-red-50' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Operations & Security Center</h1>
            <p className="text-sm text-slate-200 mt-1">
              Manage security operations, daily workflows, documents and emergency response.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs">
            <Shield className="w-4 h-4" />
            Live operations panel
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => {
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CarFront className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Parking Management</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <input id="parking-slot-number" aria-label="Parking slot number" value={slotNumber} onChange={(e) => setSlotNumber(e.target.value)} placeholder="Slot number (P-101)" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button
              onClick={async () => {
                if (!slotNumber.trim()) {
                  setFormError('Parking slot number is required');
                  return;
                }
                try {
                  await createParking({ slotNumber }).unwrap();
                  setSlotNumber('');
                  setFormError('');
                  showToast('success', 'Parking slot added');
                } catch (err) {
                  showToast('error', err?.data?.message || 'Failed to add slot');
                }
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2 max-h-56 overflow-auto pr-1">
            {parking.map((item) => (
              <li key={item._id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/60">
                <span className="text-sm font-medium text-gray-800">{item.slotNumber}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  item.status === 'occupied'
                    ? 'bg-amber-100 text-amber-700'
                    : item.status === 'reserved'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-emerald-100 text-emerald-700'
                }`}>{item.status}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-violet-600" />
            <h2 className="font-semibold text-gray-900">Staff & Attendance</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <input id="staff-name" aria-label="Staff name" value={staffForm.name} onChange={(e) => setStaffForm((p) => ({ ...p, name: e.target.value }))} placeholder="Staff name" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input id="staff-role" aria-label="Staff role" value={staffForm.role} onChange={(e) => setStaffForm((p) => ({ ...p, role: e.target.value }))} placeholder="Role" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button
              onClick={async () => {
                if (!staffForm.name.trim() || !staffForm.role.trim()) {
                  setFormError('Staff name and role are required');
                  return;
                }
                try {
                  await createStaff(staffForm).unwrap();
                  setStaffForm({ name: '', role: '' });
                  setFormError('');
                  showToast('success', 'Staff added');
                } catch (err) {
                  showToast('error', err?.data?.message || 'Failed to add staff');
                }
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2 max-h-56 overflow-auto pr-1">
            {staff.map((item) => (
              <li key={item._id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/60">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.attendanceStatus === 'present'
                      ? 'bg-emerald-100 text-emerald-700'
                      : item.attendanceStatus === 'leave'
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-red-100 text-red-700'
                  }`}>{item.attendanceStatus}</span>
                  <button
                    onClick={async () => {
                      const next = item.attendanceStatus === 'present' ? 'absent' : 'present';
                      try {
                        await updateStaffAttendance({ id: item._id, payload: { attendanceStatus: next } }).unwrap();
                      } catch (err) {
                        showToast('error', err?.data?.message || 'Failed to update attendance');
                      }
                    }}
                    className="text-xs px-2 py-1 bg-white border border-gray-200 hover:bg-gray-100 rounded transition-colors"
                  >
                    Toggle
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-gray-900">Parcel Desk</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <input id="parcel-flat" aria-label="Parcel flat number" value={parcelForm.flat} onChange={(e) => setParcelForm((p) => ({ ...p, flat: e.target.value }))} placeholder="Flat" className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input id="parcel-recipient" aria-label="Parcel recipient name" value={parcelForm.recipientName} onChange={(e) => setParcelForm((p) => ({ ...p, recipientName: e.target.value }))} placeholder="Recipient name" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button
              onClick={async () => {
                if (!isValidFlatNumber(parcelForm.flat) || !parcelForm.recipientName.trim()) {
                  setFormError('Use flat format like A-101 and enter recipient name');
                  return;
                }
                try {
                  await createParcel(parcelForm).unwrap();
                  setParcelForm({ flat: '', recipientName: '' });
                  setFormError('');
                } catch (err) {
                  showToast('error', err?.data?.message || 'Failed to add parcel');
                }
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2 max-h-56 overflow-auto pr-1">
            {parcels.map((item) => (
              <li key={item._id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/60">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.flat} - {item.recipientName}</p>
                  <p className="text-xs text-gray-500">{item.status}</p>
                </div>
                {item.status !== 'delivered' && (
                  <button onClick={async () => {
                    try {
                      await markParcelDelivered(item._id).unwrap();
                    } catch (err) {
                      showToast('error', err?.data?.message || 'Failed to mark delivered');
                    }
                  }} className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors">
                    Delivered
                  </button>
                )}
                {item.status === 'delivered' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">Delivered</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-slate-700" />
            <h2 className="font-semibold text-gray-900">Document Vault</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <input id="doc-title" aria-label="Document title" value={docForm.title} onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input id="doc-category" aria-label="Document category" value={docForm.category} onChange={(e) => setDocForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input id="doc-url" aria-label="Document URL" value={docForm.url} onChange={(e) => setDocForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://..." className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button
            onClick={async () => {
              if (!docForm.title.trim() || !docForm.category.trim() || !/^https?:\/\//i.test(docForm.url)) {
                setFormError('Document title/category and valid URL are required');
                return;
              }
              try {
                await createDocument(docForm).unwrap();
                setDocForm({ title: '', category: '', url: '' });
                setFormError('');
              } catch (err) {
                showToast('error', err?.data?.message || 'Failed to add document');
              }
            }}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors mb-3"
          >
            Save Document
          </button>
          <ul className="space-y-2 max-h-52 overflow-auto pr-1">
            {docs.map((item) => (
              <li key={item._id} className="px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/60">
                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlarmSmoke className="w-5 h-5 text-red-600" />
          <h2 className="font-semibold text-gray-900">Emergency Alerts</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-4">
          <input id="alert-flat" aria-label="Alert flat number" value={alertForm.flat} onChange={(e) => setAlertForm((p) => ({ ...p, flat: e.target.value }))} placeholder="Flat" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          <input id="alert-raised-by" aria-label="Alert raised by" value={alertForm.raisedBy} onChange={(e) => setAlertForm((p) => ({ ...p, raisedBy: e.target.value }))} placeholder="Raised by" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          <select id="alert-type" aria-label="Alert type" value={alertForm.type} onChange={(e) => setAlertForm((p) => ({ ...p, type: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
            <option value="medical">Medical</option><option value="fire">Fire</option><option value="security">Security</option><option value="other">Other</option>
          </select>
          <input id="alert-notes" aria-label="Alert notes" value={alertForm.notes} onChange={(e) => setAlertForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="px-3 py-2 border border-gray-300 rounded-lg text-sm sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <button
          onClick={async () => {
            if (!isValidFlatNumber(alertForm.flat) || !alertForm.raisedBy.trim()) {
              setFormError('Use flat format like A-101 and enter raised by name');
              return;
            }
            try {
              await createEmergencyAlert(alertForm).unwrap();
              setAlertForm({ flat: '', raisedBy: '', type: 'other', notes: '' });
              setFormError('');
            } catch (err) {
              showToast('error', err?.data?.message || 'Failed to raise alert');
            }
          }}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium transition-colors mb-3"
        >
          Raise Alert
        </button>
        <ul className="space-y-2 max-h-64 overflow-auto pr-1">
          {alerts.map((item) => (
            <li key={item._id} className="flex justify-between items-center px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/70">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.flat} - {item.type}</p>
                <p className="text-xs text-gray-500">{item.raisedBy || 'Unknown'} • {item.status}</p>
              </div>
              {item.status !== 'closed' ? (
                <button
                  className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                  onClick={async () => {
                    try {
                      await updateEmergencyStatus({ id: item._id, payload: { status: 'acknowledged' } }).unwrap();
                    } catch (err) {
                      showToast('error', err?.data?.message || 'Failed to acknowledge alert');
                    }
                  }}
                >
                  Acknowledge
                </button>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">Closed</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
