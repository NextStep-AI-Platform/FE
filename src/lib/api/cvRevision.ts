import { apiRequest, getAccessToken } from './client'
import { API_BASE_URL } from '../config'
import type { CvDecision, CvRevisionResponse } from '../../types/cvStructured'

export const getCvRevision = (analysisId: string, signal?: AbortSignal) =>
  apiRequest<CvRevisionResponse>(`/analysis/${analysisId}/cv-revision`, { signal })

export const saveCvDecisions = (analysisId: string, decisions: Record<string, CvDecision>, templateId?: string) =>
  apiRequest<{ ok: true }>(`/analysis/${analysisId}/cv-revision`, {
    method: 'PATCH',
    body: JSON.stringify({ decisions, templateId }),
  })

export const retryCvRevision = (analysisId: string) =>
  apiRequest<{ status: string }>(`/analysis/${analysisId}/cv-revision/retry`, { method: 'POST' })

async function fetchDocx(analysisId: string) {
  return fetch(`${API_BASE_URL}/analysis/${analysisId}/cv-revision.docx`, {
    headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
  })
}

/** apiRequest always parses JSON, so binary download uses fetch directly. */
export async function downloadCvRevisionDocx(analysisId: string, fileName = 'CV-hoan-thien.docx') {
  let res = await fetchDocx(analysisId)
  if (res.status === 401) {
    // Let apiRequest refresh the access token, then retry once.
    await getCvRevision(analysisId)
    res = await fetchDocx(analysisId)
  }
  if (!res.ok) throw new Error(res.status === 403 ? 'PLAN_REQUIRED' : 'DOWNLOAD_FAILED')
  const unresolved = Number(res.headers.get('X-Unresolved-Placeholders') || 0)
  const url = URL.createObjectURL(await res.blob())
  const a = Object.assign(document.createElement('a'), { href: url, download: fileName })
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { unresolved }
}
