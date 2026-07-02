# FE-22 — API Client

> Gợi ý implement `src/lib/api/client.ts`

---

## 1. Fetch wrapper cơ bản

```ts
// src/lib/api/client.ts
import { API_BASE_URL, USE_API } from '../config'

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message)
  }
}

function getAccessToken(): string | null {
  return localStorage.getItem('ns-access-token')
}

function getRefreshToken(): string | null {
  return localStorage.getItem('ns-refresh-token')
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('ns-access-token', access)
  localStorage.setItem('ns-refresh-token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('ns-access-token')
  localStorage.removeItem('ns-refresh-token')
}

type RequestOptions = RequestInit & { skipAuth?: boolean }

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) return false
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    })
    if (!res.ok) return false
    const data = await res.json()
    setTokens(data.accessToken, data.refreshToken)
    return true
  } catch {
    return false
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (!USE_API) {
    throw new Error('API disabled — use mock AppContext')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (!options.skipAuth) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401 && !options.skipAuth) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null
      })
    }
    const ok = await refreshPromise
    if (ok) {
      headers.Authorization = `Bearer ${getAccessToken()}`
      res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
    } else {
      clearTokens()
      window.location.href = '/auth'
      throw new ApiError('UNAUTHORIZED', 'Phiên đăng nhập hết hạn', 401)
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(
      body.code ?? 'UNKNOWN',
      body.message ?? res.statusText,
      res.status,
      body.details,
    )
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
```

---

## 2. Service modules (ví dụ auth)

```ts
// src/lib/api/auth.ts
import { apiRequest, setTokens, clearTokens } from './client'
import type { PlanInfo, User } from '../../types'

interface AuthResponse {
  user: User
  plan: PlanInfo
  accessToken: string
  refreshToken: string
  scansRemaining?: number
  isPremium?: boolean
  isVip?: boolean
}

export async function loginApi(email: string, password: string) {
  const data = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  })
  setTokens(data.accessToken, data.refreshToken)
  return data
}

export async function registerApi(name: string, email: string, password: string) {
  const data = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
    skipAuth: true,
  })
  setTokens(data.accessToken, data.refreshToken)
  return data
}

export async function fetchMe() {
  return apiRequest<AuthResponse>('/auth/me')
}

export async function logoutApi() {
  await apiRequest<void>('/auth/logout', { method: 'POST' }).catch(() => {})
  clearTokens()
}
```

---

## 3. Scan service + polling

```ts
// src/lib/api/scans.ts
import { apiRequest } from './client'
import type { ScanConfig, DocumentInput } from '../../types'

export async function createScan(payload: {
  cv: DocumentInput
  jd: DocumentInput
  config: ScanConfig
}) {
  return apiRequest<{ id: string; status: string }>('/scans', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function runScan(id: string) {
  return apiRequest<{ id: string; status: string }>(`/scans/${id}/run`, {
    method: 'POST',
  })
}

export async function getScanStatus(id: string) {
  return apiRequest<{
    id: string
    status: string
    progressPercent: number
    currentStep: number
    steps: { label: string; status: string }[]
    analysisId?: string
  }>(`/scans/${id}`)
}

export function pollScanUntilDone(
  id: string,
  onProgress: (data: Awaited<ReturnType<typeof getScanStatus>>) => void,
  intervalMs = 1000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const data = await getScanStatus(id)
        onProgress(data)
        if (data.status === 'completed' && data.analysisId) {
          resolve(data.analysisId)
        } else if (data.status === 'failed') {
          reject(new Error('Scan failed'))
        } else {
          setTimeout(tick, intervalMs)
        }
      } catch (e) {
        reject(e)
      }
    }
    tick()
  })
}
```

---

## 4. Multipart upload (file mode)

```ts
export async function createScanWithFiles(formData: FormData) {
  const token = localStorage.getItem('ns-access-token')
  const res = await fetch(`${API_BASE_URL}/scans`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  // ... error handling tương tự
}
```

---

## 5. Tích hợp CVScanPage

Pseudo-flow thay mock timer:

```ts
const scan = await createScan({ cv, jd, config })
await runScan(scan.id)
const analysisId = await pollScanUntilDone(scan.id, (data) => {
  setProgress(data.progressPercent)
  setSteps(data.steps)
})
navigate(`/analysis/${analysisId}`)
```

Giữ UI `AnalysisProgressPanel` — chỉ đổi nguồn progress.

---

## 6. Testing

- Mock API: [MSW](https://mswjs.io/) handlers mirror BE docs
- E2E: Playwright against local FastAPI + FE

---

## 7. Liên quan

- [FE-21-APP-CONTEXT-MAP.md](./FE-21-APP-CONTEXT-MAP.md)
- [../BE/BE-02-AUTH-API.md](../BE/BE-02-AUTH-API.md)
