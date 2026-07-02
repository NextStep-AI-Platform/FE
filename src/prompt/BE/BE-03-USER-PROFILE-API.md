# BE-03 — User & Profile API

> Profile, avatar, settings, xóa tài khoản — align FE `/profile`

---

## Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/v1/users/me` | Profile đầy đủ |
| PATCH | `/api/v1/users/me` | Cập nhật profile |
| POST | `/api/v1/users/me/avatar` | Upload avatar |
| DELETE | `/api/v1/users/me` | Xóa tài khoản |
| GET | `/api/v1/users/me/cv-files` | Lịch sử file CV |
| PATCH | `/api/v1/users/me/notification-settings` | Toggle thông báo |

---

## GET `/users/me`

**FE thay thế:** `useApp().user` + `plan`

Response gộp user + plan + quota (có thể trùng `/auth/me` — chọn một endpoint canonical).

---

## PATCH `/users/me`

**FE thay thế:** `AppContext.updateUser()`

### Request (partial)

```json
{
  "name": "Bin",
  "phone": "0901234567",
  "location": "Hà Nội",
  "bio": "Frontend dev",
  "targetRole": "Frontend Developer",
  "targetIndustry": "Công nghệ thông tin"
}
```

### Response `200`

User object đầy đủ.

---

## POST `/users/me/avatar`

**FE:** tab Profile upload avatar

### Request

`multipart/form-data`: `file` (image/jpeg, image/png, max 2MB)

### Response `200`

```json
{
  "avatarUrl": "/api/v1/media/avatars/{user_id}.jpg"
}
```

Lưu file → `storage_path`, cập nhật `users.avatar_url`.

---

## DELETE `/users/me`

**FE thay thế:** `AppContext.deleteAccount()`

### Behavior

1. Soft delete `users.deleted_at = NOW()`
2. Revoke all refresh tokens
3. (Tuỳ chính sách) giữ scan history anonymized hoặc cascade delete

### Response `204`

FE logout → redirect `/`.

---

## GET `/users/me/cv-files`

**FE thay thế:** `useApp().cvFiles`

### Response `200`

```json
{
  "items": [
    {
      "id": "uuid",
      "userId": "uuid",
      "fileName": "CV_Bin.pdf",
      "fileSize": 245000,
      "mimeType": "application/pdf",
      "uploadedAt": "2026-06-20T08:00:00Z"
    }
  ]
}
```

---

## PATCH `/users/me/notification-settings`

**FE thay thế:** `toggleNotificationSetting()`

### Request

```json
{
  "monthlyScan": true,
  "featureUpdates": false,
  "careerNews": true
}
```

Keys align `NOTIFICATION_SETTING_LABELS` trong `constants/index.ts`.

---

## Dashboard aggregate (không endpoint riêng bắt buộc)

Dashboard FE cần:
- Latest scan score → `GET /analysis?limit=1`
- Scans remaining → `/auth/me`
- Company/course counts → từ latest premium scans

Có thể thêm sau: `GET /dashboard/summary` nếu muốn 1 call.
