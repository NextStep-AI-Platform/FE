# NextStep AI — UI Polish & Dashboard Logic (2026-06-22)

> Thiết kế trước khi implement: logo, auth, CV Scan layout, Dashboard sections, assets.

---

## 1. Logo sizing

| Vị trí | Kích thước mới | Ghi chú |
|--------|----------------|---------|
| Auth brand panel | `w-28 h-28` (112px) | Logo mark + BrandName xl bên dưới |
| Landing navbar | `w-11 h-11` | + BrandName md |
| AppLayout sidebar | `w-11 h-11` | + BrandName md (lg+) |
| AppLayout topbar mobile | `w-9 h-9` | compact |

---

## 2. Auth — Email/Password login

**Vấn đề:** Google demo dùng email trong form → tạo account với password cố định `demo1234` → login email/password thất bại.

**Fix:**
- `loginWithGoogleDemo()` **luôn** dùng `demo@nextstep.ai` (không lấy email form).
- `login()` dùng functional `setPersisted` — đọc/ghi atomic, trim email/password.
- Sau register: pre-fill email + password trên tab login.
- Google và register email riêng biệt, không conflict.

---

## 3. CV Scan — Layout 2:1

```
┌─────────────────────────────────────────┐
│  CV panel (50%)  │  JD panel (50%)     │  ← flex-[2] min-h-[320px]
├─────────────────────────────────────────┤
│  Cấu hình phân tích (compact)           │  ← flex-[1]
│  [Công ty] [Ngành | Vị trí]             │
│  [Từ __ năm · Đến __ năm]  (1 hàng)     │
│  [Bắt đầu phân tích]                    │
└─────────────────────────────────────────┘
```

- Grid/flex ratio **2 : 1** (CV+JD : config).
- Drop zone CV/JD: `min-h-[280px]`, textarea tương đương.
- Kinh nghiệm: một hàng `Từ [input] năm · Đến [input] năm`.

---

## 4. Pricing VIP Cta

| Gói | Cta cũ | Cta mới |
|-----|--------|---------|
| VIP | Đặt lịch phỏng vấn | **Nâng cấp gói** |

---

## 5. Dashboard — Công ty phù hợp

**Điều kiện hiển thị:**
- User **không phải free** (`premium` hoặc `vip`)
- Scan có `overallScore >= 70`
- `analyzedAt` trong **30 ngày** gần nhất

**Danh sách:**
- Mỗi item = 1 lượt scan đủ điều kiện
- Sắp xếp: mới nhất trước
- Hiển thị: tên scan, công ty, điểm, ngày
- Click → `/analysis/:scanId`
- Container: `max-h-[280px] overflow-y-auto` (scroll dọc)

**Free user:** overlay khóa Premium (giữ blur).

---

## 6. Dashboard — Khoá học đề xuất

**Điều kiện:** Premium/VIP, scans trong 30 ngày.

**Logic:**
- Gom `result.courses[]` từ các scan trong tháng
- Đếm trùng theo `title` (hoặc `url`)
- Sort: count giảm dần → title A-Z
- Click → mở `course.url` tab mới
- Scroll: `max-h-[280px] overflow-y-auto`

---

## 7. Assets (`public/picture/`)

| File | Vị trí | Ghi chú |
|------|--------|---------|
| `logo.png` | Navbar, sidebar, auth | `PICTURE.logo` |
| `landing-hero.png` | Landing hero | |
| `dashboard-cv-banner.png` | Banner CV dashboard | |
| `dashboard-interview-banner.png` | Banner phỏng vấn dashboard | |
| `dashboard-premium-banner.svg` | Promo strip dashboard | Giữ SVG |
| `about-hero.png`, `about-mission.png` | Trang Về chúng tôi | |

**Không dùng ảnh** cho company/course — chỉ icon Lucide.

Chi tiết: `16-THEME-ASSETS-PAGES.md`

---

## 8. Animation (CSS)

- `animate-fade-in` — page sections
- `animate-slide-up` — cards stagger
- `hover:scale-[1.02]` — quick action cards
- Drop zone: pulse border khi drag over (đã có)

---

## Files code cần sửa

| File | Thay đổi |
|------|----------|
| `AppContext.tsx` | Login atomic, Google demo email cố định |
| `AuthPage.tsx` | Logo lớn hơn |
| `AppLayout.tsx`, `LandingPage.tsx` | Logo lớn hơn |
| `CVScanPage.tsx` | Layout 2:1, exp 1 row, **Tiến hành phân tích** checklist |
| `DashboardPage.tsx` | Logic sections + scroll + links |
| `PricingPage.tsx` | VIP Cta text |
| `lib/dashboardInsights.ts` | Helper aggregate scans/courses |
| `components/AssetImage.tsx` | Image + fallback |
| `index.css` | Animations |
