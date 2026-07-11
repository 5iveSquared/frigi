import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const CLOUD_RUN_API_URL = 'https://frigi-api-dquezahola-uc.a.run.app';
const DEFAULT_API_URL = __DEV__ ? 'http://localhost:8000' : CLOUD_RUN_API_URL;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

console.info('[frigi][api] client:init', {
  env: process.env.EXPO_PUBLIC_APP_ENV ?? (__DEV__ ? 'development' : 'production'),
  baseURL: API_BASE_URL,
  source: process.env.EXPO_PUBLIC_API_URL ? 'env' : (__DEV__ ? 'dev_default' : 'prod_default'),
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  (config as any).__startedAt = Date.now();
  console.info('[frigi][http] request', {
    method: config.method,
    url: `${config.baseURL ?? ''}${config.url ?? ''}`,
    hasAuth: !!token,
  });
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const startedAt = (response.config as any).__startedAt;
    console.info('[frigi][http] response', {
      method: response.config.method,
      url: `${response.config.baseURL ?? ''}${response.config.url ?? ''}`,
      status: response.status,
      durationMs: startedAt ? Date.now() - startedAt : null,
    });
    return response;
  },
  (error) => {
    const config = error.config ?? {};
    const startedAt = (config as any).__startedAt;
    console.warn('[frigi][http] error', {
      method: config.method,
      url: `${config.baseURL ?? ''}${config.url ?? ''}`,
      status: error.response?.status ?? null,
      code: error.code ?? null,
      message: error.message,
      durationMs: startedAt ? Date.now() - startedAt : null,
      isNetworkError: !error.response,
    });
    return Promise.reject(error);
  }
);
