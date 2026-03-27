import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

const AUTH_EXPIRED_EVENT = 'auth:expired';
const AUTH_MESSAGE = 'Tu sesion expiro. Inicia sesion nuevamente.';
let handlingAuthExpired = false;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const token = localStorage.getItem('token');

    if (status === 401 && token && !handlingAuthExpired) {
      handlingAuthExpired = true;

      window.dispatchEvent(
        new CustomEvent(AUTH_EXPIRED_EVENT, {
          detail: { reason: AUTH_MESSAGE },
        })
      );

      window.setTimeout(() => {
        handlingAuthExpired = false;
      }, 300);
    }

    return Promise.reject(error);
  }
);
