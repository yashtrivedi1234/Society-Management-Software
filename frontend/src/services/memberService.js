import { apiRequest } from './apiClient';
import { isLiveMode } from '../config/appMode';
import * as demo from './demoBackend';

export async function listMembersApi() {
  if (!isLiveMode) return demo.list('members');
  const res = await apiRequest('/members');
  return res.data || [];
}

export async function createMemberApi(payload) {
  if (!isLiveMode) {
    const block = (payload.flatNumber || '').split('-')[0] || 'A';
    return demo.create('members', {
      flatNumber: payload.flatNumber,
      name: payload.name,
      phone: payload.phone || '',
      email: payload.email || '',
      isOwner: payload.isOwner ?? true,
      familyMembers: Number(payload.familyMembers || 1),
      status: 'active',
      role: 'Member',
      block,
      isCommitteeMember: false,
      hasLogin: Boolean(payload.createLogin),
    }, 'm');
  }
  const res = await apiRequest('/members', { method: 'POST', body: JSON.stringify(payload) });
  return res.data;
}

export async function createMemberLoginApi(id, password) {
  if (!isLiveMode) {
    const updated = demo.update('members', id, { hasLogin: true });
    return { created: true, email: updated?.email, flatNumber: updated?.flatNumber };
  }
  const res = await apiRequest(`/members/${id}/login`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  return res.data;
}

export async function updateMemberApi(id, payload) {
  if (!isLiveMode) return demo.update('members', id, payload);
  const res = await apiRequest(`/members/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  return res.data;
}

export async function deleteMemberApi(id) {
  if (!isLiveMode) return demo.remove('members', id);
  await apiRequest(`/members/${id}`, { method: 'DELETE' });
}
