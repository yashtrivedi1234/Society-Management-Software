import { apiRequest } from './apiClient';
import { isLiveMode } from '../config/appMode';
import * as demo from './demoBackend';

export async function listPaymentsApi(month) {
  if (!isLiveMode) {
    const all = demo.list('payments');
    return month ? all.filter((p) => p.month === month) : all;
  }
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const res = await apiRequest(`/payments${query}`);
  return res.data || [];
}

export async function createPaymentApi(payload) {
  if (!isLiveMode) return demo.create('payments', { ...payload, paidAmount: 0, status: 'unpaid' }, 'p');
  const res = await apiRequest('/payments', { method: 'POST', body: JSON.stringify(payload) });
  return res.data;
}

export async function markPaymentPaidApi(id, payload) {
  if (!isLiveMode) {
    const current = demo.list('payments').find((p) => (p.id || p._id) === id);
    const totalDue = current?.totalDue ?? current?.amount ?? 0;
    const paidAmount = Number(payload.paidAmount ?? totalDue);
    return demo.update('payments', id, {
      paidAmount,
      status: paidAmount >= totalDue ? 'paid' : 'partial',
      paidDate: payload.paidDate || new Date().toISOString().slice(0, 10),
      paymentMode: payload.paymentMode || current?.paymentMode || 'upi',
      transactionRef: payload.transactionRef || current?.transactionRef || `TXN-${Date.now()}`,
    });
  }
  const res = await apiRequest(`/payments/${id}/mark-paid`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}
