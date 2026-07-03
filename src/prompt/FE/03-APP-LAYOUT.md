# NextStep AI — App Layout (MVP Update)
# Prompt #03: AppLayout.tsx

## Prompt to Claude Code

```
Read FE/00-DESIGN-SYSTEM.md first.
Requires AppContext.

Update src/layouts/AppLayout.tsx:

---

### Navigation Changes

navMain items:
- Tổng quan → /dashboard
- Phân tích CV → /cv-scan
- Kết quả phân tích → /analysis  (RENAMED from Kết quả CV /cv-result)
- Phỏng vấn AI → /mock-interview

navAccount:
- Hồ sơ → /profile
- Nâng cấp → /pricing
- Cài đặt → /profile?tab=settings  (OR navigate with state — fix broken /settings route)

pageTitles map: update '/analysis' → 'Kết quả phân tích'

---

### Logo
```tsx
import LogoMark from '@/components/LogoMark'
import BrandName from '@/components/BrandName'

<LogoMark brandSize="md" />
<BrandName size="md" />
```

### Header alignment (2026-07)
- Sidebar brand block + main top bar: **cùng `h-16`**, class `app-shell-header`, `border-b border-ns`
- Tránh `p-6` ở logo sidebar — gây lệch viền với header chính

---

### Topbar — Plan Badge
Next to page title (authenticated):
- **Free:** badge muted `Free`
- **Premium:** badge blue `Premium` + tooltip expiry
- **VIP:** badge purple `VIP` + tooltip expiry
- **Không** hiển thị số buổi phỏng vấn trên header (xem quota tại `/mock-interview`)

Data from `useApp().plan`

---

### Topbar — Notification Bell

State: dropdown open/close

On click: panel dropdown (right-aligned):
- Width 360px, max-h-96 overflow-y-auto
- Header: "Thông báo" + "Đánh dấu tất cả đã đọc"
- List mock notifications from AppContext
- Each: title, body snippet, time ago, unread dot
- Click item → mark read
- Empty: "Không có thông báo mới"

Unread count badge on bell icon.

Seed 3 notifications on register (in AppContext):
1. "Chào mừng đến NextStep AI"
2. "Bạn còn 3 lượt scan miễn phí"
3. "Nâng cấp Premium để xem gợi ý công việc"

---

### User Card (sidebar bottom)
Use real user from context (name, email, avatar if set)
Logout → app.logout() + toast.info("Đã đăng xuất") + navigate /

**Nav Tài khoản active:** Hồ sơ / Nâng cấp / Cài đặt dùng cùng style active như tab Chính (`bg-blue-600/20`, chevron). Cài đặt: `?tab=settings`.

---

### Theme Toggle
Keep toggle — must work with completed light theme (see 12-LIGHT-THEME.md)

---

### Technical
- useApp(), useToast()
- Close notification dropdown on outside click
- Mobile sidebar unchanged pattern
```
