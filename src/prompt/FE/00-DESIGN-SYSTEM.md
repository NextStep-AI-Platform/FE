# NextStep AI — Design System Master

> **LOGIC:** Khi build một page cụ thể, đọc file tương ứng trong `src/prompt/FE/` trước.  
> File prompt **override** quy tắc chung ở đây nếu có mâu thuẫn.  
> MVP hiện tại: **FE only, mock data, localStorage persistence.**

**Project:** NextStep AI  
**Updated:** 2026-06-22  
**Category:** SaaS — AI Career Platform (Vietnam)  
**Stack:** React 19 + TypeScript + Vite + Tailwind CSS + React Router 7

---

## 1. Product Concept

NextStep AI giúp người tìm việc:
- Scan & chấm điểm CV theo ngành/vị trí/JD
- Nhận insight ATS, từ khóa, kinh nghiệm, đề xuất cải thiện
- (Premium) Gợi ý công việc phù hợp, khoá học bên thứ ba
- (VIP) Luyện phỏng vấn AI

**Ngôn ngữ UI:** 100% Tiếng Việt (label metric, tab, toast, tooltip).

---

## 2. Brand Identity

| Element | Spec |
|---------|------|
| Logo | `public/picture/logo.png` — qua component `LogoMark` |
| Import | `import logoMark from '@/picture/logo.png'` |
| Wordmark text | `<BrandName />` — component `src/components/BrandName.tsx` |
| Brand gradient | `.brand-gradient-text` / `.brand-gradient-text-alt` — purple `#C77DFF → #9D4EDD → #7B2CBF` (khớp logo) |
| Logo usage | Sidebar/Landing/Auth: logoMark 32–40px + BrandName bên cạnh · Không dùng `name.png` |
| Tone | Chuyên nghiệp, thân thiện, hướng hành động, không jargon quá mức |

---

## 3. Color System (Dark-first + Light mode)

### 3.1 Dark mode (default)

| Token CSS | Tailwind utility | Hex | Usage |
|-----------|------------------|-----|-------|
| `--ns-bg-page` | `bg-ns-page` | `#0F172A` | Page background |
| `--ns-bg-card` | `bg-ns-card` | `#1E293B` | Cards, sidebar |
| `--ns-bg-raised` | `bg-ns-raised` | `#334155` | Hover, progress track |
| `--ns-border` | `border-ns` | `#334155` | Borders |
| `--ns-border-sub` | `border-ns-sub` | `#1E293B` | Subtle dividers |
| `--ns-text-primary` | `text-white` | `#F8FAFC` | Headings, values |
| `--ns-text-secondary` | `text-slate-300` | `#CBD5E1` | Body |
| `--ns-text-muted` | `text-slate-400` | `#94A3B8` | Labels, meta |
| `--ns-text-faint` | `text-slate-500` | `#64748B` | Hints, timestamps |
| `--ns-accent` | `text-blue-400` | `#60A5FA` | Links, active nav |
| `--ns-cta-from` | `from-blue-500` | `#3B82F6` | Gradient CTA |
| `--ns-cta-to` | `to-blue-700` | `#1D4ED8` | Gradient CTA |
| `--ns-success` | `text-green-400` | `#4ADE80` | Success toast/score |
| `--ns-warning` | `text-yellow-400` | `#FACC15` | Warning, quota |
| `--ns-error` | `text-red-400` | `#F87171` | Error toast |
| `--ns-premium` | `text-yellow-400` | VIP badge accent |
| `--ns-vip` | `text-purple-400` | VIP accent |

### 3.2 Light mode (`html.light`)

| Token CSS | Hex | Usage |
|-----------|-----|-------|
| `--ns-bg-page` | `#F1F5F9` | Page — không dùng trắng thuần |
| `--ns-bg-card` | `#FFFFFF` | Cards |
| `--ns-bg-raised` | `#E2E8F0` | Raised surfaces |
| `--ns-border` | `#CBD5E1` | Borders |
| `--ns-border-sub` | `#E2E8F0` | Dividers |
| `--ns-text-primary` | `#0F172A` | Headings |
| `--ns-text-secondary` | `#334155` | Body |
| `--ns-text-muted` | `#64748B` | Labels |
| `--ns-text-faint` | `#94A3B8` | Meta |

**Light mode rules (bắt buộc hoàn thiện):**
- Mọi `text-white` hardcode → dùng `text-ns-primary` hoặc class semantic
- Input: `bg-ns-page border-ns text-ns-primary placeholder:text-ns-faint`
- Sidebar/topbar: `bg-ns-card border-ns`
- Gradient CTA giữ nguyên (white text trên gradient)
- Shadow nhẹ trên card light: `shadow-sm shadow-slate-200/50`
- Test contrast ≥ 4.5:1 trên cả hai theme

---

## 4. Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| H1 page | Poppins | 700 | 2xl–3xl |
| H2 section | Poppins | 600 | xl–2xl |
| H3 card | Poppins | 600 | lg |
| Body | Open Sans | 400 | sm–base (16px base) |
| Label | Open Sans | 500 | sm |
| Meta/caption | Open Sans | 400 | xs |
| Score/mono | Poppins | 700 | 3xl–5xl |

**Google Fonts:** Poppins 400/500/600/700 + Open Sans 400/500/600/700

---

## 5. Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| Page padding | `p-6` | App content area |
| Card padding | `p-5` – `p-8` | Cards |
| Section gap | `space-y-6` | Between sections |
| Grid gap | `gap-4` – `gap-6` | Grids |
| Max width list | `max-w-5xl` | Analysis list |
| Max width detail | `max-w-5xl` | Result detail |
| Max width scan | `max-w-6xl` | CV+JD dual panel |
| Sidebar | `w-64` | Desktop |
| Topbar | `h-16` | Fixed height |

**Breakpoints:** mobile-first — sm 640, md 768, lg 1024, xl 1280

---

## 6. Component Specs

### 6.1 Buttons

```
Primary:   bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl px-6 py-3 font-semibold hover:opacity-90 transition cursor-pointer
Secondary: border border-ns text-ns-secondary rounded-xl px-6 py-3 hover:bg-ns-raised transition cursor-pointer
Ghost:     text-slate-400 hover:text-white transition cursor-pointer
Danger:    border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-xl
Disabled:  opacity-50 cursor-not-allowed
```

### 6.2 Cards

```
Default: bg-ns-card border border-ns rounded-2xl
Hover:   hover:border-blue-500/30 transition-all
Locked:  relative overflow-hidden → blur-sm + overlay CTA
```

### 6.3 Inputs

```
Field:   input-field class — bg-ns-page border border-ns rounded-lg px-4 py-3 w-full focus:border-blue-500 focus:outline-none
Error:   border-red-500
Label:   text-slate-300 text-sm font-medium mb-1.5 block
Helper:  text-slate-500 text-xs mt-1
```

### 6.4 Toast (global)

| Property | Spec |
|----------|------|
| Position | Fixed top-right: `top-4 right-4 z-[100]` |
| Stack | Vertical, gap 12px, max 5 visible |
| Width | `min-w-[320px] max-w-[420px]` |
| Animation | Slide-in from right 200ms, fade-out 150ms |
| Auto dismiss | Success/info: 4s; Error: 6s; có nút đóng |
| Types | `success` green border, `error` red, `warning` yellow, `info` blue |

**Toast copy patterns:**
- Đăng nhập thành công / Đăng ký thành công → chuyển tab login
- Lỗi validate form → mô tả field cụ thể
- Lỗi giả lập BE → "Không thể kết nối máy chủ. Vui lòng thử lại."
- Toggle thông báo → "Đã bật/tắt [tên thông báo]"
- Nâng cấp gói → "Nâng cấp [Premium/VIP] thành công"
- Xóa tài khoản → "Đã xóa tài khoản thành công"

### 6.5 Dialog / Modal

```
Overlay: fixed inset-0 bg-black/60 backdrop-blur-sm z-50
Panel:   bg-ns-card border border-ns rounded-2xl p-6 max-w-lg w-[90vw] max-h-[85vh] overflow-y-auto
Header:  font-heading font-semibold text-white text-lg mb-4
Footer:  flex gap-3 justify-end mt-6
```

Dùng cho: xem CV/JD text, xác nhận tải DOCX, xóa tài khoản, notification panel.

### 6.6 Tooltip (metric `!` icon)

```
Trigger: Info icon 16px text-slate-400 hover:text-blue-400 cursor-help
Popup:   absolute z-50 bg-ns-raised border border-ns rounded-lg px-3 py-2 text-xs text-slate-300 max-w-[240px] shadow-lg
Behavior: hover + focus (desktop), tap toggle (mobile)
```

### 6.7 Badge / Tag

```
Plan Free:     bg-slate-700 text-slate-300
Plan Premium:  bg-blue-600/20 text-blue-400
Plan VIP:      bg-purple-600/20 text-purple-400
Phù hợp:       bg-green-600/20 text-green-400 text-xs "Phù hợp với bạn"
Score:         dynamic color by threshold
```

### 6.8 Plan tag (header + profile)

Hiển thị khi user đã nâng cấp:
- Tag gói: `Premium` / `VIP Interview`
- Subtext: `Hết hạn: DD/MM/YYYY` hoặc `Còn X buổi phỏng vấn`

---

## 7. Navigation & Routes (MVP)

| Route | Page | Auth |
|-------|------|------|
| `/` | LandingPage | Public |
| `/auth` | AuthPage | Public |
| `/dashboard` | DashboardPage | Required |
| `/cv-scan` | CVScanPage | Required |
| `/analysis` | AnalysisListPage | Required |
| `/analysis/:id` | AnalysisDetailPage | Required |
| `/mock-interview` | MockInterviewPage | Required (VIP) |
| `/pricing` | PricingPage | Required |
| `/profile` | ProfilePage | Required |

**Sidebar labels (cập nhật):**
- `Phân tích CV` → `/cv-scan`
- `Kết quả phân tích` → `/analysis` (đổi từ "Kết quả CV")
- `Phỏng vấn AI` → `/mock-interview`

**Redirect legacy:** `/cv-result` → `/analysis`

---

## 8. UX Flows (MVP)

### 8.1 Auth

```
Landing "Phân tích CV miễn phí" → /auth (tab Đăng nhập)
Register "Tạo tài khoản" → toast success → chuyển tab Đăng nhập (KHÔNG vào dashboard)
Login "Đăng nhập" → toast success → /dashboard
```

### 8.2 CV Scan

```
Layout: 2 cột (CV | JD) — stack vertical trên mobile
Mỗi cột: toggle Upload file | Dán nội dung
CV cột: list CV đã upload (nếu >1 lần scan) — chọn lại file cũ
Config: Tên công ty* (user nhập bắt buộc — không auto-fill JD)
        Ngành / Vị trí — optional, có "Khác" + input
        Kinh nghiệm — optional, range "Từ X năm" → "Đến Y năm"
Hết quota free → blur trang + popup upsell Premium
Analyze → loading → lưu scan → /analysis/:newId
```

### 8.3 Analysis

```
/analysis: danh sách scan + search + date range filter
Item title: CS_{vị trí}_{công ty} · {score}/100 · {ngày}
Click item → /analysis/:id

/analysis/:id tabs:
  Tổng quan | Kiểm tra ATS | Sự tương thích | Cải thiện | Công việc phù hợp* | Khoá học*
  * Premium gate
```

### 8.4 Upgrade (mock)

```
Pricing CTA → modal xác nhận mock → update plan in context/localStorage
→ toast success → tag gói + ngày hết hạn hiển thị profile/header
Premium: unlock tab Công việc + Khoá học
VIP: unlock Mock Interview
```

### 8.5 Profile

```
Tab Hồ sơ: avatar upload + info
Tab Lịch sử CV: chỉ file đã upload (KHÔNG text paste), KHÔNG có nút Scan mới
Tab Cài đặt: toggle thông báo (toast), xóa tài khoản (confirm → logout → landing)
```

### 8.6 Onboarding guideline (LOW PRIORITY — phase 2)

Step-by-step spotlight tour cho user mới. Có nút "Đã hiểu" skip toàn bộ.

---

## 9. Metric Labels (Tiếng Việt)

| Key | Label UI | Tooltip (hover `!`) |
|-----|----------|---------------------|
| overall | Điểm tổng | Tổng hợp mức phù hợp CV với vị trí và JD |
| ats | Khả năng ATS | Mức CV có thể được hệ thống tuyển dụng tự động đọc và lọc |
| keyword | Độ khớp từ khóa | Mức CV chứa từ khóa quan trọng trong JD/ngành |
| experience | Phù hợp kinh nghiệm | Mức kinh nghiệm trong CV khớp yêu cầu vị trí |
| presentation | Trình bày CV | Cấu trúc, format, dễ đọc và chuyên nghiệp |

---

## 10. Premium Gate Matrix

| Feature | Free | Premium | VIP |
|---------|------|---------|-----|
| Scan CV (3/tháng) | ✅ | ✅ unlimited | ✅ |
| Điểm + ATS + Cải thiện + Sự tương thích | ✅ | ✅ | ✅ |
| Công việc phù hợp | 🔒 | ✅ | ✅ |
| Khoá học | 🔒 | ✅ | ✅ |
| Mock Interview | 🔒 | 🔒 | ✅ |

---

## 11. Mock Data Conventions

- Scan ID: `scan_${timestamp}`
- Scan title: `CS_{role}_{company}` — **CS = Coverage Score** (độ phủ/matching CV–JD qua các tiêu chí). Sanitize spaces → underscore.
- Display title: `CS · {vị trí} · {tên công ty}` + `{score}/100` + ngày
- CV file history: chỉ lưu upload file (pdf/docx), metadata: name, size, uploadedAt
- Text paste: lưu trong scan session, không vào "Lịch sử CV"
- Company match list: scans có overall ≥ 70, tag "Phù hợp với bạn"
- Course links: external URL Udemy/Coursera, `target="_blank" rel="noopener"`

---

## 12. Anti-Patterns

- ❌ Emoji làm icon UI (dùng Lucide)
- ❌ Label metric tiếng Anh trên UI production
- ❌ `text-white` hardcode không hỗ trợ light mode
- ❌ Hover-only critical actions (mobile)
- ❌ Instant state change không transition
- ❌ Missing `cursor-pointer` trên clickable
- ❌ Premium content hiện full mà không check plan

---

## 13. Pre-Delivery Checklist

- [ ] Dark + Light mode đều đọc được toàn bộ text
- [ ] Toast xuất hiện mọi hành động auth/settings/upgrade
- [ ] Auth guard chặn route app khi chưa login
- [ ] `/analysis` list filter + search hoạt động
- [ ] Scan mới tạo item list với đúng format tên
- [ ] Premium/VIP bypass từ Pricing cập nhật UI toàn app
- [ ] Logo hiển thị sidebar + landing + auth
- [ ] Notification bell có dropdown mock
- [ ] Avatar upload hoặc fallback initials
- [ ] Responsive 375 / 768 / 1024
- [ ] `prefers-reduced-motion` respected

---

## 14. Related Docs

| File | Purpose |
|------|---------|
| `src/prompt/README.md` | Index tổng |
| `FE/MVP-CHECKLIST.md` | Task breakdown & priority |
| `FE/11-GLOBAL-INFRA.md` | Context, toast, storage |
| `FE/06-ANALYSIS-LIST-PAGE.md` | Danh sách kết quả |
| `FE/06-ANALYSIS-DETAIL-PAGE.md` | Chi tiết phân tích |
| `FE/16-THEME-ASSETS-PAGES.md` | Theme, assets |
| `FE/17-ANIMATIONS-RESPONSIVE.md` | Scroll & hover |
| `BE/` | Backend specs (FastAPI) |
| `API_Integrate/` | Tích hợp FE ↔ API |
