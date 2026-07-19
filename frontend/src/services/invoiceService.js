import { apiRequest } from './apiClient';

export async function getInvoiceApi(flatNumber, month) {
  const res = await apiRequest(`/invoices/${encodeURIComponent(flatNumber)}/${encodeURIComponent(month)}`);
  return res.data;
}
