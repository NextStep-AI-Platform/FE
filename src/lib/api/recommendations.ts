import { apiRequest } from './client'

export interface CompanySuggestion {
  company: string
  title: string
  location: string | null
  source: string
  sourceUrl: string
  sourceJobId: string
  skills: string[]
  postedAt: string | null
  description: string | null
  attribution: string
  observedAt: string
  verifiedAt: string
  expiresAt: string
  why: string[]
}

export interface CompanySuggestionsResponse {
  catalogVersion: string | null
  status: 'disabled' | 'empty' | 'available'
  items: CompanySuggestion[]
}

export const getCompanySuggestions = (analysisId: string) =>
  apiRequest<CompanySuggestionsResponse>(`/recommendations/companies?analysisId=${encodeURIComponent(analysisId)}`)
