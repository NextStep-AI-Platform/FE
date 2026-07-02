# NextStep AI — Onboarding Guideline (LOW PRIORITY)
# Prompt #14: User tutorial — implement AFTER MVP demo

> **Priority: P3** — User requested this after core flows complete.

## Concept

Step-by-step spotlight tour for **new users** after first login.
User can dismiss any step with "Đã hiểu" → ends entire tour.

---

## Trigger

```ts
if (isAuthenticated && !hasSeenOnboarding) showGuideline()
```

Set `hasSeenOnboarding = true` when:
- User clicks "Đã hiểu" on any step
- User completes all steps
- User clicks "Bỏ qua hướng dẫn"

Store in AppContext / localStorage.

---

## Proposed Steps (5 steps)

| Step | Target element | Message |
|------|----------------|---------|
| 1 | Sidebar "Phân tích CV" | "Bắt đầu tại đây — tải CV và JD để nhận đánh giá từ AI" |
| 2 | Dashboard scan quota banner | "Gói miễn phí có 3 lượt scan/tháng. Nâng cấp để không giới hạn" |
| 3 | Sidebar "Kết quả phân tích" | "Xem lại tất cả lần phân tích và so sánh điểm số" |
| 4 | Sidebar "Nâng cấp" | "Mở khóa gợi ý công việc, khoá học và phỏng vấn AI" |
| 5 | Topbar avatar | "Quản lý hồ sơ, lịch sử CV và cài đặt tài khoản" |

---

## UI Pattern

- Overlay: `bg-black/50` with cutout highlight around target (CSS box-shadow trick or library)
- Tooltip card anchored near target:
  - Step indicator: "1/5"
  - Title + description
  - Buttons: "Tiếp theo" | "Đã hiểu" (skip all)
- Optional: "Bỏ qua hướng dẫn" link

---

## Implementation Options (when ready)

1. **Lightweight custom** — useState step index + getBoundingClientRect positioning
2. **Library** — react-joyride (only if user approves adding dependency)

Recommendation for MVP+1: custom lightweight (no new deps).

---

## Prompt stub (future)

```
Read FE/00-DESIGN-SYSTEM.md.
Implement src/components/OnboardingGuideline.tsx
Wire in AppLayout after auth check.
Follow steps table in src/prompt/FE/14-ONBOARDING-GUIDELINE.md
```
