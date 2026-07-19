const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

function getAuthToken() {
  return localStorage.getItem('auth_token');
}

function getSocietyId() {
  return localStorage.getItem('society_id') || import.meta.env.VITE_SOCIETY_ID || 'default';
}

function buildHeaders(customHeaders = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'x-society-id': getSocietyId(),
    ...customHeaders,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  });

  if (!response.ok) {
    // Session expired/invalid mid-use (had a token but server says 401): clear it and let the
    // app redirect to login instead of leaving every page stuck on "Request failed".
    if (response.status === 401 && localStorage.getItem('auth_token')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('society_id');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      errorMessage = data.message || errorMessage;
    } catch {
      // noop
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) return null;
  return response.json();
}
