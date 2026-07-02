# NextStep AI — Backend Documentation

> **Gợi ý thiết kế** — có thể thay đổi khi triển khai thật.  
> Dựa trên FE MVP hiện tại (mock + `localStorage`). Code: `src/`.

## Stack đề xuất

| Thành phần | Lựa chọn |
|------------|----------|
| Framework | **FastAPI** (Python 3.11+) |
| Kiến trúc | **Monolith** — một service, tách module nội bộ |
| Database | **PostgreSQL 15+** |
| ORM | SQLAlchemy 2.x hoặc SQLModel |
| Auth | JWT (access + refresh) |
| File storage | Local dev / S3-compatible prod |
| Queue (tuỳ chọn) | Redis + Celery hoặc FastAPI BackgroundTasks (MVP) |

## Thứ tự đọc

```
1. BE-00-OVERVIEW.md          ← cấu trúc project, env, conventions
2. BE-01-DATA-MODEL.md        ← ERD + script SQL (chạy được)
3. BE-02-AUTH-API.md
4. BE-03-USER-PROFILE-API.md
5. BE-04-CV-SCAN-API.md       ← tạo job, upload, quota
6. BE-05-ANALYSIS-API.md      ← đọc kết quả
7. BE-06-BILLING-API.md
8. BE-07-MOCK-INTERVIEW-API.md
9. BE-08-NOTIFICATIONS-API.md
10. BE-09-AI-INTEGRATION.md   ← hợp đồng với team AI (dễ hiểu)
```

## Map FE → BE

| FE route / feature | BE doc |
|--------------------|--------|
| `/auth` | BE-02 |
| `/profile`, `/settings` | BE-03 |
| `/cv-scan` | BE-04, BE-09 |
| `/analysis`, `/analysis/:id` | BE-05 |
| `/pricing` | BE-06 |
| `/mock-interview` | BE-07, BE-09 |
| Notification bell | BE-08 |
| Dashboard aggregate | BE-03 + BE-05 |

## Tích hợp FE

Xem folder [`../API_Integrate/`](../API_Integrate/).

## Lưu ý

- Phần **AI** (model, training, scoring logic) do team khác — BE chỉ **gọi service AI** và **lưu/trả kết quả** theo contract trong `BE-09-AI-INTEGRATION.md`.
- Schema và endpoint là **draft** align với `src/types/index.ts` và `AppContext.tsx`.
