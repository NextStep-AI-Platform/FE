# FE-20 — API Integration Overview

---

## 1. Hiện trạng FE

| Layer | File | Vai trò |
|-------|------|---------|
| State | `src/contexts/AppContext.tsx` | Auth, scans, plan, notifications |
| Persist | `src/lib/storage.ts` | `localStorage` key `ns-app-state` |
| Mock AI | `src/data/mockAnalysis.ts` | `generateMockResult()` |
| Types | `src/types/index.ts` | Contract dữ liệu |

---

## 2. Kiến trúc mục tiêu

```
Pages / Components
        │
        ▼
   useApp() hook          ← giữ interface, đổi implementation bên trong
        │
        ├── [mock] AppProvider (localStorage)     ← VITE_USE_API=false
        │
        └── [api]  AppProvider
                    │
                    ├── apiClient (fetch/axios)
                    ├── authService
                    ├── scanService
                    └── ...
```

**Option A (khuyến nghị):** Giữ `AppContext` API surface, bên trong gọi services.  
**Option B:** React Query hooks riêng (`useScans()`) — refactor lớn hơn.

---

## 3. Environment

```env
# .env
VITE_USE_API=false
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

```ts
// src/lib/config.ts
export const USE_API = import.meta.env.VITE_USE_API === 'true'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'
```

---

## 4. Token storage

| Key | Nội dung |
|-----|----------|
| `ns-access-token` | JWT access |
| `ns-refresh-token` | JWT refresh |

Không lưu password sau khi có API.

Hydrate on load:

```
App mount → if token → GET /auth/me → set user state
         → else → logged out
```

---

## 5. Error → Toast mapping

Giữ `ToastContext` — map API errors:

| `code` | Toast message |
|--------|---------------|
| `QUOTA_EXCEEDED` | Hết lượt scan — CTA Pricing |
| `INVALID_CREDENTIALS` | Email hoặc mật khẩu không đúng |
| `PLAN_REQUIRED` | Cần gói VIP |
| Network error | Không kết nối được server |

---

## 6. Loading states

| Trang | Hiện tại | Với API |
|-------|----------|---------|
| CV Scan analyzing | Mock progress 2.8s | Poll `GET /scans/{id}` mỗi 1s |
| Analysis list | Instant from context | Skeleton + fetch |
| Login | Sync boolean | async + button loading |

---

## 7. CORS

BE `CORS_ORIGINS` phải include `http://localhost:5173` (Vite dev).

---

## 8. Phase rollout

Xem [FE-24-MIGRATION-CHECKLIST.md](./FE-24-MIGRATION-CHECKLIST.md).

---

## 9. Files FE cần tạo (gợi ý)

```
src/
├── lib/
│   ├── config.ts
│   └── api/
│       ├── client.ts
│       ├── auth.ts
│       ├── scans.ts
│       ├── analysis.ts
│       ├── billing.ts
│       ├── interviews.ts
│       └── notifications.ts
└── contexts/
    └── AppContext.api.tsx   (optional split)
```
