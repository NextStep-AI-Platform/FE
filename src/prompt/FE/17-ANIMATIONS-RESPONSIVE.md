# NextStep AI — Animations & Responsive (2026-06-22)

> Scroll-triggered reveal, hover micro-interactions, responsive patterns.

---

## 1. ScrollReveal component

**File:** `src/components/ScrollReveal.tsx`

Intersection Observer — animate khi section vào viewport (scroll tới đâu animate tới đấy).

| Prop | Default | Mô tả |
|------|---------|-------|
| `direction` | `up` | `up` \| `fade` \| `left` \| `right` |
| `delay` | `0` | ms stagger giữa các item |
| `once` | `true` | Chỉ animate lần đầu (không lặp khi scroll lên) |
| `className` | — | Wrapper class |

**CSS:** `src/index.css` — `.scroll-reveal`, `.scroll-reveal-visible`, `.scroll-reveal-up|fade|left|right`

### Trang đã áp dụng

| Trang | Sections |
|-------|----------|
| `LandingPage` | Hero (stagger), How it works, Features, Stats, Pricing, CTA |
| `AboutPage` | Hero, Mission, Values grid, Stats, Final CTA |
| `PrivacyPage` | Header, intro, từng section policy |

**Trang app (logged-in):** Giữ `animate-slide-up` cho entry dashboard; có thể thêm ScrollReveal sau nếu cần.

---

## 2. Hover micro-interactions

**CSS utilities** (`index.css`):

| Class | Hiệu ứng |
|-------|----------|
| `.animate-page-in` | Entry khi đổi route (`AppLayout` wrap `<Outlet />`) |
| `.animate-fade-in` | Fade modal / overlay |
| `.animate-slide-up` | Panel entry (CV scan, confirm dialog) |
| `.badge-pill` | Scale nhẹ + shadow khi hover |
| `.card-interactive` | Border đậm hơn + translateY(-2px) + shadow |

### Nơi dùng

- Landing: badge hero, feature cards, pricing cards, stat pills
- `AppLayout`: plan badge (VIP/Premium), notification count badge
- `DashboardPage`: stat cards, interview banner card
- About / Privacy: value cards, policy sections

**Accent trên light theme:** Thêm class `.keep-accent` cho icon/nav active/plan badge để giữ màu brand (xanh/tím) thay vì override sang đen.

---

## 3. Light theme — border & text (đọc kèm `12-LIGHT-THEME.md`)

```css
html.light {
  --ns-border: #171717;
  --ns-text-primary: #0A0A0A;
  /* accent text → #171717 trừ .keep-accent */
}
```

- Border card/input: neutral đen/xám (`#171717`, `#404040`)
- Không dùng border xanh nhạt trên nền trắng
- CTA gradient giữ nguyên màu brand

---

## 4. Responsive checklist

| Area | Breakpoints |
|------|-------------|
| Landing hero preview | `lg:grid-cols-2`, ảnh hero `hidden sm:block` |
| Landing pricing | `md:grid-cols-3` stack mobile |
| Dashboard stats | `grid-cols-2 md:grid-cols-4` |
| CV Scan panels | `lg:flex-row` stack mobile |
| AppLayout sidebar | Drawer mobile + `h-16` header đồng bộ |
| About / Privacy | `lg:grid-cols-2`, values `sm:grid-cols-2 lg:grid-cols-4` |

**Test:** Chrome DevTools 375px, 768px, 1280px.

---

## 5. Khi thêm trang mới

1. Wrap section headings + content blocks trong `<ScrollReveal delay={n}>`.
2. Card clickable → `card-interactive`.
3. Badge/chip thông tin → `badge-pill`.
4. Icon accent trên light → `keep-accent`.
5. Grid luôn có mobile-first (`grid-cols-1` → `md:` / `lg:`).

---

## 6. Files liên quan

| File | Vai trò |
|------|---------|
| `src/components/ScrollReveal.tsx` | Component |
| `src/index.css` | Keyframes + utilities |
| `src/pages/LandingPage.tsx` | Reference implementation |
| `src/pages/AboutPage.tsx` | Public scroll example |
| `src/layouts/AppLayout.tsx` | Badge hover |
