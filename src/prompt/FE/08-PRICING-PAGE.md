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
   - toast.success("Nâng cấp Premium thành công", "Đã mở khóa gợi ý công ty phù hợp và khoá học")
   - navigate('/dashboard')

VIP CTA ("Nâng cấp VIP"):
1. Similar confirm dialog for VIP
2. upgradePlan('vip')
   - Includes premium features
   - interviewSessionsLeft = 5
   - expiresAt = +30 days (optional display)
3. toast.success("Nâng cấp VIP thành công", "5 buổi phỏng vấn AI — vào tab Phỏng vấn AI để bắt đầu")
4. navigate('/mock-interview')

---

### Current Plan Display

At top of page, if user logged in:
Card showing:
- "Gói hiện tại: {Free|Premium|VIP}"
- Expiry / sessions remaining
- If Free: highlight upgrade benefits

Disable CTA on current plan card only — label **"Gói hiện tại"**. Các gói khác: nút disabled (không ghi "Đã nâng cấp" trên gói không active).

**Billing toggle 3 tháng:** cập nhật giá **cả Premium và VIP**:
- Premium: 49.000/tháng · 99.000/3 tháng
- VIP: 149.000/5 buổi · 299.000/3 tháng

**Hiển thị giá card:** chỉ số tiền + badge "Tiết kiệm 30%" (toggle 3 tháng, badge xuống dòng dưới giá). Không hiển thị `/3 tháng`, `/5 buổi` hay giá theo lượt dưới số tiền.

Logic: `planButton(current, target)` trong `PricingPage.tsx`.

FAQ section unchanged.

**Light theme (2026-07-03):** Plan cards `pricing-plan-card`, VIP `pricing-vip-card`, stats `pricing-stat-tile`, FAQ `faq-item`. Icon tiles `stat-icon-tile-*` + `keep-accent`.

---

### Technical
- useApp(), useToast()
- ConfirmDialog inline component ok for MVP
- No payment gateway UI needed for MVP
```
