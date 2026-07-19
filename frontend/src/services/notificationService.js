import { apiRequest } from './apiClient';

export async function listNotificationsApi() {
  const res = await apiRequest('/notifications');
  return res.data || { unreadCount: 0, items: [] };
}

export async function markAllNotificationsReadApi() {
  const res = await apiRequest('/notifications/read-all', { method: 'PATCH' });
  return res.data || null;
}

export async function markNotificationReadApi(notificationId) {
  const res = await apiRequest(`/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
  });
  return res.data || null;
}
