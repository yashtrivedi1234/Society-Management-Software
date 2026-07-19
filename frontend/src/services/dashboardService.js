import { apiRequest } from './apiClient';

export async function getDashboardSummaryApi(month) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const res = await apiRequest(`/dashboard/summary${query}`);
  return res.data;
}
