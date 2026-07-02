# NextStep AI — MVP FE Checklist

> Cập nhật: 2026-06-22  
> Mục tiêu: Demo MVP end-to-end với mock data, localStorage, không BE/AI.

---

## Phase 0 — Global Infrastructure ( làm trước )

| # | Task | File chính | Priority |
|---|------|------------|----------|
| 0.1 | Toast system (provider + hook + UI) | `src/contexts/ToastContext.tsx`, `src/components/ToastContainer.tsx` | P0 |
| 0.2 | App state (auth, user, plan, scans, cvFiles, notifications) | `src/contexts/AppContext.tsx` | P0 |
| 0.3 | localStorage persist + hydrate | `src/lib/storage.ts` | P0 |
| 0.4 | Auth guard wrapper | `src/components/AuthGuard.tsx` | P0 |
| 0.5 | Dùng logo `src/picture/logo.png` + component `BrandName` (wordmark text) | assets | P0 |
| 0.6 | Cập nhật routes (`/analysis`, `/analysis/:id`) | `src/App.tsx` | P0 |
| 0.7 | Types mở rộng (ScanSession, CVFile, Plan, Notification) | `src/types/index.ts` | P0 |
| 0.8 | Mock data presets theo ngành/vị trí | `src/data/mockAnalysis.ts` | P1 |

---

## Phase 1 — Auth & Landing

| # | Task | Priority |
|---|------|----------|
| 1.1 | Landing CTA "Phân tích CV miễn phí" → `/auth` | P0 |
| 1.2 | Register → toast success → chuyển tab Login (không vào dashboard) | P0 |
| 1.3 | Login → toast success → `/dashboard` | P0 |
| 1.4 | Validate form + toast lỗi inline | P0 |
| 1.5 | Persist session sau login (localStorage) | P0 |
| 1.6 | Google OAuth → toast "Tính năng sắp ra mắt" | P2 |

---

## Phase 2 — App Shell

| # | Task | Priority |
|---|------|----------|
| 2.1 | Logo image thay chữ "N" gradient | P0 |
| 2.2 | Đổi nav "Kết quả CV" → "Kết quả phân tích" → `/analysis` | P0 |
| 2.3 | Plan badge trên topbar (Free/Premium/VIP + hết hạn) | P0 |
| 2.4 | Notification bell → dropdown mock notifications | P0 |
| 2.5 | Light theme hoàn thiện (semantic text/border/input) | P0 |
| 2.6 | Fix route `/settings` → redirect `/profile?tab=settings` hoặc tab settings | P1 |

---

## Phase 3 — CV Scan Page (redesign)

| # | Task | Priority |
|---|------|----------|
| 3.1 | Layout 2 cột CV \| JD (responsive stack) | P0 |
| 3.2 | Mỗi cột: toggle Upload \| Paste text | P0 |
| 3.3 | Upload PDF/DOCX cho CV và JD | P0 |
| 3.4 | CV history list (file uploads only, >1 lần) | P0 |
| 3.5 | Config: Tên công ty* (required, user nhập — không auto-fill JD) | P0 |
| 3.6 | Config: Ngành/Vị trí optional + option "Khác" + custom input | P1 |
| 3.7 | Config: Kinh nghiệm — range "Từ X năm" / "Đến Y năm" (2 input) | P1 |
| 3.8 | Analyze → mock loading → tạo scan record → navigate `/analysis/:id` | P0 |
| 3.9 | Quota free hết → blur trang + popup upsell Premium | P0 |

---

## Phase 4 — Analysis List (`/analysis`)

| # | Task | Priority |
|---|------|----------|
| 4.1 | Tạo `AnalysisListPage.tsx` | P0 |
| 4.2 | List item: `CS_{role}_{company}` · score/100 · date | P0 |
| 4.3 | Search theo tên scan | P0 |
| 4.4 | Date range filter (2 date pickers) | P0 |
| 4.5 | Click item → `/analysis/:id` | P0 |
| 4.6 | Empty state khi chưa có scan | P1 |

---

## Phase 5 — Analysis Detail (`/analysis/:id`)

| # | Task | Priority |
|---|------|----------|
| 5.1 | Tạo `AnalysisDetailPage.tsx` (tách từ CVResultPage) | P0 |
| 5.2 | **Bỏ** nút "Scan lại" | P0 |
| 5.3 | Tab Tổng quan: metric labels Tiếng Việt + tooltip `!` | P0 |
| 5.4 | Tab Tổng quan: 2 section xem CV/JD (dialog scroll / download docx) | P0 |
| 5.5 | Tab Kiểm tra ATS: layout 1:2 hoặc 1:3 (điểm trái, issues phải) | P0 |
| 5.6 | Tab Sự tương thích: keyword + experience badges + AI comment | P0 |
| 5.7 | Tab Cải thiện: giữ nguyên pattern hiện tại | P0 |
| 5.8 | Tab Công việc phù hợp: scans lịch sử user ≥70 + tag "Phù hợp với bạn" | P0 |
| 5.9 | Tab Khoá học: external links + tooltip `!` lý do đề xuất | P0 |
| 5.10 | Premium gate tabs Công việc + Khoá học | P0 |

---

## Phase 6 — Profile & Settings

| # | Task | Priority |
|---|------|----------|
| 6.1 | Avatar upload + fallback initials | P0 |
| 6.2 | Tab Lịch sử CV: chỉ file uploads, bỏ "Scan mới" | P0 |
| 6.3 | Toggle thông báo → toast bật/tắt | P0 |
| 6.4 | Xóa tài khoản: confirm dialog → clear storage → landing + toast | P0 |
| 6.5 | Hiển thị plan tag + ngày hết hạn / buổi VIP còn lại | P0 |

---

## Phase 7 — Pricing & Plans

| # | Task | Priority |
|---|------|----------|
| 7.1 | Mock upgrade flow Premium (modal confirm) | P0 |
| 7.2 | Mock upgrade flow VIP | P0 |
| 7.3 | Cập nhật plan context + toast + badge toàn app | P0 |
| 7.4 | VIP unlock Mock Interview page | P0 |

---

## Phase 8 — Mock Interview

| # | Task | Priority |
|---|------|----------|
| 8.1 | VIP gate (paywall nếu chưa VIP) | P0 |
| 8.2 | Full flow setup → chat → result (đã có code, nối plan) | P0 |
| 8.3 | Đếm buổi VIP còn lại (mock) | P1 |

---

## Phase 9 — Low Priority (sau MVP demo)

| # | Task | Priority |
|---|------|----------|
| 9.1 | Onboarding guideline step-by-step | P3 |
| 9.2 | Export PDF báo cáo | P3 |
| 9.3 | Google OAuth thật | P3 |

---

## Phase 10 — UI Polish (✅ 2026-06-22)

| # | Task | File | Status |
|---|------|------|--------|
| 10.1 | ScrollReveal landing + public pages | `ScrollReveal.tsx`, `LandingPage`, `AboutPage`, `PrivacyPage` | ✅ |
| 10.2 | Hover badge/card (`.badge-pill`, `.card-interactive`) | `index.css`, `AppLayout`, `DashboardPage` | ✅ |
| 10.3 | Light theme border/text neutral đen | `index.css`, `.keep-accent` | ✅ |
| 10.4 | Docs: `17-ANIMATIONS-RESPONSIVE.md`, README index | `src/prompt/FE/` | ✅ |

---

## Phase 11 — Backend & API (docs ✅ — implement sau)

| # | Task | Doc | Status |
|---|------|-----|--------|
| 11.1 | BE specs FastAPI + PostgreSQL | `src/prompt/BE/` | ✅ docs |
| 11.2 | AI integration contract | `BE/BE-09-AI-INTEGRATION.md` | ✅ docs |
| 11.3 | FE API integration guide | `src/prompt/API_Integrate/` | ✅ docs |
| 11.4 | Implement FastAPI service | — | ☐ |
| 11.5 | Migrate FE off localStorage | `FE-24-MIGRATION-CHECKLIST.md` | ☐ |

---

## Implementation Order (đề xuất)

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 7 → Phase 6 → Phase 8
```

---

## Decisions (đã xác nhận — 2026-06-22)

| # | Quyết định |
|---|------------|
| Logo | `src/picture/logo.png` + `<BrandName />` |
| CS_ | **Coverage Score** — độ phủ/matching CV–JD |
| Tên công ty | User nhập bắt buộc; không parse từ JD |
| Kinh nghiệm | Range: **Từ X năm** → **Đến Y năm** |
| Hết quota free | Blur + popup yêu cầu nâng cấp Premium |
| Công việc phù hợp | Các scan trong lịch sử user (overall ≥ 70) |
| Register | Success → chuyển tab Login (không vào dashboard) |
