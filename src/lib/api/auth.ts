import {
  apiRequest,
  setTokens,
  clearTokens,
  getRefreshToken,
} from './client';
import type { PlanInfo, User } from '../../types';

export interface AuthResponse {
  user: User;
  plan: PlanInfo;
  accessToken?: string | null;
  refreshToken?: string | null;
  scansRemaining?: number;
  isPremium?: boolean;
  isVip?: boolean;
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  if (data.accessToken && data.refreshToken) {
    setTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

export async function registerApi(name: string, email: string, password: string): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
    skipAuth: true,
  });
  if (data.accessToken && data.refreshToken) {
    setTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

export async function fetchMe(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/me');
}

export async function logoutApi(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiRequest<void>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        skipAuth: true,
        skipRefresh: true,
      });
    }
  } catch {
    // Local logout must still complete if the access token already expired.
  } finally {
    clearTokens();
  }
}
