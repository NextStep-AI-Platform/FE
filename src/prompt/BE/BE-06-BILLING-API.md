# BE-06 — Billing & Plans API

> Nâng cấp Premium/VIP — align FE `/pricing`, `upgradePlan()`

---

## Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/v1/plans` | Bảng giá public |
| GET | `/api/v1/billing/me` | Plan hiện tại + lịch sử |
| POST | `/api/v1/billing/checkout` | Tạo order (mock/real payment) |
| POST | `/api/v1/billing/confirm` | Xác nhận thanh toán mock |
| POST | `/api/v1/billing/webhook/{provider}` | Webhook cổng thanh toán |

---

## Plans (align FE constants)

| Plan | Giá gợi ý | Quyền |
|------|-----------|-------|
| `free` | 0 | 3 scan/tháng |
| `premium` | 49.000₫/tháng · 99.000₫/3 tháng | Unlimited + jobs + courses |
| `vip` | 149.000₫/5 buổi | Premium + 5 buổi phỏng vấn AI |

---

## GET `/plans`

Public — không cần auth.

```json
{
  "plans": [
    {
      "type": "free",
      "name": "Freemium",
      "priceMonthlyVnd": 0,
      "features": ["3 lượt scan/tháng", "Tabs cơ bản"]
    },
    {
      "type": "premium",
      "name": "Premium",
      "priceMonthlyVnd": 49000,
      "priceQuarterlyVnd": 99000,
      "features": ["Unlimited scan", "Công việc phù hợp", "Khoá học"]
    },
    {
      "type": "vip",
      "name": "VIP",
      "pricePackageVnd": 149000,
      "interviewSessions": 5,
      "features": ["Tất cả Premium", "5 buổi Mock Interview"]
    }
  ]
}
```

---

## GET `/billing/me`

**FE thay thế:** `useApp().plan`

```json
{
  "plan": {
    "type": "premium",
    "startedAt": "2026-06-01T00:00:00Z",
    "expiresAt": "2026-07-01T00:00:00Z",
    "interviewSessionsLeft": 0
  },
  "orders": [
    {
      "id": "uuid",
      "planType": "premium",
      "billingCycle": "monthly",
      "amountVnd": 49000,
      "status": "paid",
      "paidAt": "2026-06-01T00:00:00Z"
    }
  ]
}
```

---

## POST `/billing/checkout`

**FE thay thế:** Pricing CTA → modal confirm

### Request

```json
{
  "planType": "premium",
  "billingCycle": "monthly"
}
```

`planType`: `premium` | `vip`  
`billingCycle`: `monthly` | `quarterly` (premium only)

### Response `201` — MVP mock

```json
{
  "orderId": "uuid",
  "status": "pending",
  "amountVnd": 49000,
  "paymentUrl": null,
  "mockConfirmToken": "dev-token-abc"
}
```

Production: `paymentUrl` redirect VNPay/Momo.

---

## POST `/billing/confirm` (MVP mock)

**FE:** sau modal "Xác nhận thanh toán demo"

### Request

```json
{
  "orderId": "uuid",
  "mockConfirmToken": "dev-token-abc"
}
```

### Response `200`

```json
{
  "plan": {
    "type": "premium",
    "startedAt": "2026-06-22T10:00:00Z",
    "expiresAt": "2026-07-22T10:00:00Z",
    "interviewSessionsLeft": 0
  }
}
```

### Side effects (mirror FE `upgradePlan()`)

1. Update `user_plans`
2. Premium: `users.scans_limit` effectively unlimited
3. VIP: `interview_sessions_left = 5`
4. Notification promo success

---

## Webhook (phase sau)

`POST /billing/webhook/vnpay` — verify signature, mark order paid, activate plan.

---

## Expiry job (cron)

Daily check `user_plans.expires_at < NOW()` → downgrade to free.

---

## Errors

| Code | HTTP |
|------|------|
| `INVALID_PLAN` | 400 |
| `ORDER_NOT_FOUND` | 404 |
| `PAYMENT_FAILED` | 402 |
