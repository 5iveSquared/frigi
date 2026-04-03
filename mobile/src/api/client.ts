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
  return config;
});
