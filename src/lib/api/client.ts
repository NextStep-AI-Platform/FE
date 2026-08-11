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

type RequestOptions = RequestInit & { skipAuth?: boolean; skipRefresh?: boolean };

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    if (!data.accessToken || !data.refreshToken) return false;
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function expireSession(): never {
  clearTokens();
  if (window.location.pathname !== '/auth') {
    window.location.href = '/auth';
  }
  throw new ApiError('UNAUTHORIZED', 'Authentication session expired', 401);
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (!USE_API) {
    throw new Error('API disabled - use mock AppContext');
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

  if (res.status === 401 && !options.skipAuth && !options.skipRefresh) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const refreshed = await refreshPromise;
    if (!refreshed) expireSession();

    const nextToken = getAccessToken();
    if (nextToken) {
      headers.Authorization = `Bearer ${nextToken}`;
    }
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    if (res.status === 401) expireSession();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body.detail;
    const detailCode = typeof detail === 'object' && detail ? detail.code : undefined;
    const detailMessage = typeof detail === 'string'
      ? detail
      : typeof detail === 'object' && detail
        ? detail.message
        : undefined;
    throw new ApiError(
      detailCode ?? body.code ?? 'UNKNOWN',
      detailMessage ?? body.message ?? res.statusText,
      res.status,
      (typeof detail === 'object' && detail ? detail.details : undefined) ?? body.details,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
