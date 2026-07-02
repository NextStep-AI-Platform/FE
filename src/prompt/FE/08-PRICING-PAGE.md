# NextStep AI — Pricing Page (MVP Mock Upgrade)
# Prompt #08: PricingPage.tsx

## Prompt to Claude Code

```
Read FE/00-DESIGN-SYSTEM.md first.
Requires AppContext + ToastContext.

Update src/pages/PricingPage.tsx for mock upgrade flow (no real payment).

---

### Upgrade Flow

When user clicks Premium CTA ("Bắt đầu dùng thử"):
1. If already premium/vip → toast.info("Bạn đang sử dụng gói Premium")
2. Else open ConfirmDialog:
   - Title: "Xác nhận nâng cấp Premium"
   - Body: "Demo MVP — không thu phí thật. Gói Premium sẽ được kích hoạt ngay."
   - Show price based on billing toggle (monthly/quarterly)
   - Buttons: Hủy | Xác nhận nâng cấp
3. On confirm:
   - upgradePlan('premium', billing)
   - Set expiresAt: +30 days (monthly) or +90 days (quarterly)
   - toast.success("Nâng cấp Premium thành công", "Bạn đã mở khóa Công việc phù hợp và Khoá học")
   - navigate('/dashboard')

VIP CTA ("Đặt lịch phỏng vấn"):
1. Similar confirm dialog for VIP
2. upgradePlan('vip')
   - Includes premium features
   - interviewSessionsLeft = 5
   - expiresAt = +30 days (optional display)
3. toast.success("Nâng cấp VIP thành công", "Bạn có 5 buổi phỏng vấn AI")
4. navigate('/mock-interview')

---

### Current Plan Display

At top of page, if user logged in:
Card showing:
- "Gói hiện tại: {Free|Premium|VIP}"
- Expiry / sessions remaining
- If Free: highlight upgrade benefits

Disable CTA on current plan card ("Gói hiện tại")

---

### Plan Cards
Keep existing 3-tier layout (Free, Premium, VIP).
Prices unchanged: 49k/99k, 149k/5 buổi.

FAQ section unchanged.

---

### Technical
- useApp(), useToast()
- ConfirmDialog inline component ok for MVP
- No payment gateway UI needed for MVP
```
