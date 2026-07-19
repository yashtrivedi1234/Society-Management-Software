import { apiRequest } from './apiClient';

// Server-side aggregated reports (admin/accountant only). Exposed for API/mobile consumers;
// the web Reports page can also derive these client-side from DataContext in demo mode.

export async function getCollectionTrendApi({ month, months = 6 } = {}) {
  const params = new URLSearchParams();
  if (month) params.set('month', month);
  params.set('months', String(months));
  const res = await apiRequest(`/reports/collection-trend?${params.toString()}`);
  return res.data;
}

export async function getExpenseBreakdownApi(month) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : '';
  const res = await apiRequest(`/reports/expense-breakdown${qs}`);
  return res.data;
}

export async function getDefaulterAgingApi(month) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : '';
  const res = await apiRequest(`/reports/defaulter-aging${qs}`);
  return res.data;
}
