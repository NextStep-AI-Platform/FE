import { apiRequest } from './client'

export interface InterviewAvailability {
  enabled: boolean
  eligible: boolean
  sessionsLeft: number
  transcriptTtlHours: number
}

export interface InterviewSessionV1 {
  id: string
  status: string
  targetRole: string
  difficulty: string
  questionNumber: number | null
  question: string | null
  prepEndsAt: string | null
  answerDeadlineAt: string | null
  transcriptDraft: string | null
  transcriptRevision: number | null
  answers: Array<{ questionNumber: number; question: string; transcript: string | null }>
  reportStatus: string
  createdAt: string
}

export interface InterviewReportV1 {
  sessionId: string
  overallScore: number | null
  report: { summary?: string; details?: Array<{ questionNumber: number; score: number | null; feedback: string }> }
}

const base = '/interviews/v1'
const key = () => crypto.randomUUID()
const headers = () => ({ 'Idempotency-Key': key() })

export const interviewV1 = {
  availability: () => apiRequest<InterviewAvailability>(`${base}/availability`),
  list: () => apiRequest<{ items: InterviewSessionV1[] }>(`${base}/sessions`),
  get: (id: string) => apiRequest<InterviewSessionV1>(`${base}/sessions/${id}`),
  report: (id: string) => apiRequest<InterviewReportV1>(`${base}/sessions/${id}/report`),
  start: (targetRole: string, difficulty: string) => apiRequest<InterviewSessionV1>(`${base}/sessions`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ targetRole, difficulty, consentVersion: 'interview-consent-v1' }),
  }),
  resume: (id: string) => apiRequest<InterviewSessionV1>(`${base}/sessions/${id}/resume`, { method: 'POST' }),
  begin: (id: string, questionNumber: number) => apiRequest<InterviewSessionV1>(`${base}/sessions/${id}/answers/begin`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ questionNumber }),
  }),
  retry: (id: string, questionNumber: number) => apiRequest<InterviewSessionV1>(`${base}/sessions/${id}/answers/retry`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ questionNumber }),
  }),
  upload: (id: string, questionNumber: number, blob: Blob) => {
    const form = new FormData()
    form.append('audio', blob, 'answer.webm')
    return apiRequest<InterviewSessionV1>(`${base}/sessions/${id}/answers/audio?questionNumber=${questionNumber}`, {
      method: 'POST', headers: headers(), body: form,
    })
  },
  confirm: (id: string, questionNumber: number, transcript: string, transcriptRevision: number) => apiRequest<InterviewSessionV1>(`${base}/sessions/${id}/answers/confirm`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ questionNumber, transcript, transcriptRevision }),
  }),
  text: (id: string, questionNumber: number, text: string) => apiRequest<InterviewSessionV1>(`${base}/sessions/${id}/answers/text`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ questionNumber, text }),
  }),
  abandon: (id: string) => apiRequest<InterviewSessionV1>(`${base}/sessions/${id}/abandon`, {
    method: 'POST', headers: headers(),
  }),
}
