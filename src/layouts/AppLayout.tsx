import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom'
import {
  LayoutDashboard, FileText, BarChart2, Mic, User, Zap,
  Settings, LogOut, Menu, X, Bell, ChevronRight, Sun, Moon,
} from 'lucide-react'
import { formatDateTime, formatPlanExpiry, getInitials } from '../lib/utils'
import { useTheme } from '../contexts/ThemeContext'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import BrandName from '../components/BrandName'
import LogoMark from '../components/LogoMark'

const navMain = [
  { label: 'Tổng quan', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Phân tích CV', icon: FileText, path: '/cv-scan' },
  { label: 'Kết quả phân tích', icon: BarChart2, path: '/analysis' },
  { label: 'Phỏng vấn AI', icon: Mic, path: '/mock-interview' },
]

const navAccount = [
  { label: 'Hồ sơ', icon: User, path: '/profile' },
  { label: 'Nâng cấp', icon: Zap, path: '/pricing', highlight: true },
  { label: 'Cài đặt', icon: Settings, path: '/profile?tab=settings' },
]

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, logout } = useApp()
  const toast = useToast()

  const isActive = (path: string) => {
    if (path.startsWith('/profile')) return location.pathname === '/profile'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const isAccountNavActive = (path: string) => {
    if (path === '/pricing') return location.pathname === '/pricing'
    if (path === '/profile?tab=settings') {
      return location.pathname === '/profile' && searchParams.get('tab') === 'settings'
    }
    if (path === '/profile') {
      return location.pathname === '/profile' && searchParams.get('tab') !== 'settings'
    }
    return false
  }

  const handleNav = (path: string) => {
    navigate(path)
    onNavClick?.()
  }

  const handleLogout = () => {
    logout()
    toast.info('Đã đăng xuất')
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="flex flex-col h-full">
      <div className="h-16 flex-shrink-0 flex items-center px-6 border-b border-ns app-shell-header">
        <Link to="/dashboard" className="flex items-center gap-3 min-w-0">
          <LogoMark brandSize="md" />
          <BrandName size="md" className="hidden lg:inline" />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-ns-faint text-xs font-semibold uppercase tracking-wider px-3 mb-3">Chính</p>
        {navMain.map(({ label, icon: Icon, path }) => (
          <button
            key={path}
            onClick={() => handleNav(path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              isActive(path) ? 'bg-blue-600/20 text-blue-400 keep-accent' : 'text-ns-muted hover:bg-ns-raised hover:text-ns-primary'
            }`}
          >
            <Icon size={18} />
            {label}
            {isActive(path) && <ChevronRight size={14} className="ml-auto text-blue-400 keep-accent" />}
          </button>
        ))}

        <p className="text-ns-faint text-xs font-semibold uppercase tracking-wider px-3 mt-6 mb-3">Tài khoản</p>
        {navAccount.map(({ label, icon: Icon, path, highlight }) => {
          const active = isAccountNavActive(path)
          return (
          <button
            key={label}
            onClick={() => handleNav(path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              active
                ? 'bg-blue-600/20 text-blue-400 keep-accent'
                : highlight
                  ? 'text-yellow-400 hover:bg-ns-raised'
                  : 'text-ns-muted hover:bg-ns-raised hover:text-ns-primary'
            }`}
          >
            <Icon size={18} />
            {label}
            {active && <ChevronRight size={14} className="ml-auto text-blue-400 keep-accent" />}
          </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-ns">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{getInitials(user.name)}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-ns-primary text-sm font-medium truncate">{user.name}</p>
            <p className="text-ns-faint text-xs truncate">{user.email}</p>
          </div>
          <button onClick={handleLogout} className="text-ns-faint hover:text-red-400 transition-colors cursor-pointer" title="Đăng xuất">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { user, plan, notifications, markNotificationRead, markAllNotificationsRead } = useApp()
  const notifRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pageTitles: Record<string, string> = {
    '/dashboard': 'Tổng quan',
    '/cv-scan': 'Phân tích CV',
    '/analysis': 'Kết quả phân tích',
    '/mock-interview': 'Phỏng vấn AI',
    '/profile': 'Hồ sơ cá nhân',
    '/pricing': 'Nâng cấp gói',
  }

  const pageTitle =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith('/analysis/') ? 'Chi tiết phân tích' : 'NextStep AI')

  const planLabel =
    plan.type === 'vip' ? 'VIP' : plan.type === 'premium' ? 'Premium' : 'Free'

  return (
    <div className="flex h-screen bg-ns-page overflow-hidden">
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-ns-card border-r border-ns flex-col">
        <SidebarContent />
      </aside>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative w-72 bg-ns-card border-r border-ns flex flex-col h-full z-10">
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 text-ns-muted hover:text-ns-primary cursor-pointer">
              <X size={20} />
            </button>
            <SidebarContent onNavClick={() => setIsMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex-shrink-0 app-shell-header backdrop-blur-md border-b border-ns flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-ns-muted hover:text-ns-primary cursor-pointer">
              <Menu size={20} />
            </button>
            <h1 className="text-ns-primary font-heading font-semibold text-lg">{pageTitle}</h1>
            {user && (
              <span className={`hidden sm:inline text-xs font-semibold px-2.5 py-1 rounded-full badge-pill ${
                plan.type === 'vip'
                  ? 'bg-purple-600/20 text-purple-400 keep-accent'
                  : plan.type === 'premium'
                    ? 'bg-blue-600/20 text-blue-400 keep-accent'
                    : 'bg-ns-raised text-ns-muted border border-ns'
              }`} title={plan.expiresAt ? `Hết hạn: ${formatPlanExpiry(plan.expiresAt)}` : undefined}>
                {planLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="text-ns-muted hover:text-ns-primary transition-colors cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-ns-raised"
              title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                className="relative text-ns-muted hover:text-ns-primary transition-colors cursor-pointer p-1"
              >
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 badge-pill">
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-[360px] max-h-96 overflow-y-auto bg-ns-card border border-ns rounded-2xl shadow-xl z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-ns">
                    <p className="text-ns-primary font-semibold text-sm">Thông báo</p>
                    {unread > 0 && (
                      <button onClick={markAllNotificationsRead} className="text-blue-400 text-xs cursor-pointer hover:text-blue-300">
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="p-4 text-ns-muted text-sm text-center">Không có thông báo mới</p>
                  ) : (
                    notifications.map(n => (
                      <button
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`w-full text-left px-4 py-3 border-b border-ns-sub hover:bg-ns-raised cursor-pointer ${!n.read ? 'bg-blue-600/5' : ''}`}
                      >
                        <div className="flex gap-2">
                          {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-ns-primary text-sm font-medium">{n.title}</p>
                            <p className="text-ns-muted text-xs mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-ns-faint text-[10px] mt-1">{formatDateTime(n.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {plan.type === 'free' && (
              <button
                onClick={() => navigate('/pricing')}
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition cursor-pointer hidden sm:inline"
              >
                Nâng cấp
              </button>
            )}

            <div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center cursor-pointer overflow-hidden"
              onClick={() => navigate('/profile')}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">{user ? getInitials(user.name) : '?'}</span>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div key={location.pathname} className="animate-page-in min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
