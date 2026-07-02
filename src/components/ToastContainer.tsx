import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { useToast, type ToastType } from '../contexts/ToastContext'

const styles: Record<ToastType, { border: string; icon: typeof CheckCircle; iconClass: string }> = {
  success: { border: 'border-green-500/40', icon: CheckCircle, iconClass: 'text-green-400' },
  error: { border: 'border-red-500/40', icon: AlertCircle, iconClass: 'text-red-400' },
  warning: { border: 'border-yellow-500/40', icon: AlertTriangle, iconClass: 'text-yellow-400' },
  info: { border: 'border-blue-500/40', icon: Info, iconClass: 'text-blue-400' },
}

export default function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-[min(420px,calc(100vw-2rem))]">
      {toasts.map(t => {
        const s = styles[t.type]
        const Icon = s.icon
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 bg-ns-card border ${s.border} rounded-xl p-4 shadow-lg animate-fade-in`}
            role="alert"
          >
            <Icon size={20} className={`${s.iconClass} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className="text-ns-primary text-sm font-semibold">{t.title}</p>
              {t.message && <p className="text-ns-muted text-xs mt-1">{t.message}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-ns-faint hover:text-ns-primary transition cursor-pointer flex-shrink-0"
              aria-label="Đóng"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
