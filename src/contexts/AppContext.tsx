import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PLAN_LIMITS } from '../constants'
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage'
import { addDays, getMonthKey } from '../lib/utils'
import { USE_API } from '../lib/config'
import { fetchMe, loginApi, logoutApi, registerApi } from '../lib/api/auth'
import type { AuthResponse } from '../lib/api/auth'
import { clearTokens, getAccessToken } from '../lib/api/client'
import type {
  AppNotification,
  AppState,
  CVFileRecord,
  InterviewSessionRecord,
  PlanInfo,
  PlanType,
  ScanRecord,
  User,
} from '../types'

interface StoredAccount {
  user: User
  planInfo: PlanInfo
}

interface PersistedState {
  accounts: StoredAccount[]
  currentUserId: string | null
  scans: ScanRecord[]
  cvFiles: CVFileRecord[]
  interviews: InterviewSessionRecord[]
  notifications: AppNotification[]
  hasSeenOnboarding: boolean
}

const DEMO_GOOGLE_EMAIL = 'demo@nextstep.ai'

const DEFAULT_NOTIFICATION_SETTINGS: Record<string, boolean> = {
  monthlyScan: true,
  featureUpdates: true,
  careerNews: false,
}

function createWelcomeNotifications(): AppNotification[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'n1',
      title: 'Chào mừng đến NextStep AI',
      body: 'Bắt đầu bằng cách tải CV và JD để nhận Coverage Score.',
      read: false,
      createdAt: now,
      type: 'success',
    },
    {
      id: 'n2',
      title: 'Bạn có 3 lượt scan miễn phí',
      body: 'Gói Freemium cho phép 3 lần phân tích CV mỗi tháng.',
      read: false,
      createdAt: now,
      type: 'info',
    },
    {
      id: 'n3',
      title: 'Mở khóa insight Premium',
      body: 'Nâng cấp để xem công việc phù hợp và khoá học đề xuất.',
      read: false,
      createdAt: now,
      type: 'promo',
    },
  ]
}

function defaultPlan(): PlanInfo {
  return {
    type: 'free',
    startedAt: null,
    expiresAt: null,
    interviewSessionsLeft: 0,
  }
}

function planInfoFromUserPlan(type: PlanType): PlanInfo {
  if (type === 'free') return defaultPlan()
  return {
    type,
    startedAt: null,
    expiresAt: null,
    interviewSessionsLeft: type === 'vip' ? 5 : 0,
  }
}

function emptyPersisted(): PersistedState {
  return {
    accounts: [],
    currentUserId: null,
    scans: [],
    cvFiles: [],
    interviews: [],
    notifications: [],
    hasSeenOnboarding: false,
  }
}

function migratePersisted(raw: unknown): PersistedState {
  if (!raw || typeof raw !== 'object') return emptyPersisted()
  const r = raw as Record<string, unknown>

  const accounts: StoredAccount[] = ((r.accounts as Array<{ user: User; planInfo?: PlanInfo }>) ?? []).map(acc => {
    const userPlan = acc.user?.plan ?? 'free'
    let planInfo = acc.planInfo ?? planInfoFromUserPlan(userPlan)
    if (userPlan === 'free') planInfo = defaultPlan()
    return { user: acc.user, planInfo }
  })

  return {
    accounts,
    currentUserId: (r.currentUserId as string | null) ?? null,
    scans: (r.scans as ScanRecord[]) ?? [],
    cvFiles: (r.cvFiles as CVFileRecord[]) ?? [],
    interviews: (r.interviews as InterviewSessionRecord[]) ?? [],
    notifications: (r.notifications as AppNotification[]) ?? [],
    hasSeenOnboarding: Boolean(r.hasSeenOnboarding),
  }
}

function readPersisted(): PersistedState {
  return migratePersisted(getItem(STORAGE_KEYS.APP_STATE))
}

function getAccountPlan(accounts: StoredAccount[], userId: string | null): PlanInfo {
  if (!userId) return defaultPlan()
  return accounts.find(a => a.user.id === userId)?.planInfo ?? defaultPlan()
}

function commitPersisted(next: PersistedState) {
  setItem(STORAGE_KEYS.APP_STATE, next)
}

interface AppContextValue extends AppState {
  isAuthReady: boolean
  login: (email: string, password: string) => Promise<boolean>
  loginWithGoogleDemo: () => boolean
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  refreshSession: () => Promise<void>
  deleteAccount: () => void
  upgradePlan: (type: 'premium' | 'vip', billing?: 'monthly' | 'quarterly') => void
  addScan: (scan: ScanRecord) => void
  addCVFile: (file: CVFileRecord) => void
  updateUser: (patch: Partial<User>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  toggleNotificationSetting: (key: string, enabled: boolean) => void
  consumeInterviewSession: () => boolean
  addInterviewSession: (session: InterviewSessionRecord) => void
  canScan: () => boolean
  scansRemaining: () => number
  isPremium: () => boolean
  isVip: () => boolean
  getAccounts: () => StoredAccount[]
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [persisted, setPersisted] = useState<PersistedState>(() => readPersisted())
  const [apiSession, setApiSession] = useState<AuthResponse | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(!USE_API)
  const persistedRef = useRef(persisted)
  persistedRef.current = persisted

  useEffect(() => {
    if (!USE_API) commitPersisted(persisted)
  }, [persisted])

  const refreshSession = useCallback(async () => {
    if (!USE_API || !getAccessToken()) return
    const session = await fetchMe()
    setApiSession(session)
  }, [])

  useEffect(() => {
    if (!USE_API) return
    let cancelled = false

    const hydrate = async () => {
      if (!getAccessToken()) {
        setIsAuthReady(true)
        return
      }
      try {
        const session = await fetchMe()
        if (!cancelled) setApiSession(session)
      } catch {
        clearTokens()
        if (!cancelled) setApiSession(null)
      } finally {
        if (!cancelled) setIsAuthReady(true)
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  const findAccountByEmail = (email: string, accounts: StoredAccount[]) =>
    accounts.find(a => a.user.email.toLowerCase() === email.trim().toLowerCase())

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()
    if (!normalizedEmail || trimmedPassword.length < 6) return false

    if (USE_API) {
      const session = await loginApi(normalizedEmail, trimmedPassword)
      setApiSession(session)
      return true
    }

    const prev = readPersisted()
    const account = findAccountByEmail(normalizedEmail, prev.accounts)
    if (!account) return false

    const storedPassword = account.user.password?.trim() ?? ''
    if (storedPassword && storedPassword !== trimmedPassword) return false

    const next: PersistedState = {
      ...prev,
      currentUserId: account.user.id,
      accounts: storedPassword
        ? prev.accounts
        : prev.accounts.map(a =>
            a.user.id === account.user.id
              ? { ...a, user: { ...a.user, password: trimmedPassword } }
              : a,
          ),
    }
    persistedRef.current = next
    commitPersisted(next)
    setPersisted(next)
    return true
  }, [])

  const loginWithGoogleDemo = useCallback(() => {
    if (USE_API) return false
    const email = DEMO_GOOGLE_EMAIL
    const prev = readPersisted()
    const existing = findAccountByEmail(email, prev.accounts)

    if (existing) {
      const next = { ...prev, currentUserId: existing.user.id }
      persistedRef.current = next
      commitPersisted(next)
      setPersisted(next)
      return true
    }

    const demoUser: User = {
      id: `user_google_${Date.now()}`,
      name: 'Người dùng Demo',
      email,
      password: 'demo1234',
      plan: 'free',
      scansUsed: 0,
      scansLimit: PLAN_LIMITS.free.scansPerMonth,
      scansMonthKey: getMonthKey(),
      createdAt: new Date().toISOString(),
      notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
    }

    const next: PersistedState = {
      ...prev,
      accounts: [...prev.accounts, { user: demoUser, planInfo: defaultPlan() }],
      currentUserId: demoUser.id,
      notifications: prev.notifications.length ? prev.notifications : createWelcomeNotifications(),
    }
    persistedRef.current = next
    commitPersisted(next)
    setPersisted(next)
    return true
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()
    const trimmedName = name.trim()
    if (!normalizedEmail || trimmedPassword.length < 8) return false

    if (USE_API) {
      const session = await registerApi(trimmedName, normalizedEmail, trimmedPassword)
      setApiSession(session)
      return true
    }

    const prev = readPersisted()
    const existing = findAccountByEmail(normalizedEmail, prev.accounts)

    if (existing) {
      if (existing.user.email === DEMO_GOOGLE_EMAIL) return false
      const storedPassword = existing.user.password?.trim() ?? ''
      if (storedPassword && storedPassword !== trimmedPassword) return false
      const next: PersistedState = {
        ...prev,
        accounts: prev.accounts.map(a =>
          a.user.id === existing.user.id
            ? { ...a, user: { ...a.user, name: trimmedName, password: trimmedPassword, email: normalizedEmail } }
            : a,
        ),
      }
      persistedRef.current = next
      commitPersisted(next)
      setPersisted(next)
      return true
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: trimmedName,
      email: normalizedEmail,
      password: trimmedPassword,
      plan: 'free',
      scansUsed: 0,
      scansLimit: PLAN_LIMITS.free.scansPerMonth,
      scansMonthKey: getMonthKey(),
      createdAt: new Date().toISOString(),
      notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
    }
    const next: PersistedState = {
      ...prev,
      accounts: [...prev.accounts, { user: newUser, planInfo: defaultPlan() }],
      notifications: createWelcomeNotifications(),
    }
    persistedRef.current = next
    commitPersisted(next)
    setPersisted(next)
    return true
  }, [])

  const user = useMemo(() => {
    if (USE_API) return apiSession?.user ?? null
    if (!persisted.currentUserId) return null
    return persisted.accounts.find(a => a.user.id === persisted.currentUserId)?.user ?? null
  }, [apiSession, persisted])

  const activeUserId = user?.id ?? null

  const scans = useMemo(
    () => persisted.scans.filter(s => s.userId === activeUserId),
    [persisted.scans, activeUserId],
  )

  const cvFiles = useMemo(
    () => persisted.cvFiles.filter(f => f.userId === activeUserId),
    [persisted.cvFiles, activeUserId],
  )

  const interviews = useMemo(
    () => persisted.interviews.filter(i => i.userId === activeUserId),
    [persisted.interviews, activeUserId],
  )

  const plan = useMemo(
    () => USE_API
      ? apiSession?.plan ?? defaultPlan()
      : getAccountPlan(persisted.accounts, persisted.currentUserId),
    [apiSession, persisted.accounts, persisted.currentUserId],
  )

  const logout = useCallback(() => {
    if (USE_API) {
      logoutApi()
      setApiSession(null)
    }
    setPersisted(prev => ({ ...prev, currentUserId: null }))
  }, [])

  const deleteAccount = useCallback(() => {
    if (!user) return
    setPersisted(prev => ({
      ...emptyPersisted(),
      accounts: prev.accounts.filter(a => a.user.id !== user.id),
    }))
  }, [user])

  const upgradePlan = useCallback((type: 'premium' | 'vip', billing: 'monthly' | 'quarterly' = 'monthly') => {
    const now = new Date()
    const days = type === 'vip' ? 30 : billing === 'quarterly' ? 90 : 30
    const plan: PlanInfo = {
      type,
      startedAt: now.toISOString(),
      expiresAt: addDays(now, days),
      interviewSessionsLeft: type === 'vip' ? 5 : 0,
    }
    setPersisted(prev => ({
      ...prev,
      accounts: prev.accounts.map(a =>
        prev.currentUserId === a.user.id
          ? { ...a, planInfo: plan, user: { ...a.user, plan: type, scansLimit: 9999 } }
          : a,
      ),
    }))
  }, [])

  const addScan = useCallback((scan: ScanRecord) => {
    setPersisted(prev => {
      if (!prev.currentUserId) return prev
      const monthKey = getMonthKey()
      const userPlan = getAccountPlan(prev.accounts, prev.currentUserId)
      const accounts = prev.accounts.map(a => {
        if (a.user.id !== prev.currentUserId) return a
        let scansUsed = a.user.scansUsed
        if (a.user.scansMonthKey !== monthKey) {
          scansUsed = 0
        }
        if (userPlan.type === 'free') scansUsed += 1
        return {
          ...a,
          user: {
            ...a.user,
            scansUsed,
            scansMonthKey: monthKey,
          },
        }
      })
      return { ...prev, accounts, scans: [scan, ...prev.scans] }
    })
  }, [])

  const addCVFile = useCallback((file: CVFileRecord) => {
    setPersisted(prev => {
      const exists = prev.cvFiles.some(
        f => f.userId === file.userId && f.fileName === file.fileName && f.fileSize === file.fileSize,
      )
      if (exists) return prev
      return { ...prev, cvFiles: [file, ...prev.cvFiles] }
    })
  }, [])

  const updateUser = useCallback((patch: Partial<User>) => {
    setPersisted(prev => ({
      ...prev,
      accounts: prev.accounts.map(a =>
        a.user.id === prev.currentUserId ? { ...a, user: { ...a.user, ...patch } } : a,
      ),
    }))
  }, [])

  const markNotificationRead = useCallback((id: string) => {
    setPersisted(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => (n.id === id ? { ...n, read: true } : n)),
    }))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setPersisted(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
    }))
  }, [])

  const toggleNotificationSetting = useCallback((key: string, enabled: boolean) => {
    setPersisted(prev => ({
      ...prev,
      accounts: prev.accounts.map(a =>
        a.user.id === prev.currentUserId
          ? { ...a, user: { ...a.user, notificationSettings: { ...a.user.notificationSettings, [key]: enabled } } }
          : a,
      ),
    }))
  }, [])

  const addInterviewSession = useCallback((session: InterviewSessionRecord) => {
    setPersisted(prev => ({ ...prev, interviews: [session, ...prev.interviews] }))
  }, [])

  const consumeInterviewSession = useCallback(() => {
    if (plan.type !== 'vip' || plan.interviewSessionsLeft <= 0) return false
    setPersisted(prev => ({
      ...prev,
      accounts: prev.accounts.map(a =>
        a.user.id === prev.currentUserId
          ? { ...a, planInfo: { ...a.planInfo, interviewSessionsLeft: a.planInfo.interviewSessionsLeft - 1 } }
          : a,
      ),
    }))
    return true
  }, [plan])

  const canScan = useCallback(() => {
    if (!user) return false
    if (plan.type !== 'free') return true
    if (USE_API && apiSession?.scansRemaining !== undefined) {
      return apiSession.scansRemaining > 0
    }
    const monthKey = getMonthKey()
    const used = user.scansMonthKey === monthKey ? user.scansUsed : 0
    return used < PLAN_LIMITS.free.scansPerMonth
  }, [apiSession, user, plan.type])

  const scansRemaining = useCallback(() => {
    if (!user) return 0
    if (plan.type !== 'free') return 999
    if (USE_API && apiSession?.scansRemaining !== undefined) {
      return apiSession.scansRemaining
    }
    const monthKey = getMonthKey()
    const used = user.scansMonthKey === monthKey ? user.scansUsed : 0
    return Math.max(0, PLAN_LIMITS.free.scansPerMonth - used)
  }, [apiSession, user, plan.type])

  const isPremium = useCallback(() => plan.type === 'premium' || plan.type === 'vip', [plan.type])
  const isVip = useCallback(() => plan.type === 'vip', [plan.type])

  const value: AppContextValue = {
    user,
    isAuthenticated: !!user,
    isAuthReady,
    plan,
    scans,
    cvFiles,
    interviews,
    notifications: persisted.notifications,
    hasSeenOnboarding: persisted.hasSeenOnboarding,
    login,
    loginWithGoogleDemo,
    register,
    logout,
    refreshSession,
    deleteAccount,
    upgradePlan,
    addScan,
    addCVFile,
    updateUser,
    markNotificationRead,
    markAllNotificationsRead,
    toggleNotificationSetting,
    consumeInterviewSession,
    addInterviewSession,
    canScan,
    scansRemaining,
    isPremium,
    isVip,
    getAccounts: () => USE_API ? [] : persisted.accounts,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function usePlanType(): PlanType {
  const { plan } = useApp()
  return plan.type
}
