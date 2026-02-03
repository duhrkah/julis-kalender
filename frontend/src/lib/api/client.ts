/**
 * Axios API client with interceptors
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '@/lib/constants';

/** Custom event name for global API error toasts */
export const API_ERROR_EVENT = 'api-error';

/**
 * Extract a user-friendly error message from an API error response.
 * Handles FastAPI detail as string or validation error list.
 */
export function getApiErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Ein Fehler ist aufgetreten.';
  const axiosError = error as AxiosError<{ detail?: string | Array<{ msg?: string; loc?: string[] }> }>;
  const detail = axiosError.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (first && typeof first === 'object' && typeof first.msg === 'string') return first.msg;
  }
  const status = axiosError.response?.status;
  if (status === 429) return 'Zu viele Anfragen. Bitte kurz warten.';
  if (status && status >= 500) return 'Serverfehler. Bitte später erneut versuchen.';
  return 'Ein Fehler ist aufgetreten.';
}

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');

      // Only redirect if not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (typeof window !== 'undefined') {
      // Dispatch global error for toast (non-401)
      const message = getApiErrorMessage(error);
      window.dispatchEvent(new CustomEvent(API_ERROR_EVENT, { detail: message }));
    }

    return Promise.reject(error);
  }
);

export default apiClient;
