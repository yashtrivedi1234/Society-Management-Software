import { apiRequest } from './apiClient';
import { isLiveMode } from '../config/appMode';
import * as demo from './demoBackend';

export async function listExpensesApi(month) {
  if (!isLiveMode) {
    const all = demo.list('expenses');
    return month ? all.filter((e) => (e.date || '').startsWith(month)) : all;
  }
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const res = await apiRequest(`/expenses${query}`);
  return res.data || [];
}

export async function createExpenseApi(payload) {
  if (!isLiveMode) return demo.create('expenses', { ...payload, addedBy: 'admin' }, 'e');
  const res = await apiRequest('/expenses', { method: 'POST', body: JSON.stringify(payload) });
  return res.data;
}

export async function deleteExpenseApi(id) {
  if (!isLiveMode) return demo.remove('expenses', id);
  await apiRequest(`/expenses/${id}`, { method: 'DELETE' });
}
