import { UNAUTHORIZED_EVENT } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function request({ path, method = 'GET', body, token, signal }) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    let message = 'Unable to complete request';
    let payload;
    try {
      payload = await response.json();
      message = payload.message || message;
    } catch (err) {
      // ignore parse errors
    }
    const error = new Error(message);
    error.status = response.status;
    if (payload) {
      error.payload = payload;
    }
    if (error.status === 401) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
