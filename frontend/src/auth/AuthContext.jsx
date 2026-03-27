import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const AUTH_EXPIRED_EVENT = 'auth:expired';
const AUTH_EXPIRED_MESSAGE = 'Tu sesion expiro. Inicia sesion nuevamente.';
const LOGIN_PATH = '/app/login';
const AUTH_KEYS = ['token', 'userName', 'userRole', 'empresaId', 'empresaNit'];

function parseJwtPayload(token) {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getTokenExpiryMs(token) {
  const payload = parseJwtPayload(token);
  const exp = Number(payload?.exp || 0);
  return exp > 0 ? exp * 1000 : null;
}

function isTokenExpired(token) {
  const expMs = getTokenExpiryMs(token);
  if (!expMs) return true;
  return Date.now() >= expMs;
}

function clearAuthStorage() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
}

function readUserFromStorage() {
  const token = localStorage.getItem('token');
  const isValidToken = Boolean(token) && !isTokenExpired(token);

  return {
    token: isValidToken ? token : null,
    userName: localStorage.getItem('userName') || '',
    userRole: localStorage.getItem('userRole') || '',
    empresaId: localStorage.getItem('empresaId') || '',
    empresaNit: localStorage.getItem('empresaNit') || '',
    isAuthenticated: isValidToken,
  };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readUserFromStorage);

  const login = (payload) => {
    const { token, nombre, rol, id_empresa, empresaNit } = payload;
    localStorage.setItem('token', token);
    localStorage.setItem('userName', nombre);
    localStorage.setItem('userRole', rol);
    localStorage.setItem('empresaId', id_empresa);
    localStorage.setItem('empresaNit', empresaNit || '');
    setAuth(readUserFromStorage());
  };

  const logout = () => {
    clearAuthStorage();
    setAuth(readUserFromStorage());
  };

  useEffect(() => {
    const onAuthExpired = (event) => {
      const reason = event?.detail?.reason || AUTH_EXPIRED_MESSAGE;
      clearAuthStorage();
      setAuth(readUserFromStorage());

      if (!window.location.pathname.endsWith('/login')) {
        const loginUrl = `${LOGIN_PATH}?reason=${encodeURIComponent(reason)}`;
        window.location.assign(loginUrl);
      }
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
  }, []);

  useEffect(() => {
    const rawToken = localStorage.getItem('token');
    if (!rawToken) return undefined;

    if (isTokenExpired(rawToken)) {
      window.dispatchEvent(
        new CustomEvent(AUTH_EXPIRED_EVENT, {
          detail: { reason: AUTH_EXPIRED_MESSAGE },
        })
      );
      return undefined;
    }

    const expMs = getTokenExpiryMs(rawToken);
    if (!expMs) return undefined;

    const timeoutMs = expMs - Date.now();
    if (timeoutMs <= 0) {
      window.dispatchEvent(
        new CustomEvent(AUTH_EXPIRED_EVENT, {
          detail: { reason: AUTH_EXPIRED_MESSAGE },
        })
      );
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(AUTH_EXPIRED_EVENT, {
          detail: { reason: AUTH_EXPIRED_MESSAGE },
        })
      );
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [auth.token]);

  const value = useMemo(() => ({ ...auth, login, logout }), [auth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
