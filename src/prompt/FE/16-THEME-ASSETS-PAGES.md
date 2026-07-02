# NextStep AI — Theme, Assets, Static Pages (2026-06-22)

> Tổng hợp: light theme contrast, theme chỉ khi đăng nhập, plan per-user, assets `public/picture`, About/Privacy, animations.

---

## 1. Theme

| Quy tắc | Chi tiết |
|---------|----------|
| Mặc định | **Dark** (`ns-theme` = `dark`) |
| Toggle | Chỉ trong `AppLayout` (đã đăng nhập) |
| Trang public | `/`, `/auth`, `/about`, `/privacy` — **luôn dark**, bỏ class `html.light` |
| Lưu preference | `localStorage ns-theme` — chỉ áp dụng khi `isAuthenticated` |

**Implementation:** `ThemeContext.setAuthTheming(boolean)` + `ThemeBridge` trong `App.tsx`.

### Light theme contrast (`index.css`)

- Border: `#171717` / `#404040` (không dùng xanh nhạt)
- Text primary: `#0A0A0A`, secondary/muted: neutral gray
- Accent text trên nền trắng → đen, **trừ** class `.keep-accent`
- Promo strip: `.promo-strip` border đen
- Toast light: `shadow-md` + border rõ

Chi tiết: `12-LIGHT-THEME.md`, hover/scroll: `17-ANIMATIONS-RESPONSIVE.md`

---

## 2. Plan per-user (mặc định Free)

**Bug cũ:** `plan` global trong `PersistedState` → user mới login thấy Premium của session trước.

**Fix:**
- `StoredAccount.planInfo: PlanInfo` — mỗi user một gói
- Bỏ `plan` global khỏi persist (migrate khi đọc)
- `register` / `loginWithGoogleDemo`: `planInfo = defaultPlan()` (`type: 'free'`)
- `login`: không đổi `planInfo` của account
- `upgradePlan`: cập nhật `account.planInfo` + `user.plan`
- Migrate: account có `user.plan === 'free'` → force `defaultPlan()`

---

## 3. Assets — `public/picture/` only

**Không dùng** `src/picture/` import. Tất cả qua `pictureAsset()` → `/picture/...`.

| File | Dùng | Không dùng |
|------|------|------------|
| `logo.png` | Navbar, sidebar, auth, footer | — |
| `auth-landing.png` | Auth panel trái (nền) | Overlay gradient |
| `landing-hero.png` | Landing hero decoration | — |
| `dashboard-cv-banner.png` | Banner "Phân tích CV mới" | — |
| `dashboard-interview-banner.png` | Banner "Luyện phỏng vấn AI" | — |
| `dashboard-premium-banner.svg` | Banner nâng cấp (welcome) | Giữ SVG |
| `about-hero.png` | Trang Về chúng tôi | — |
| `about-mission.png` | Section sứ mệnh | — |
| ~~company-default.png~~ | — | Dùng icon `Building2` |
| ~~course-default.png~~ | — | Dùng icon `BookOpen` |

`AssetImage`: `onError` → gradient + children fallback.

---

## 4. Trang public mới

### `/about` — Về chúng tôi
- Hero + ảnh `about-hero.png`, mission `about-mission.png`
- Giá trị (4 card), stats, CTA
- `ScrollReveal` + `card-interactive`
- Luôn dark theme

### `/privacy` — Chính sách bảo mật
- Sections policy + icon
- `ScrollReveal` stagger
- Luôn dark theme

**Routes:** public group trong `App.tsx`.

---

## 5. Animations & responsive

Xem **[17-ANIMATIONS-RESPONSIVE.md](./17-ANIMATIONS-RESPONSIVE.md)**:
- `ScrollReveal` component
- `.badge-pill`, `.card-interactive`
- Breakpoints mobile/tablet/desktop

---

## 6. Files code

| File | Thay đổi |
|------|----------|
| `src/lib/picture.ts` | `pictureAsset`, `PICTURE` constants |
| `src/contexts/ThemeContext.tsx` | `setAuthTheming` |
| `src/App.tsx` | `ThemeBridge`, routes about/privacy |
| `src/index.css` | Light contrast, scroll-reveal, hover utilities |
| `src/components/ScrollReveal.tsx` | Scroll animation |
| `src/contexts/AppContext.tsx` | `planInfo` per account |
| `src/pages/AboutPage.tsx`, `PrivacyPage.tsx` | Static + ScrollReveal |
| `src/pages/LandingPage.tsx` | ScrollReveal, assets |
| `src/pages/DashboardPage.tsx` | Icons, banners, card-interactive |
| `src/layouts/AppLayout.tsx` | Logo, badge-pill, header align |
| `public/picture/*` | PNG/SVG assets |
