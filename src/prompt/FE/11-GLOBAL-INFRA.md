# NextStep AI — Global Infrastructure
# Prompt #11: Toast, AppContext, Storage, AuthGuard

## Skill Activation

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "toast notification feedback form saas" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "react context localStorage persistence" --domain ux
```

---

## Prompt to Claude Code

```
Read FE/00-DESIGN-SYSTEM.md first.
Read FE/MVP-CHECKLIST.md Phase 0.

Implement global infrastructure BEFORE updating individual pages.

---

### 1. Toast System

Files:
- src/contexts/ToastContext.tsx
- src/components/ToastContainer.tsx
- src/hooks/useToast.ts (optional re-export)

API:
```ts
type ToastType = 'success' | 'error' | 'warning' | 'info'
interface Toast { id: string; type: ToastType; title: string; message?: string; duration?: number }

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'> | string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}
```

UI spec (MASTER.md §6.4):
- Fixed top-right, stack vertical, z-[100]
- Lucide icons: CheckCircle, XCircle, AlertTriangle, Info
- Close button per toast
- Auto dismiss: success/info 4s, error 6s

Wrap in main.tsx inside ThemeProvider:
```tsx
<ThemeProvider>
  <ToastProvider>
    <AppProvider>
      <App />
      <ToastContainer />
    </AppProvider>
  </ToastProvider>
</ThemeProvider>
```

---

### 2. AppContext (global mock state)

File: src/contexts/AppContext.tsx

State:
```ts
interface AppState {
  user: User | null
  isAuthenticated: boolean
  plan: PlanInfo
  scans: ScanRecord[]
  cvFiles: CVFileRecord[]      // uploaded files only
  notifications: AppNotification[]
  hasSeenOnboarding: boolean   // for future guideline
}

interface PlanInfo {
  type: 'free' | 'premium' | 'vip'
  startedAt: string | null
  expiresAt: string | null     // Premium monthly/quarterly
  interviewSessionsLeft: number // VIP: default 0, set 5 on VIP purchase
}

// MVP update (2026-06): plan lưu per-account `StoredAccount.planInfo`, không global.
// Register/login mới → `defaultPlan()` (free). `upgradePlan` cập nhật account hiện tại.

interface ScanRecord {
  id: string
  title: string                // CS_{role}_{company} — CS = Coverage Score
  role: string
  company: string
  overallScore: number
  analyzedAt: string           // ISO
  cvInput: DocumentInput
  jdInput: DocumentInput
  config: ScanConfig
  result: CVAnalysisResult     // full mock result payload
}

interface DocumentInput {
  mode: 'file' | 'text'
  fileName?: string
  fileSize?: number
  mimeType?: string
  textContent?: string
}

interface CVFileRecord {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
}

interface AppNotification {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
  type: 'info' | 'success' | 'promo'
}
```

Actions:
```ts
login(email, password): boolean  // trim; migrate legacy account thiếu password
loginWithGoogleDemo(emailHint?: string): boolean  // MVP Google bypass
register(name, email, password): boolean  // trim; returns true, does NOT auto-login
logout(): void
deleteAccount(): void
upgradePlan(type: 'premium' | 'vip', billing?: 'monthly' | 'quarterly'): void
addScan(record: ScanRecord): void
addCVFile(file: CVFileRecord): void
markNotificationRead(id: string): void
toggleNotificationSetting(key: string, enabled: boolean): void
consumeInterviewSession(): boolean
incrementScanUsage(): boolean  // returns false if quota exceeded (free)
```

Persist to localStorage key `ns-app-state` on every mutation.
Hydrate on mount.

Seed mock notifications (3 items) on first register.

---

### 3. Storage helper

File: src/lib/storage.ts
- getItem<T>(key): T | null
- setItem<T>(key, value): void
- removeItem(key): void
- Safe JSON parse with fallback

---

### 4. AuthGuard

File: src/components/AuthGuard.tsx
```tsx
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/auth" state={{ from: location }} replace />
  return children
}
```

Wrap authenticated routes in App.tsx:
```tsx
<Route element={<AuthGuard><AppLayout /></AuthGuard>}>
  ...
</Route>
```

---

### 5. Mock analysis generator

File: src/data/mockAnalysis.ts

Function: `generateMockResult(config: ScanConfig, cvInput, jdInput): CVAnalysisResult`
- Pick preset by role/industry if exists, else default Frontend preset
- Override: cvName, company, role, analyzedAt from scan config
- Include Vietnamese labels in result payload

---

### 6. Toast triggers (implement when wiring pages)

| Action | Toast |
|--------|-------|
| Login OK | success "Đăng nhập thành công" |
| Login fail | error "Email hoặc mật khẩu không đúng" (kiểm tra trim + tài khoản localStorage cũ) |
| Google demo | success "Demo Google — không cần mật khẩu" |
| Register OK | success "Đăng ký thành công" + "Vui lòng đăng nhập" |
| Register fail | error validation message |
| Upgrade Premium | success "Nâng cấp Premium thành công" |
| Upgrade VIP | success "Nâng cấp VIP thành công" |
| Quota exceeded | warning + blur popup "Nâng cấp Premium" trên CV Scan |
| Toggle notification | info "Đã bật/tắt ..." |
| Delete account | success "Đã xóa tài khoản" |
| Save profile | success "Đã lưu thay đổi" |
| Network mock error | error "Không thể kết nối máy chủ..." |

---

### Technical Requirements
- No external toast library (build lightweight)
- TypeScript strict
- Do not break existing pages — migrate incrementally
```
