import { apiRequest } from './apiClient';

export async function loginWithApi(email, password) {
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (result?.token) {
    localStorage.setItem('auth_token', result.token);
  }
  if (result?.user?.societyId) {
    localStorage.setItem('society_id', result.user.societyId);
  }
  return result;
}

export async function registerWithApi(payload) {
  const result = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (result?.token) {
    localStorage.setItem('auth_token', result.token);
  }
  return result;
}

export async function getCurrentUser() {
  return apiRequest('/auth/me');
}

export function clearAuthToken() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('society_id');
}
