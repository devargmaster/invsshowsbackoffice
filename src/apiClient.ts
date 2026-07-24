const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

// El access token dura 15 min y no había ningún intento de renovarlo — la
// primera request después de ese lapso tiraba 401 y expulsaba al login,
// aunque el refresh token (cookie httpOnly, 30 días) siguiera vigente.
// `refreshPromise` deduplica: si varias requests pisan un 401 al mismo
// tiempo, esperan el mismo intento de refresh (el backend rota el refresh
// token en cada uso, así que refrescos en paralelo se pisarían entre sí).
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return false;
        const body = await res.json();
        localStorage.setItem('invs_admin_token', body.accessToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export const apiClient = {
  async fetch(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<any> {
    const token = localStorage.getItem('invs_admin_token');

    const headers = new Headers(options.headers);
    if (token && token !== 'undefined' && token !== 'null') {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('API Client: No valid token found in localStorage', token);
    }
    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 401 && endpoint !== '/auth/refresh' && !isRetry) {
        const refreshed = await refreshAccessToken();
        if (refreshed) return this.fetch(endpoint, options, true);
      }

      if (res.status === 401 && window.location.pathname !== '/') {
        localStorage.removeItem('invs_admin_token');
        window.location.href = '/';
        throw new ApiError(401, 'Sesión expirada');
      }

      let message = 'Error de conexión';
      try {
        const body = await res.json();
        message = body.message || message;
      } catch {}
      throw new ApiError(res.status, message);
    }

    if (res.status === 204) return null;
    return res.json();
  },

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.fetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async get<T>(endpoint: string): Promise<T> {
    return this.fetch(endpoint, { method: 'GET' });
  }
};
