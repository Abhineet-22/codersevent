/**
 * API client with automatic token attachment, token refresh, and normalized error handling.
 */

const API_BASE = '/api'; // Proxied to http://127.0.0.1:8000 by Vite

export const TOKEN_STORAGE_KEY = 'dept_secure_tokens';
export const USER_STORAGE_KEY = 'dept_secure_user';

export function getStoredTokens() {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredTokens(tokens) {
  if (tokens) {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    params = null,
    skipAuth = false,
  } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (!skipAuth) {
    const tokens = getStoredTokens();
    if (tokens?.access_token) {
      reqHeaders['Authorization'] = `Bearer ${tokens.access_token}`;
    }
  }

  const fetchOptions = {
    method,
    headers: reqHeaders,
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err) {
    throw new Error(`Network error connecting to backend: ${err.message}`);
  }

  // Handle CSV/text responses
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) {
    if (!response.ok) {
      throw new Error('Failed to generate CSV export');
    }
    const blob = await response.blob();
    return blob;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    // Format error message from FastAPI validation or BusinessError
    let message = 'An error occurred';
    let reasons = [];

    if (data) {
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        // Validation error array
        message = data.detail.map((d) => `${d.field}: ${d.msg}`).join(', ');
      }
      if (Array.isArray(data.reasons)) {
        reasons = data.reasons;
      }
    } else {
      message = `HTTP ${response.status} ${response.statusText}`;
    }

    const error = new Error(message);
    error.status = response.status;
    error.reasons = reasons;
    error.raw = data;
    throw error;
  }

  return data;
}

// Convenience methods
export const api = {
  // Auth
  login: (username, password) => apiRequest('/auth/login', { method: 'POST', body: { username, password }, skipAuth: true }),
  refresh: (refreshToken) => apiRequest('/auth/refresh', { method: 'POST', body: { refresh_token: refreshToken }, skipAuth: true }),
  logout: (refreshToken, allDevices = false) => apiRequest('/auth/logout', { method: 'POST', body: { refresh_token: refreshToken, all_devices: allDevices } }),
  changePassword: (oldPassword, newPassword) => apiRequest('/auth/change-password', { method: 'POST', body: { old_password: oldPassword, new_password: newPassword } }),
  getMe: () => apiRequest('/auth/me'),

  // Admin
  listUsers: (params) => apiRequest('/admin/users', { params }),
  createUser: (userData) => apiRequest('/admin/users', { method: 'POST', body: userData }),
  patchUser: (userId, data) => apiRequest(`/admin/users/${userId}`, { method: 'PATCH', body: data }),
  resetPassword: (userId) => apiRequest(`/admin/users/${userId}/reset-password`, { method: 'POST' }),
  getAuditLogs: (params) => apiRequest('/admin/audit', { params }),
  verifyAuditChain: () => apiRequest('/admin/audit/verify'),

  // Students
  listStudents: (params) => apiRequest('/students', { params }),
  getStudent: (id) => apiRequest(`/students/${id}`),
  createStudent: (studentData) => apiRequest('/students', { method: 'POST', body: studentData }),
  patchStudent: (id, data) => apiRequest(`/students/${id}`, { method: 'PATCH', body: data }),

  // Locations & Items
  listLocations: () => apiRequest('/locations'),
  createLocation: (data) => apiRequest('/locations', { method: 'POST', body: data }),
  updateLocation: (id, data) => apiRequest(`/locations/${id}`, { method: 'PUT', body: data }),
  listItems: (params) => apiRequest('/items', { params }),
  getItem: (id) => apiRequest(`/items/${id}`),
  createItem: (data) => apiRequest('/items', { method: 'POST', body: data }),
  patchItem: (id, data) => apiRequest(`/items/${id}`, { method: 'PATCH', body: data }),
  retireItem: (id) => apiRequest(`/items/${id}`, { method: 'DELETE' }),
  adjustItem: (id, data) => apiRequest(`/items/${id}/adjust`, { method: 'POST', body: data }),

  // Assets
  listAssets: (params) => apiRequest('/assets', { params }),
  createAsset: (itemId, data) => apiRequest(`/items/${itemId}/assets`, { method: 'POST', body: data }),
  updateAssetStatus: (assetId, data) => apiRequest(`/assets/${assetId}/status`, { method: 'POST', body: data }),

  // Transactions & Desk
  issueItems: (data) => apiRequest('/issues', { method: 'POST', body: data }),
  getAcknowledgement: (id) => apiRequest(`/issues/${id}/acknowledgement`),
  returnLine: (lineId, data) => apiRequest(`/issue-lines/${lineId}/return`, { method: 'POST', body: data }),
  listLines: (params) => apiRequest('/issue-lines', { params }),
  listRenewals: (params) => apiRequest('/renewals', { params }),
  decideRenewal: (renewalId, data) => apiRequest(`/renewals/${renewalId}/decision`, { method: 'POST', body: data }),
  getOverdue: () => apiRequest('/overdue'),
  getUpcoming: (days = 3) => apiRequest('/upcoming', { params: { days } }),

  // Policy
  getPolicy: () => apiRequest('/policy'),
  updatePolicy: (data) => apiRequest('/policy', { method: 'PUT', body: data }),

  // Student Self-Service
  getMyIssues: () => apiRequest('/me/issues'),
  getMyHistory: (params) => apiRequest('/me/history', { params }),
  getMyRenewals: () => apiRequest('/me/renewals'),
  requestRenewal: (data) => apiRequest('/me/renewals', { method: 'POST', body: data }),
  getMyReminders: (days = 3) => apiRequest('/me/reminders', { params: { days } }),

  // Reports
  getStockReport: (params) => apiRequest('/reports/stock', { params }),
  getTransactionReport: (params) => apiRequest('/reports/transactions', { params }),
  downloadCsv: async (reportType, params = {}) => {
    return apiRequest(`/reports/${reportType}`, { params: { ...params, format: 'csv' } });
  },

  // Health
  getHealth: () => apiRequest('/health', { skipAuth: true }),
};
