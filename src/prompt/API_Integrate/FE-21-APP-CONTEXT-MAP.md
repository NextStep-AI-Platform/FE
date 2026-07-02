# FE-21 — AppContext → API Mapping

> Bảng thay thế từng method `AppContext` bằng endpoint BE.

---

## Auth

| AppContext method | BE endpoint | Ghi chú |
|-------------------|-------------|---------|
| `register(name, email, password)` | `POST /auth/register` | Lưu tokens, set user |
| `login(email, password)` | `POST /auth/login` | |
| `loginWithGoogleDemo()` | `POST /auth/google` hoặc giữ mock | Phase sau OAuth thật |
| `logout()` | `POST /auth/logout` + clear tokens | |
| `deleteAccount()` | `DELETE /users/me` | |
| *(hydrate)* | `GET /auth/me` | On app load |

---

## User / Profile

| AppContext method | BE endpoint |
|-------------------|-------------|
| `user` (read) | `GET /auth/me` hoặc `GET /users/me` |
| `updateUser(patch)` | `PATCH /users/me` |
| `toggleNotificationSetting(key, enabled)` | `PATCH /users/me/notification-settings` |
| `cvFiles` (read) | `GET /users/me/cv-files` |
| `addCVFile(file)` | Tự động khi upload trong `POST /scans` hoặc endpoint riêng |

---

## Plan / Billing

| AppContext method | BE endpoint |
|-------------------|-------------|
| `plan` (read) | `GET /auth/me` → `plan` |
| `upgradePlan(type, billing)` | `POST /billing/checkout` → `POST /billing/confirm` |
| `isPremium()` | `GET /auth/me` → `isPremium` hoặc derive từ `plan.type` |
| `isVip()` | tương tự |
| `canScan()` | `GET /auth/me` → `scansRemaining > 0` |
| `scansRemaining()` | `GET /auth/me` → `scansRemaining` |

---

## CV Scan / Analysis

| AppContext / Page action | BE endpoint |
|--------------------------|-------------|
| `addScan(scan)` | `POST /scans` + `POST /scans/{id}/run` |
| Poll analyzing UI | `GET /scans/{id}` |
| `scans` (list) | `GET /analysis` |
| AnalysisDetail load | `GET /analysis/{id}` |
| Navigate after scan | `GET /scans/{id}` khi `status=completed` → `/analysis/{id}` |

**Lưu ý:** FE hiện tạo full `ScanRecord` + mock result client-side. Với API:
1. `POST /scans` trả `id`
2. `POST /scans/{id}/run`
3. Poll until done
4. `GET /analysis/{id}` populate detail page

Không cần `generateMockResult()` trên FE nữa.

---

## Notifications

| AppContext method | BE endpoint |
|-------------------|-------------|
| `notifications` | `GET /notifications` |
| `markNotificationRead(id)` | `PATCH /notifications/{id}/read` |
| `markAllNotificationsRead()` | `POST /notifications/read-all` |
| Badge count | `GET /notifications/unread-count` |

---

## Mock Interview

| Page action | BE endpoint |
|-------------|-------------|
| Start session | `POST /interviews` |
| Send answer | `POST /interviews/{id}/messages` |
| Finish | `POST /interviews/{id}/finish` |
| `consumeInterviewSession()` | BE trừ quota server-side — FE refresh `/auth/me` |

---

## State không còn trên client

| Cũ (localStorage) | Mới |
|-------------------|-----|
| `accounts[]` multi-user demo | Server-side only |
| `persisted.scans` global | Per-user API |
| Plain `password` in User | Không lưu FE |

---

## localStorage còn lại (optional)

| Key | Mục đích |
|-----|----------|
| `ns-access-token` | JWT |
| `ns-refresh-token` | JWT |
| `ns-theme` | Theme preference (giữ) |
| ~~`ns-app-state`~~ | Bỏ khi `VITE_USE_API=true` |

---

## Type compatibility

API response fields nên **camelCase** (FastAPI `alias_generator`) để khớp TS:

```python
# Pydantic model_config
model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
```

Hoặc FE map snake_case → camelCase một lần trong client.
