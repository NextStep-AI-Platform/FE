import { apiRequest, setTokens, clearTokens } from './client';
import type { PlanInfo, User } from '../../types';

interface AuthResponse {
  user: User;
  plan: PlanInfo;
  accessToken: string;
  refreshToken: string;
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
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function registerApi(name: string, email: string, password: string): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
    skipAuth: true,
  });
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function fetchMe(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/me');
}

export async function logoutApi(): Promise<void> {
  // Có thể backend không có route logout, nhưng clear local token là đủ
  await apiRequest<void>('/auth/logout', { method: 'POST' }).catch(() => {});
  clearTokens();
}
