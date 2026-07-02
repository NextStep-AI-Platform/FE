# FE-23 — API Types & OpenAPI

> Đồng bộ TypeScript FE với contract BE — tránh drift.

---

## 1. Nguồn truth (hiện tại)

| File | Vai trò |
|------|---------|
| `src/types/index.ts` | Types FE đang dùng |
| `src/prompt/BE/BE-*.md` | Request/response mẫu |
| FastAPI `/docs` | OpenAPI runtime (khi BE có) |

**Khuyến nghị sau:** BE export `openapi.json` → generate TS types.

---

## 2. Types cần mở rộng cho API layer

```ts
// src/types/api.ts (gợi ý — tạo khi integrate)

export interface ApiErrorBody {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface AuthMeResponse {
  user: import('./index').User
  plan: import('./index').PlanInfo
  scansRemaining: number
  isPremium: boolean
  isVip: boolean
}

export interface ScanStatusResponse {
  id: string
  status: 'draft' | 'pending' | 'processing' | 'completed' | 'failed'
  progressPercent: number
  currentStep: number
  steps: { label: string; status: 'pending' | 'active' | 'done' }[]
  overallScore?: number
  analysisId?: string
  analyzedAt?: string
  errorMessage?: string
}

export interface AnalysisListItem {
  id: string
  userId: string
  title: string
  role: string
  company: string
  overallScore: number
  analyzedAt: string
  cvInput: import('./index').DocumentInput
  jdInput: import('./index').DocumentInput
  config: import('./index').ScanConfig
}

export interface AnalysisDetailResponse extends AnalysisListItem {
  result: import('./index').CVAnalysisResult
}
```

---

## 3. User type — bỏ password khi API

```ts
// API User không có password field
export type ApiUser = Omit<User, 'password'>
```

`AppContext` internal có thể map `ApiUser` → `User` với password rỗng nếu cần giữ type cũ tạm thời.

---

## 4. Generate từ OpenAPI (khi BE ready)

```bash
# Ví dụ openapi-typescript
npx openapi-typescript http://localhost:8000/openapi.json -o src/types/generated-api.ts
```

Hoặc `@hey-api/openapi-ts` — team chọn tool.

---

## 5. Validation runtime (optional)

Zod schemas mirror Pydantic — validate response trước khi render:

```ts
import { z } from 'zod'

export const CVScoreSchema = z.object({
  overall: z.number(),
  ats: z.number(),
  keyword: z.number(),
  experience: z.number(),
  presentation: z.number(),
})
```

Hữu ích giai đoạn đầu khi BE/AI contract còn thay đổi.

---

## 6. Enum sync

| TS | PostgreSQL / API |
|----|------------------|
| `PlanType` | `free` \| `premium` \| `vip` |
| `DocumentInputMode` | `file` \| `text` |
| Scan status | + `draft`, `pending`, `processing`, `failed` (mới so với FE) |

Thêm vào `types/index.ts` khi integrate:

```ts
export type ScanStatus = 'draft' | 'pending' | 'processing' | 'completed' | 'failed'
```

---

## 7. AI result schema

`CVAnalysisResult` giữ nguyên — AI team cam kết trong [BE-09-AI-INTEGRATION.md](../BE/BE-09-AI-INTEGRATION.md).

Nếu AI thêm field mới → optional trên FE, không break UI.

---

## 8. Liên quan

- [FE-21-APP-CONTEXT-MAP.md](./FE-21-APP-CONTEXT-MAP.md)
- [../BE/BE-01-DATA-MODEL.md](../BE/BE-01-DATA-MODEL.md)
