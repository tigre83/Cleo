import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cleo-production-897b.up.railway.app';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cleo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cleo_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
