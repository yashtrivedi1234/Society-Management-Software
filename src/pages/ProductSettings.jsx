import { useEffect, useState } from 'react';
import { Bell, Boxes, Settings2, ShieldCheck } from 'lucide-react';
import Toast from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import {
  useGetProductSettingsQuery,
  useUpdateProductSettingsMutation,
  useGetBackupsQuery,
  useTriggerBackupMutation,
  useRegisterDeviceTokenMutation,
} from '../store/apiSlice';

export default function ProductSettings() {
  const { toast, showToast, clearToast } = useToast();
  const [settings, setSettings] = useState(null);
  const [token, setToken] = useState('');
  const [registerDeviceToken] = useRegisterDeviceTokenMutation();

  // RTK Query: data is fetched & cached automatically; mutations invalidate the cache to refetch.
  const { data: settingsData } = useGetProductSettingsQuery();
  const { data: backups = [] } = useGetBackupsQuery();
  const [updateSettings] = useUpdateProductSettingsMutation();
  const [triggerBackup] = useTriggerBackupMutation();

  // Seed local editable form state from the query data when it arrives.
  useEffect(() => {
    if (settingsData) setSettings(settingsData);
  }, [settingsData]);

  const stats = [
    { label: 'Backups', value: backups.length, icon: Boxes, tone: 'text-blue-700 bg-blue-50' },
    { label: 'PWA', value: settings?.featureFlags?.pwaEnabled ? 'On' : 'Off', icon: Settings2, tone: 'text-violet-700 bg-violet-50' },
    { label: '2FA', value: settings?.featureFlags?.twoFactorEnabled ? 'On' : 'Off', icon: ShieldCheck, tone: 'text-emerald-700 bg-emerald-50' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Product & Premium Settings</h1>
        <p className="text-sm text-slate-200 mt-1">Manage branding, premium toggles, device tokens and backups.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

      {settings && (
        <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Branding & Feature Flags</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={settings.branding?.productName || ''} onChange={(e) => setSettings((prev) => ({ ...prev, branding: { ...prev.branding, productName: e.target.value } }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Product name" />
            <input value={settings.branding?.primaryColor || ''} onChange={(e) => setSettings((prev) => ({ ...prev, branding: { ...prev.branding, primaryColor: e.target.value } }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="#2563EB" />
            <label className="flex items-center gap-2 text-sm rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <input type="checkbox" checked={!!settings.featureFlags?.pwaEnabled} onChange={(e) => setSettings((prev) => ({ ...prev, featureFlags: { ...prev.featureFlags, pwaEnabled: e.target.checked } }))} />
              PWA Enabled
            </label>
            <label className="flex items-center gap-2 text-sm rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <input type="checkbox" checked={!!settings.featureFlags?.twoFactorEnabled} onChange={(e) => setSettings((prev) => ({ ...prev, featureFlags: { ...prev.featureFlags, twoFactorEnabled: e.target.checked } }))} />
              2FA Enabled
            </label>
          </div>
          <button
            className="mt-4 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
            onClick={async () => {
              try {
                await updateSettings(settings).unwrap();
                showToast('success', 'Settings updated');
              } catch (err) {
                showToast('error', err?.data?.message || 'Failed to update settings');
              }
            }}
          >
            Save Settings
          </button>
        </section>
      )}

      <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-amber-600" />
          <h2 className="font-semibold text-gray-900">Push Notification Device Token</h2>
        </div>
        <div className="flex gap-2">
          <input value={token} onChange={(e) => setToken(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="device-token-xyz" />
          <button className="px-3 py-2 bg-gray-900 hover:bg-black text-white text-sm rounded-lg font-medium transition-colors" onClick={async () => { try { await registerDeviceToken({ token, platform: 'web' }).unwrap(); setToken(''); showToast('success', 'Device token registered'); } catch (err) { showToast('error', err?.data?.message || 'Failed to register device token'); } }}>
            Register
          </button>
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Backup & Restore</h2>
        <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg mb-4 font-medium transition-colors" onClick={async () => { try { await triggerBackup({ type: 'manual' }).unwrap(); showToast('success', 'Backup triggered'); } catch (err) { showToast('error', err?.data?.message || 'Failed to trigger backup'); } }}>
          Trigger Backup
        </button>
        <ul className="space-y-2">
          {backups.map((item) => (
            <li key={item._id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/70">
              <span className="text-sm text-gray-800">{item.type}</span>
              <span className="text-xs text-gray-600">{item.status} • {item.createdAt?.slice(0, 10)}</span>
            </li>
          ))}
        </ul>
      </section>

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
