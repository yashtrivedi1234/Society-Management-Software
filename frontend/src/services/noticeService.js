import { apiRequest } from './apiClient';
import { isLiveMode } from '../config/appMode';
import * as demo from './demoBackend';
import { getCurrentMonth } from '../utils/formatDate';

export async function listNoticesApi() {
  if (!isLiveMode) return demo.list('notices');
  const res = await apiRequest('/notices');
  return res.data || [];
}

export async function createNoticeApi(payload) {
  if (!isLiveMode) {
    return demo.create('notices', {
      pinned: false,
      postedBy: 'RWA Admin',
      date: `${getCurrentMonth()}-15`,
      ...payload,
    }, 'notice');
  }
  const res = await apiRequest('/notices', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateNoticeApi(id, payload) {
  if (!isLiveMode) return demo.update('notices', id, payload);
  const res = await apiRequest(`/notices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteNoticeApi(id) {
  if (!isLiveMode) return demo.remove('notices', id);
  await apiRequest(`/notices/${id}`, { method: 'DELETE' });
}
