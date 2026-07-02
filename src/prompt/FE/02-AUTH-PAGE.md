# NextStep AI — Authentication Page (MVP)
# Prompt #02: AuthPage.tsx

## Skill Activation

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "auth login register form validation toast feedback" --domain ux
```

---

## Prompt to Claude Code

```
Read FE/00-DESIGN-SYSTEM.md first.
Requires ToastContext + AppContext (Phase 0).

Update src/pages/AuthPage.tsx for MVP auth flow.

---

### Auth Flow Rules (CRITICAL)

1. Landing "Phân tích CV miễn phí" → /auth (default tab: login)
2. **Register** "Tạo tài khoản":
   - Validate form
   - Call app.register(name, email, password)
   - On success: toast.success("Đăng ký thành công", "Vui lòng đăng nhập để tiếp tục")
   - Switch to **login tab** — DO NOT navigate to dashboard
3. **Login** "Đăng nhập":
   - Call app.login(email, password) — trim email/password; migrate legacy accounts thiếu password
   - Sau register: pre-fill email + password trên tab login
   - On success: toast.success("Đăng nhập thành công") → navigate('/dashboard')
   - On fail: toast.error("Đăng nhập thất bại", "Email hoặc mật khẩu không đúng")
4. Validation errors: toast.error + inline field errors

---

### Layout
Keep existing split layout (brand panel + form panel).
Panel trái: nền `auth-landing.png` (`public/picture/`) + overlay gradient tối để chữ dễ đọc.
Use logo from `src/picture/`:
- All surfaces: `logo.png` (mark) + `<BrandName />` text wordmark
- Component: `src/components/BrandName.tsx` — purple gradient matching logo

Replace gradient "N" box / name.png imports with logo.png only.

---

### Register Form
Fields: name, email, password, confirm password, terms checkbox
Submit label: "Tạo tài khoản"

---

### Login Form
Fields: email, password
Submit label: "Đăng nhập"
"Quên mật khẩu?" → toast.info("Tính năng sắp ra mắt")

---

### Google OAuth Button
onClick → `loginWithGoogleDemo()` — MVP bypass, vào dashboard không cần mật khẩu
Luôn dùng email cố định `demo@nextstep.ai` (không lấy email từ form login)
Toast: success "Đăng nhập thành công" + "Demo Google — không cần mật khẩu"
Không ghi đè tài khoản email/password người dùng đã đăng ký

---

### Loading State
Button disabled + Loader2 spinner + "Đang xử lý..."
Simulate 800ms delay before success/fail

---

### Redirect if already logged in
If isAuthenticated → Navigate to /dashboard

---

### Technical
- useApp() for login/register
- useToast() for all feedback
- Remove bare setTimeout navigate without context
```
