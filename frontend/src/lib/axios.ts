import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

// In development the Vite proxy rewrites /api/v1 → http://localhost:3000
// In production VITE_API_URL must point at the Railway backend, e.g.
// https://thewoman-crm-backend.up.railway.app/api/v1
const baseURL = import.meta.env.VITE_API_URL ?? '/api/v1';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
