import { apiRequest } from './apiClient';

// Resident self-service endpoints. The backend scopes every response to the logged-in
// user's own flat, so these never expose other residents' data.

export async function getMySummaryApi(month) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : '';
  const res = await apiRequest(`/portal/summary${qs}`);
  return res.data;
}

export async function getMyPaymentsApi() {
  const res = await apiRequest('/portal/payments');
  return res.data || [];
}

export async function getMyComplaintsApi() {
  const res = await apiRequest('/portal/complaints');
  return res.data || [];
}

export async function createMyComplaintApi(payload) {
  const res = await apiRequest('/portal/complaints', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function getMyNoticesApi() {
  const res = await apiRequest('/portal/notices');
  return res.data || [];
}

export async function getMyDocumentsApi() {
  const res = await apiRequest('/portal/documents');
  return res.data || [];
}

export async function getMyVisitorsApi() {
  const res = await apiRequest('/portal/visitors');
  return res.data || [];
}

export async function preApproveVisitorApi(payload) {
  const res = await apiRequest('/portal/visitors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}
