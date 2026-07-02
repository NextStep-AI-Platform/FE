# BE-02 — Auth API

> FastAPI · JWT · align FE `/auth`

---

## Endpoints

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/api/v1/auth/register` | ❌ | Đăng ký |
| POST | `/api/v1/auth/login` | ❌ | Đăng nhập email/password |
| POST | `/api/v1/auth/refresh` | ❌ | Lấy access token mới |
| POST | `/api/v1/auth/logout` | ✅ | Revoke refresh token |
| POST | `/api/v1/auth/google` | ❌ | OAuth Google (phase sau) |
| GET | `/api/v1/auth/me` | ✅ | User hiện tại + plan |

---

## POST `/auth/register`

**FE thay thế:** `AppContext.register()`

### Request

```json
{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "password123"
}
```

### Validation

| Field | Rule |
|-------|------|
| email | lowercase trim, valid email, unique |
| password | min 8 ký tự (FE hiện 8; login min 6 — BE nên thống nhất 8) |
| name | trim, min 2 ký tự |

### Response `201`

```json
{
  "user": {
    "id": "uuid",
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "plan": "free",
    "scansUsed": 0,
    "scansLimit": 3,
    "scansMonthKey": "2026-06",
    "createdAt": "2026-06-22T10:00:00Z",
    "notificationSettings": {
      "monthlyScan": true,
      "featureUpdates": true,
      "careerNews": false
    }
  },
  "plan": {
    "type": "free",
    "startedAt": null,
    "expiresAt": null,
    "interviewSessionsLeft": 0
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### Side effects

1. Insert `users` + `user_plans` (free)
2. Insert `notification_settings` defaults
3. Insert 3 welcome `notifications` (mirror FE `createWelcomeNotifications()`)

### Errors

| Code | HTTP |
|------|------|
| `EMAIL_EXISTS` | 409 |

---

## POST `/auth/login`

**FE thay thế:** `AppContext.login()`

### Request

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response `200`

Cùng shape với register (không tạo user mới).

### Errors

| Code | HTTP |
|------|------|
| `INVALID_CREDENTIALS` | 401 |

---

## POST `/auth/refresh`

### Request

```json
{ "refreshToken": "..." }
```

### Response `200`

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

## POST `/auth/logout`

**FE thay thế:** `AppContext.logout()`

Revoke refresh token hiện tại. FE xóa token local.

---

## GET `/auth/me`

**FE dùng khi:** hydrate session sau F5

### Response `200`

```json
{
  "user": { "...": "User object" },
  "plan": { "...": "PlanInfo" },
  "scansRemaining": 2,
  "isPremium": false,
  "isVip": false
}
```

---

## POST `/auth/google` (phase sau)

**FE hiện tại:** `loginWithGoogleDemo()` → `demo@nextstep.ai`

Phase 1: có thể giữ endpoint trả demo user cố định cho dev.  
Phase 2: verify Google ID token, upsert user.

---

## JWT payload gợi ý

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "plan": "free",
  "exp": 1710000000
}
```

---

## Security notes

- Password: bcrypt hoặc argon2 — **không** lưu plain text (FE mock hiện lưu plain trong localStorage)
- Rate limit login: 5 req/phút/IP
- HTTPS bắt buộc production
