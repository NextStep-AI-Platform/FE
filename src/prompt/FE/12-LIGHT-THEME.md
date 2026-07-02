# NextStep AI — Light Theme Completion
# Prompt #12: index.css + semantic utilities

## Prompt to Claude Code

```
Read FE/00-DESIGN-SYSTEM.md §3.2 Light mode rules.

Complete light theme across the app. Current state: only background tokens change; text stays white → broken.

---

### Step 0: Theme scope (2026-06 update)

- Mặc định: **dark**
- Toggle theme: **chỉ khi đã đăng nhập** (`AppLayout`)
- Trang public (`/`, `/auth`, `/about`, `/privacy`): luôn dark — xem `16-THEME-ASSETS-PAGES.md`

### Step 1: Extend CSS tokens (src/index.css)

Add semantic text tokens:
```css
:root {
  --ns-text-primary: #F8FAFC;
  --ns-text-secondary: #CBD5E1;
  --ns-text-muted: #94A3B8;
  --ns-text-faint: #64748B;
}

html.light {
  --ns-bg-page: #F1F5F9;
  --ns-bg-card: #FFFFFF;
  --ns-border: #171717;      /* neutral đen — dễ nhìn trên nền trắng */
  --ns-border-sub: #404040;
  --ns-text-primary: #0A0A0A;
  --ns-text-secondary: #262626;
  --ns-text-muted: #525252;
  --ns-text-faint: #737373;
}
```

Accent trên light: override `text-blue-400` → `#171717` **trừ** class `.keep-accent` (nav active, plan badge, icon trên nền màu). Xem `17-ANIMATIONS-RESPONSIVE.md`.

Sidebar + main header: cùng `h-16`, class `app-shell-header`, `border-b border-ns` — viền thẳng hàng.

Add utilities:
```css
.text-ns-primary { color: var(--ns-text-primary) !important; }
.text-ns-secondary { color: var(--ns-text-secondary) !important; }
.text-ns-muted { color: var(--ns-text-muted) !important; }
.text-ns-faint { color: var(--ns-text-faint) !important; }
```

Update `.input-field` to use semantic colors.

---

### Step 2: Migration strategy

Replace in all pages/layouts:
- `text-white` on headings/body → `text-ns-primary`
- `text-slate-400` labels → `text-ns-muted`
- `text-slate-500` meta → `text-ns-faint`
- `text-slate-300` body → `text-ns-secondary`

KEEP `text-white` ONLY on:
- Gradient CTA buttons
- Badges on colored backgrounds
- Score rings where contrast requires white

---

### Step 3: Component-specific fixes

**Sidebar (AppLayout)**
- Light: sidebar bg-ns-card, nav text-ns-muted, active nav text-blue-600

**Cards**
- Light: add subtle shadow shadow-sm

**Landing page hero**
- Gradient text accents unchanged
- Body paragraphs use text-ns-secondary

**Toast**
- Light: bg-white border border-slate-200 shadow-lg

**Dialogs**
- Light: bg-white text-ns-primary

---

### Step 4: Verification checklist

Toggle theme and verify readable on:
- /dashboard
- /cv-scan
- /analysis
- /analysis/:id
- /profile
- /pricing
- /auth
- / (landing)

No white-on-white or dark-on-dark text.

---

### Technical
- ThemeContext unchanged (localStorage ns-theme)
- Transition background-color 0.25s ease (existing)
- Test prefers-color-scheme optional (not required)
```
