import axios from 'axios';
import { UNAUTHORIZED_EVENT } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const http = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

export async function request({ path, method = 'GET', body, token, signal }) {
  try {
    const response = await http.request({
      url: path,
      method,
      data: body,
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
      signal,
    });

    if (response.status === 204 || response.data === undefined) {
      return null;
    }

    return response.data;
  } catch (error) {
    if (error.code === 'ERR_CANCELED') {
      error.name = 'AbortError';
      throw error;
    }
    const status = error.response?.status;
    const payload = error.response?.data;
    const message = payload?.message || error.message || 'Unable to complete request';
    if (status) {
      const normalizedError = new Error(message);
      normalizedError.status = status;
      if (payload) {
        normalizedError.payload = payload;
      }
      throw normalizedError;
    }
    throw error;
  }
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
