const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export const apiClient = {
  async fetch(endpoint: string, options: RequestInit = {}) {
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
    });

    if (!res.ok) {
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
