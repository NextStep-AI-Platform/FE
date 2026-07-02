# BE-08 — Notifications API

> Align FE notification bell trong `AppLayout`

---

## Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/v1/notifications` | Danh sách |
| PATCH | `/api/v1/notifications/{id}/read` | Đánh dấu đã đọc |
| POST | `/api/v1/notifications/read-all` | Đọc tất cả |
| GET | `/api/v1/notifications/unread-count` | Badge số |

---

## GET `/notifications`

**FE thay thế:** `useApp().notifications`

### Query

`?limit=20&unreadOnly=false`

### Response

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Chào mừng đến NextStep AI",
      "body": "Bắt đầu bằng cách tải CV...",
      "read": false,
      "createdAt": "2026-06-22T10:00:00Z",
      "type": "success"
    }
  ],
  "unreadCount": 2
}
```

---

## PATCH `/notifications/{id}/read`

**FE:** `markNotificationRead(id)`

Response `200` — notification updated.

---

## POST `/notifications/read-all`

**FE:** `markAllNotificationsRead()`

Response `204`.

---

## GET `/notifications/unread-count`

Lightweight cho badge header:

```json
{ "count": 2 }
```

---

## System notifications (BE tạo)

| Event | Notification |
|-------|--------------|
| Register | Welcome + 3 lượt scan + promo Premium |
| Scan completed | "Kết quả phân tích sẵn sàng" |
| Plan upgraded | "Chúc mừng! Bạn đã nâng cấp Premium" |
| Plan expiring | "Gói sắp hết hạn trong 3 ngày" |
| Quota 1 lượt còn lại | Nhắc free user |

Settings `notification_settings` điều khiển email/push sau này — in-app vẫn hiển thị.

---

## Real-time (optional)

WebSocket `/ws/notifications` hoặc polling 30s — MVP dùng fetch khi mở dropdown.
