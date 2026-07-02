# NextStep AI — App Router & Types (MVP Update)
# Prompt #10: App.tsx + types + constants + utils

> Cập nhật MVP: thêm routes `/analysis`, AuthGuard, types mở rộng.

## Prompt to Claude Code

```
Read FE/00-DESIGN-SYSTEM.md and FE/11-GLOBAL-INFRA.md first.

Update routing and shared types for MVP.

---

### App.tsx Routes

```tsx
<BrowserRouter>
  <Routes>
    <Route element={<RootLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
    </Route>

    <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/cv-scan" element={<CVScanPage />} />
      <Route path="/analysis" element={<AnalysisListPage />} />
      <Route path="/analysis/:id" element={<AnalysisDetailPage />} />
      <Route path="/mock-interview" element={<MockInterviewPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Route>

    {/* Legacy redirects */}
    <Route path="/cv-result" element={<Navigate to="/analysis" replace />} />
    <Route path="/settings" element={<Navigate to="/profile?tab=settings" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>
```

---

### constants/index.ts — update ROUTES

```ts
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  CV_SCAN: '/cv-scan',
  ANALYSIS: '/analysis',
  ANALYSIS_DETAIL: (id: string) => `/analysis/${id}`,
  MOCK_INTERVIEW: '/mock-interview',
  PRICING: '/pricing',
  PROFILE: '/profile',
} as const
```

Add METRIC_TOOLTIPS constant for Vietnamese tooltip text (see MASTER.md §9).

---

### types/index.ts — add MVP types

Extend existing types with:
- PlanInfo, ScanRecord, DocumentInput, CVFileRecord, AppNotification, ScanConfig
- CVAnalysisResult.experienceComment?: string (for Sự tương thích tab)
- User.avatarUrl?: string

See FE/11-GLOBAL-INFRA.md for full interfaces.

---

### utils.ts — add helpers

```ts
export function formatDateTime(iso: string): string  // DD/MM/YYYY HH:mm vi-VN
export function sanitizeScanTitle(part: string): string  // for CS_{role}_{company}
export function formatExperienceRange(from: number, to: number): string
  // "3 năm" if from===to, else "3–5 năm"
export function validateExperienceRange(from: number, to: number): boolean
  // to >= from, both >= 0
```

---

### Pages to create
- src/pages/AnalysisListPage.tsx
- src/pages/AnalysisDetailPage.tsx

Keep CVResultPage.tsx temporarily or delete after migration.

---

### main.tsx provider order

```tsx
<StrictMode>
  <ThemeProvider>
    <ToastProvider>
      <AppProvider>
        <App />
        <ToastContainer />
      </AppProvider>
    </ToastProvider>
  </ThemeProvider>
</StrictMode>
```
```
