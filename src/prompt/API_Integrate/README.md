# API Integration — Frontend

> Hướng dẫn migrate FE từ mock `localStorage` sang REST API FastAPI.  
> **Gợi ý** — chi tiết implement có thể điều chỉnh khi BE sẵn sàng.

---

## Thứ tự đọc

```
1. FE-20-OVERVIEW.md           ← chiến lược, feature flag
2. FE-21-APP-CONTEXT-MAP.md    ← bảng map mock → API
3. FE-22-API-CLIENT.md         ← client, auth interceptors
4. FE-23-API-TYPES.md          ← TypeScript types / OpenAPI
5. FE-24-MIGRATION-CHECKLIST.md ← phase rollout
```

## BE docs

Xem [`../BE/`](../BE/).

## Nguyên tắc

1. **Giữ UI không đổi** — chỉ đổi data layer
2. **Feature flag** `VITE_USE_API=true` — chạy song song mock/API khi dev
3. **Shape JSON** API response = FE types hiện tại (minimize refactor)
4. **Incremental** — migrate từng module (auth trước, scan sau)
