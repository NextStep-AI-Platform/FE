import { apiRequest } from './client'
import type { AuthResponse } from './auth'

export interface ProfilePatch {
  name: string
  phone: string | null
  targetRole: string | null
  targetIndustry: string | null
}

export const saveProfile = (patch: ProfilePatch) =>
  apiRequest<AuthResponse>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })

export const deleteServerAccount = () =>
  apiRequest<void>('/users/me', { method: 'DELETE', skipRefresh: true })
