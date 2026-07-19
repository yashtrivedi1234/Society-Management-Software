import { apiRequest } from './apiClient';
import { isLiveMode } from '../config/appMode';
import * as demo from './demoBackend';
import { getCurrentMonth } from '../utils/formatDate';

export async function listComplaintsApi() {
  if (!isLiveMode) return demo.list('complaints');
  const res = await apiRequest('/complaints');
  return res.data || [];
}

export async function createComplaintApi(payload) {
  if (!isLiveMode) {
    return demo.create('complaints', {
      ...payload,
      status: 'open',
      escalated: false,
      assignedTo: 'RWA Committee',
      date: `${getCurrentMonth()}-15`,
    }, 'cmp');
  }
  const res = await apiRequest('/complaints', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateComplaintStatusApi(id, status) {
  if (!isLiveMode) {
    const patch = { status };
    if (status === 'resolved' || status === 'closed') patch.resolvedDate = `${getCurrentMonth()}-15`;
    return demo.update('complaints', id, patch);
  }
  const res = await apiRequest(`/complaints/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data;
}

export async function deleteComplaintApi(id) {
  if (!isLiveMode) return demo.remove('complaints', id);
  await apiRequest(`/complaints/${id}`, { method: 'DELETE' });
}
