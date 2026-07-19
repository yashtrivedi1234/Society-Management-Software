import { apiRequest } from './apiClient';
import { isLiveMode } from '../config/appMode';
import * as demo from './demoBackend';

export async function listVisitorsApi() {
  if (!isLiveMode) return demo.list('visitors');
  const res = await apiRequest('/visitors');
  return res.data || [];
}

export async function createVisitorApi(payload) {
  if (!isLiveMode) return demo.create('visitors', { status: 'expected', preApproved: false, ...payload }, 'vis');
  const res = await apiRequest('/visitors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateVisitorStatusApi(id, status) {
  if (!isLiveMode) {
    const patch = { status };
    if (status === 'checked_in') patch.checkIn = new Date().toISOString();
    return demo.update('visitors', id, patch);
  }
  const res = await apiRequest(`/visitors/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data;
}

export async function deleteVisitorApi(id) {
  if (!isLiveMode) return demo.remove('visitors', id);
  await apiRequest(`/visitors/${id}`, { method: 'DELETE' });
}
