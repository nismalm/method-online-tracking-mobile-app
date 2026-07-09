import axios from 'axios';
import {API_BASE_URL, REQUEST_TIMEOUT_MS} from '../config/env';
import * as TokenStorage from './tokenStorage';

let onUnauthenticatedCallback = null;

export const setOnUnauthenticatedHandler = (fn) => {
  onUnauthenticatedCallback = fn;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const publicPaths = ['/auth/login', '/auth/refresh', '/auth/forgot-password'];
  const isPublic = publicPaths.some((p) => config.url?.startsWith(p));
  if (!isPublic) {
    const tokens = await TokenStorage.loadTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
  }
  return config;
});

let refreshPromise = null;

const performRefresh = async () => {
  const tokens = await TokenStorage.loadTokens();
  if (!tokens?.refreshToken) {
    throw new Error('No refresh token');
  }
  const {data} = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    {refreshToken: tokens.refreshToken},
    {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    }
  );
  const payload = data?.data ?? data;
  const newTokens = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  };
  await TokenStorage.saveTokens(newTokens);
  return newTokens;
};

apiClient.interceptors.response.use(
  (response) => {
    if (response?.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      !originalRequest.url?.startsWith('/auth/refresh') &&
      !originalRequest.url?.startsWith('/auth/login')
    ) {
      originalRequest._retried = true;
      try {
        if (!refreshPromise) {
          refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        const newTokens = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        await TokenStorage.clearTokens();
        if (onUnauthenticatedCallback) {
          onUnauthenticatedCallback();
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export const extractError = (err) => {
  const msg = err?.response?.data?.message;
  if (msg) {
    if (Array.isArray(msg)) {return String(msg[0]);}
    if (typeof msg === 'object') {
      const inner = msg.message;
      if (Array.isArray(inner)) {return String(inner[0]);}
      return String(inner || 'An unexpected error occurred');
    }
    return String(msg);
  }
  if (err?.message === 'Network Error') {
    return 'Network error. Please check your connection.';
  }
  return String(err?.message || 'An unexpected error occurred');
};
