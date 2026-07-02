# BE-00 — Overview (FastAPI Monolith)

> Gợi ý kiến trúc backend. Chi tiết endpoint xem từng file BE-02 … BE-09.

---

## 1. Mục tiêu

Cung cấp REST API thay thế dần mock `localStorage` trên FE, giữ **cùng shape dữ liệu** với `src/types/index.ts` để migrate ít đổi UI.

---

## 2. Cấu trúc project đề xuất

```
nextstep-api/
├── app/
│   ├── main.py                 # FastAPI app, CORS, lifespan
│   ├── core/
│   │   ├── config.py           # Settings từ env
│   │   ├── security.py         # JWT, hash password
│   │   └── deps.py             # get_db, get_current_user
│   ├── models/                 # SQLAlchemy models
│   ├── schemas/                # Pydantic request/response
│   ├── api/
│   │   └── v1/
│   │       ├── router.py
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── scans.py
│   │       ├── analysis.py
│   │       ├── billing.py
│   │       ├── interviews.py
│   │       └── notifications.py
│   ├── services/               # Business logic
│   │   ├── scan_service.py
│   │   ├── quota_service.py
│   │   └── ai_client.py        # Gọi AI service (BE-09)
│   └── db/
│       ├── session.py
│       └── migrations/         # Alembic
├── scripts/
│   └── init_db.sql             # Copy từ BE-01-DATA-MODEL.md
├── tests/
├── .env.example
├── pyproject.toml
└── README.md
```

---

## 3. Environment variables

```env
# App
APP_NAME=NextStep API
APP_ENV=development
API_V1_PREFIX=/api/v1
CORS_ORIGINS=http://localhost:5173

# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/nextstep

# JWT
JWT_SECRET=change-me-in-production
JWT_ACCESS_EXPIRE_MINUTES=30
JWT_REFRESH_EXPIRE_DAYS=7

# Storage
STORAGE_TYPE=local          # local | s3
STORAGE_LOCAL_PATH=./uploads
# S3_BUCKET=...
# S3_REGION=...

# AI service (team khác host)
AI_SERVICE_BASE_URL=http://localhost:8001
AI_SERVICE_API_KEY=optional-shared-secret
AI_CALLBACK_SECRET=webhook-secret

# Billing (phase sau)
PAYMENT_PROVIDER=mock       # mock | vnpay | momo
```

---

## 4. Conventions API

| Quy ước | Giá trị |
|---------|---------|
| Base URL | `/api/v1` |
| Auth header | `Authorization: Bearer <access_token>` |
| Content-Type | `application/json` (trừ upload: `multipart/form-data`) |
| ID format | UUID v4 string |
| Datetime | ISO 8601 UTC (`2026-06-22T10:00:00Z`) |
| Pagination | `?page=1&limit=20` |
| Sort | `?sort=-analyzed_at` (desc) |

### Error response (chuẩn)

```json
{
  "code": "QUOTA_EXCEEDED",
  "message": "Bạn đã hết 3 lượt scan miễn phí trong tháng này.",
  "details": {}
}
```

| HTTP | Khi nào |
|------|---------|
| 400 | Validation lỗi |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | Không đủ quyền (plan gate) |
| 404 | Không tìm thấy resource |
| 409 | Conflict (email đã tồn tại) |
| 422 | Pydantic validation |
| 429 | Rate limit |
| 500 | Lỗi server |

---

## 5. Plan & quota (align FE)

| Plan | Scan/tháng | Jobs + Courses tab | Mock Interview |
|------|------------|--------------------|----------------|
| `free` | 3 | ❌ | ❌ |
| `premium` | ∞ | ✅ | ❌ |
| `vip` | ∞ | ✅ | ✅ (5 buổi/gói mock) |

Logic quota hiện tại FE: `scansUsed` + `scansMonthKey` reset theo tháng — BE mirror trong bảng `users` hoặc `scan_quota`.

---

## 6. Luồng scan CV (tóm tắt)

```
FE POST /scans          → BE lưu draft + upload file
FE POST /scans/{id}/run → BE check quota → gọi AI service (async)
FE GET  /scans/{id}     → poll status (pending → processing → completed)
AI callback/webhook     → BE lưu result JSON → status completed
FE GET  /analysis/{id}  → trả full result cho UI
```

Chi tiết AI: `BE-09-AI-INTEGRATION.md`.

---

## 7. Dev local

```bash
# PostgreSQL
createdb nextstep
psql -d nextstep -f scripts/init_db.sql

# API
cd nextstep-api
pip install -e .
uvicorn app.main:app --reload --port 8000
```

Swagger UI: `http://localhost:8000/docs`

---

## 8. Phase triển khai gợi ý

| Phase | Module | Ghi chú |
|-------|--------|---------|
| 1 | Auth + User | JWT, profile cơ bản |
| 2 | Scan + Analysis read | Upload, mock AI trả về fixed JSON |
| 3 | Billing mock | Upgrade plan |
| 4 | Notifications | |
| 5 | Interview + AI thật | Khi AI service sẵn sàng |
| 6 | Payment gateway | VNPay/Momo |

---

## 9. Liên quan

- Schema SQL: [BE-01-DATA-MODEL.md](./BE-01-DATA-MODEL.md)
- Tích hợp FE: [../API_Integrate/](../API_Integrate/)
