import { API_BASE_URL, USE_API } from '../config';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem('ns-access-token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('ns-refresh-token');
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('ns-access-token', access);
  localStorage.setItem('ns-refresh-token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('ns-access-token');
  localStorage.removeItem('ns-refresh-token');
}

type RequestOptions = RequestInit & { skipAuth?: boolean };

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (!USE_API) {
    throw new Error('API disabled — use mock AppContext');
  }

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (!options.skipAuth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && !options.skipAuth) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const ok = await refreshPromise;
    if (ok) {
      headers.Authorization = `Bearer ${getAccessToken()}`;
      res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    } else {
      clearTokens();
      window.location.href = '/auth';
      throw new ApiError('UNAUTHORIZED', 'Phiên đăng nhập hết hạn', 401);
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      body.detail?.code ?? body.code ?? 'UNKNOWN',
      body.detail?.message ?? body.message ?? res.statusText,
      res.status,
      body.detail?.details ?? body.details,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
