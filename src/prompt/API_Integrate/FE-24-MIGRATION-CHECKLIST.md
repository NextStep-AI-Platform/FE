# FE-24 — Migration Checklist

> Rollout từ mock → API theo phase. Tick khi xong.

---

## Phase 0 — Chuẩn bị

- [ ] Tạo `src/lib/config.ts` (`VITE_USE_API`, `VITE_API_BASE_URL`)
- [ ] Tạo `src/lib/api/client.ts`
- [ ] `.env.example` cập nhật
- [ ] BE chạy local + SQL init ([BE-01](../BE/BE-01-DATA-MODEL.md))
- [ ] CORS OK (login test bằng curl/Postman)

---

## Phase 1 — Auth

- [ ] `login` → `POST /auth/login`
- [ ] `register` → `POST /auth/register`
- [ ] `logout` → `POST /auth/logout` + clear tokens
- [ ] App load → `GET /auth/me` hydrate
- [ ] `AuthGuard` chờ hydrate xong (loading spinner)
- [ ] Xóa lưu password plain text
- [ ] Google demo: giữ mock hoặc stub endpoint

**Verify:** Register → login → F5 vẫn logged in → logout

---

## Phase 2 — Profile

- [ ] `updateUser` → `PATCH /users/me`
- [ ] Avatar upload → `POST /users/me/avatar`
- [ ] Notification settings → `PATCH .../notification-settings`
- [ ] `deleteAccount` → `DELETE /users/me`
- [ ] CV files list → `GET /users/me/cv-files`

**Verify:** Profile tab save, settings toggle persist

---

## Phase 3 — Scan & Analysis

- [ ] `CVScanPage` → `POST /scans` + `/run` + poll
- [ ] Progress UI từ `GET /scans/{id}.steps`
- [ ] Quota exceeded → popup Pricing
- [ ] `AnalysisListPage` → `GET /analysis`
- [ ] `AnalysisDetailPage` → `GET /analysis/{id}`
- [ ] Premium tabs gate từ server response
- [ ] Bỏ `generateMockResult()` khi `USE_API=true`

**Verify:** Full flow scan → list → detail tabs

---

## Phase 4 — Billing

- [ ] `PricingPage` → checkout + confirm mock
- [ ] `upgradePlan` → API billing
- [ ] Plan badge AppLayout refresh sau upgrade
- [ ] VIP unlock mock interview

**Verify:** Free → Premium → tabs jobs/courses mở

---

## Phase 5 — Notifications

- [ ] Bell dropdown → `GET /notifications`
- [ ] Mark read / read all
- [ ] Unread badge count

---

## Phase 6 — Mock Interview

- [ ] VIP check từ `/auth/me`
- [ ] Session CRUD + messages API
- [ ] Finish report display
- [ ] Sessions left decrement

---

## Phase 7 — Cleanup

- [ ] `VITE_USE_API=true` default trên staging
- [ ] Remove hoặc isolate mock `AppContext` localStorage path
- [ ] Remove `ns-app-state` migration code
- [ ] E2E tests critical paths
- [ ] Update `src/prompt/FE/MVP-CHECKLIST.md` — API phase

---

## Rollback plan

Giữ `VITE_USE_API=false` → full mock offline demo bất cứ lúc nào.

---

## Test matrix

| Flow | Mock | API |
|------|------|-----|
| Register + login | ✅ | ☐ |
| Scan CV text | ✅ | ☐ |
| Scan CV file | ✅ | ☐ |
| Quota block | ✅ | ☐ |
| Upgrade Premium | ✅ | ☐ |
| VIP interview | ✅ | ☐ |
| Delete account | ✅ | ☐ |
| Light theme | ✅ | ☐ |

---

## Liên quan

- [FE-20-OVERVIEW.md](./FE-20-OVERVIEW.md)
- [FE-21-APP-CONTEXT-MAP.md](./FE-21-APP-CONTEXT-MAP.md)
- [../BE/README.md](../BE/README.md)
