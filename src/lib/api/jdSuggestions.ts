import { apiRequest } from './client'
import { USE_API } from '../config'
import { MOCK_JD_SUGGESTIONS, mockJdText } from '../../data/mockJdSuggestions'
import type { CvStructured } from '../../types/cvStructured'

export interface JdSuggestion {
  postingId: string
  title: string
  company: string
  location: string | null
  level: string | null
  skills: string[]
  source: string
  sourceUrl: string
  attribution: string | null
  matchPercent: number
  why: string[]
  excerpt: string
  postedAt: string | null
  expiresAt: string
}

export interface JdSuggestionsResponse {
  status: 'available' | 'empty' | 'disabled'
  profile: {
    roles: string[]
    skills: string[]
    seniority: string | null
    location?: string | null
    industries?: string[]
    experienceMonths?: number | null
    /** Which hints were filled from the CV because the user left them blank. */
    hintsFromCv?: string[]
    source?: string
  } | null
  items: JdSuggestion[]
}

export interface JdDetail {
  postingId: string
  title: string
  company: string
  sourceUrl: string
  attribution?: string | null
  jdText: string
}

const sleep = (ms: number) => new Promise(r => window.setTimeout(r, ms))

export async function getJdAvailability(): Promise<boolean> {
  if (!USE_API) return true
  try {
    const r = await apiRequest<{ enabled: boolean }>('/jd-suggestions/availability')
    return r.enabled
  } catch {
    return false
  }
}

export async function searchJds(input: {
  cvFile?: File
  cvText?: string
  cvStructured?: CvStructured
  company?: string
  industry?: string
  role?: string
  location?: string
  minExperienceMonths?: number
}): Promise<JdSuggestionsResponse> {
  if (!USE_API) {
    await sleep(1200)
    return {
      status: 'available',
      profile: {
        roles: [input.role?.trim() || 'Backend Developer'],
        skills: ['Python', 'FastAPI', 'SQL', 'Docker'],
        seniority: 'junior',
        location: input.location?.trim() || 'Hồ Chí Minh',
        industries: input.industry?.trim() ? [input.industry.trim()] : ['Công nghệ thông tin'],
        experienceMonths: input.minExperienceMonths ?? 18,
        hintsFromCv: [
          ...(input.role?.trim() ? [] : ['role']),
          ...(input.location?.trim() ? [] : ['location']),
          ...(input.industry?.trim() ? [] : ['industry']),
          ...(input.minExperienceMonths !== undefined ? [] : ['experience']),
        ],
      },
      items: MOCK_JD_SUGGESTIONS,
    }
  }
  const fd = new FormData()
  if (input.cvFile) fd.append('cv_file', input.cvFile)
  else if (input.cvStructured) fd.append('cv_structured_json', JSON.stringify(input.cvStructured))
  else if (input.cvText) fd.append('cv_text', input.cvText)
  const hints = { company: input.company, industry: input.industry, role: input.role, location: input.location }
  for (const [k, v] of Object.entries(hints)) {
    if (v?.trim()) fd.append(k, v.trim())
  }
  if (input.minExperienceMonths !== undefined) fd.append('min_experience_months', String(input.minExperienceMonths))
  return apiRequest<JdSuggestionsResponse>('/jd-suggestions', { method: 'POST', body: fd })
}

export async function getJdDetail(postingId: string): Promise<JdDetail> {
  if (!USE_API) {
    await sleep(300)
    const item = MOCK_JD_SUGGESTIONS.find(s => s.postingId === postingId) ?? MOCK_JD_SUGGESTIONS[0]
    return { postingId: item.postingId, title: item.title, company: item.company, sourceUrl: item.sourceUrl, attribution: item.attribution, jdText: mockJdText(item) }
  }
  return apiRequest<JdDetail>(`/jd-suggestions/${postingId}`)
}
