import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { User, Mail, Phone, Briefcase, Building2, Edit3, FileText, Camera, Check } from 'lucide-react'
import { NOTIFICATION_SETTING_LABELS } from '../constants'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import { formatDateTime, formatFileSize, formatPlanExpiry, getInitials } from '../lib/utils'
import { USE_API } from '../lib/config'
import { listAnalyses } from '../lib/api/analysis'
import type { AnalysisListItem } from '../lib/api/analysis'
import { getBillingMe } from '../lib/api/billing'
import type { BillingEntitlement } from '../lib/api/billing'
import { saveProfile } from '../lib/api/users'

type Tab = 'info' | 'history' | 'settings'

function sameInstant(left: string | null, right: string | null): boolean {
  if (!left || !right) return !left && !right
  return new Date(left).getTime() === new Date(right).getTime()
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()
  const {
    user, plan, scans, cvFiles, logout, deleteAccount, updateUser,
    toggleNotificationSetting, scansRemaining, refreshSession,
  } = useApp()

  const tabParam = searchParams.get('tab') as Tab | null
  const [activeTab, setActiveTab] = useState<Tab>(tabParam === 'settings' ? 'settings' : 'info')
  const [isEditing, setIsEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [remoteAnalyses, setRemoteAnalyses] = useState<AnalysisListItem[]>([])
  const [analysisLoading, setAnalysisLoading] = useState(USE_API)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [historyReload, setHistoryReload] = useState(0)
  const [billing, setBilling] = useState<BillingEntitlement | null>(null)
  const [billingError, setBillingError] = useState<string | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    targetRole: user?.targetRole ?? '',
    targetIndustry: user?.targetIndustry ?? '',
  })

  useEffect(() => {
    if (tabParam === 'settings') setActiveTab('settings')
  }, [tabParam])

  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        name: user.name,
        phone: user.phone ?? '',
        targetRole: user.targetRole ?? '',
        targetIndustry: user.targetIndustry ?? '',
      })
    }
  }, [user, isEditing])

  useEffect(() => {
    if (!USE_API || !user) return
    let cancelled = false
    setAnalysisLoading(true)
    setAnalysisError(null)
    listAnalyses()
      .then(({ items }) => { if (!cancelled) setRemoteAnalyses(items) })
      .catch(() => { if (!cancelled) { setRemoteAnalyses([]); setAnalysisError('Không tải được lịch sử phân tích.') } })
      .finally(() => { if (!cancelled) setAnalysisLoading(false) })
    return () => { cancelled = true }
  }, [user?.id, historyReload])

  useEffect(() => {
    if (!USE_API || !user) return
    let cancelled = false
    setBilling(null)
    setBillingError(null)
    Promise.all([getBillingMe(), refreshSession()])
      .then(([entitlement]) => { if (!cancelled) setBilling(entitlement) })
      .catch(() => { if (!cancelled) setBillingError('Không xác minh được gói hiện tại. Vui lòng thử lại.') })
    return () => { cancelled = true }
  }, [user?.id, refreshSession])

  if (!user) return null

  const history = USE_API ? remoteAnalyses : scans
  const scores = (USE_API ? remoteAnalyses.map(s => s.reportedOverallScore) : scans.map(s => s.overallScore))
    .filter((score): score is number => score !== null && Number.isFinite(score) && score >= 0)
  const bestScore = scores.length ? Math.max(...scores) : null
  const billingConsistent = !USE_API || (billing !== null &&
    billing.planType === plan.type &&
    billing.scanLimitPerMonth === user.scansLimit &&
    billing.vipSessionsLeft === plan.interviewSessionsLeft &&
    sameInstant(billing.expiresAt, plan.expiresAt ?? null))
  const planName = !billingConsistent ? 'Đang xác minh' : billing?.status === 'suspended'
    ? 'Tạm khóa — liên hệ hỗ trợ' : billing?.status === 'expired'
      ? 'Đã hết hạn' : plan.type === 'vip' ? 'VIP Interview' : plan.type === 'premium' ? 'Premium' : 'Freemium'

  const handleTab = (key: Tab) => {
    setActiveTab(key)
    if (key === 'settings') setSearchParams({ tab: 'settings' })
    else setSearchParams({})
  }

  const handleSave = async () => {
    setSaveError(null)
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setSaveError('Họ và tên cần ít nhất 2 ký tự.')
      return
    }
    setSaving(true)
    try {
      if (USE_API) {
        await saveProfile({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          targetRole: formData.targetRole.trim() || null,
          targetIndustry: formData.targetIndustry.trim() || null,
        })
        await refreshSession()
      } else {
        updateUser({ ...formData })
      }
      setIsEditing(false)
      toast.success('Đã lưu thay đổi')
    } catch {
      setSaveError('Không lưu được thay đổi. Dữ liệu nhập vẫn được giữ để bạn thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (USE_API) return
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updateUser({ avatarUrl: reader.result as string })
      toast.success('Đã cập nhật ảnh đại diện')
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = async () => {
    if (deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteAccount()
      toast.success(USE_API ? 'Tài khoản đã được vô hiệu hóa' : 'Đã xóa tài khoản thành công')
      navigate('/')
    } catch {
      setDeleteError('Không thể xóa tài khoản lúc này. Tài khoản vẫn hoạt động; vui lòng thử lại.')
    } finally {
      setDeleting(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.info('Đã đăng xuất')
    navigate('/')
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: 'Thông tin' },
    { key: 'history', label: 'Lịch sử CV' },
    { key: 'settings', label: 'Cài đặt' },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {USE_API && (billingError || (billing && !billingConsistent)) && (
        <p role="alert" className="rounded-xl border border-amber-500/40 p-3 text-amber-300 text-sm">
          {billingError ?? 'Gói trên Hồ Sơ chưa khớp với máy chủ. Vui lòng tải lại trang hoặc liên hệ hỗ trợ.'}
        </p>
      )}
      <div className="bg-ns-card border border-ns rounded-2xl p-7 shadow-card">
        <div className="flex items-start gap-5">
          <div className="relative flex-shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <span className="text-white font-heading font-bold text-2xl">{getInitials(user.name)}</span>
              </div>
            )}
            {!USE_API && <>
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                aria-label="Đổi ảnh đại diện"
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center border-2 border-ns-sub cursor-pointer hover:bg-blue-700"
              >
                <Camera size={12} className="text-white" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading font-bold text-ns-primary text-xl">{user.name}</h2>
                <p className="text-ns-muted text-sm">{formData.targetRole || 'Chưa cập nhật'} · {formData.targetIndustry || '—'}</p>
                <p className="text-ns-faint text-xs mt-1">Tham gia từ {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
                plan.type === 'free' ? 'bg-slate-700 text-ns-secondary' : plan.type === 'vip' ? 'bg-purple-600/20 text-purple-400' : 'bg-blue-600/20 text-blue-400'
              }`}>
                {planName}
              </span>
            </div>
            {billingConsistent && plan.expiresAt && plan.type !== 'free' && (
              <p className="text-ns-faint text-xs mt-2">Hết hạn: {formatPlanExpiry(plan.expiresAt)}</p>
            )}
            {billingConsistent && plan.type === 'vip' && (
              <p className="text-purple-400 text-xs mt-1">Còn {plan.interviewSessionsLeft} buổi phỏng vấn</p>
            )}
            {plan.type === 'free' && (
              <button onClick={() => navigate('/pricing')} className="mt-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:opacity-90 transition cursor-pointer">
                Xem các gói
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-ns">
          {[
            { label: 'Tổng lần phân tích', value: analysisLoading ? '…' : analysisError ? '—' : history.length },
            { label: 'Điểm cao nhất', value: analysisLoading || analysisError || bestScore === null ? '—' : `${bestScore}/100` },
            { label: 'Scan còn lại', value: billingConsistent ? scansRemaining() : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="font-heading font-bold text-blue-400 text-2xl">{value}</p>
              <p className="text-ns-faint text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 bg-ns-card border border-ns rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => handleTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === t.key ? 'bg-blue-600 text-white' : 'text-ns-muted hover:text-ns-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="bg-ns-card border border-ns rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-semibold text-ns-primary">Thông tin cá nhân</h3>
            <button
              onClick={() => isEditing ? void handleSave() : setIsEditing(true)}
              disabled={saving}
              className="flex items-center gap-1.5 text-blue-400 text-sm hover:text-blue-300 cursor-pointer border border-blue-500/30 px-3 py-1.5 rounded-lg hover:bg-blue-500/10 transition"
            >
              <Edit3 size={13} /> {saving ? 'Đang lưu…' : isEditing ? 'Lưu thay đổi' : 'Chỉnh sửa'}
            </button>
          </div>
          {saveError && <p role="alert" className="mb-4 text-sm text-red-400">{saveError}</p>}
          <div className="space-y-5">
            {[
              { label: 'Họ và tên', icon: User, field: 'name' as const, value: formData.name, editable: true },
              { label: 'Email', icon: Mail, field: null, value: user.email, editable: false },
              { label: 'Số điện thoại', icon: Phone, field: 'phone' as const, value: formData.phone, editable: true },
              { label: 'Vị trí mục tiêu', icon: Briefcase, field: 'targetRole' as const, value: formData.targetRole, editable: true },
              { label: 'Ngành nghề', icon: Building2, field: 'targetIndustry' as const, value: formData.targetIndustry, editable: true },
            ].map(({ label, icon: Icon, field, value, editable }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-9 h-9 bg-blue-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-ns-faint text-xs mb-1">{label}</p>
                  {isEditing && editable && field ? (
                    <input
                      value={formData[field]}
                      onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                      className="input-field w-full text-sm py-1.5"
                    />
                  ) : (
                    <p className="text-ns-primary text-sm">{value || '—'}</p>
                  )}
                </div>
                {!editable && <span className="text-ns-faint text-xs">Không thể thay đổi</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-ns-primary">{USE_API ? 'Lịch sử phân tích CV' : 'Lịch sử CV đã tải lên'}</h3>
          {USE_API && analysisLoading ? <p className="text-ns-muted text-sm">Đang tải lịch sử từ máy chủ…</p> :
          USE_API && analysisError ? <div role="alert" className="text-red-400 text-sm">{analysisError} <button onClick={() => setHistoryReload(value => value + 1)} className="underline">Thử lại</button></div> :
          USE_API && remoteAnalyses.length > 0 ? remoteAnalyses.map(item => (
            <div key={item.id} className="bg-ns-card border border-ns rounded-xl px-5 py-4 flex items-center gap-4 shadow-card">
              <div className="w-9 h-9 bg-blue-600/10 rounded-lg flex items-center justify-center flex-shrink-0"><FileText size={16} className="text-blue-400" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-ns-primary text-sm font-medium truncate">{item.title || item.cvInput.fileName || 'Phân tích CV'}</p>
                <p className="text-ns-faint text-xs">{item.analyzedAt ? formatDateTime(item.analyzedAt) : 'Chưa có ngày phân tích'} · {item.reportedOverallScore !== null ? `${item.reportedOverallScore}/100` : 'Chưa có điểm'}</p>
              </div>
              <button onClick={() => navigate(`/analysis/${encodeURIComponent(item.id)}`)} className="text-blue-400 text-xs hover:text-blue-300 cursor-pointer">Xem báo cáo</button>
            </div>
          )) : (USE_API ? remoteAnalyses.length === 0 : cvFiles.length === 0) ? (
            <div className="bg-ns-card border border-ns rounded-xl p-8 text-center">
              <p className="text-ns-muted text-sm">{USE_API ? 'Chưa có phân tích CV trên tài khoản này.' : 'Chưa có CV nào được tải lên (chỉ ghi nhận file upload)'}</p>
            </div>
          ) : (
            cvFiles.map(f => (
              <div key={f.id} className="bg-ns-card border border-ns rounded-xl px-5 py-4 flex items-center gap-4 shadow-card">
                <div className="w-9 h-9 bg-blue-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-ns-primary text-sm font-medium truncate">{f.fileName}</p>
                  <p className="text-ns-faint text-xs">{formatFileSize(f.fileSize)} · {formatDateTime(f.uploadedAt)}</p>
                </div>
                <button
                  onClick={() => navigate('/cv-scan', { state: { cvFileId: f.id } })}
                  className="text-blue-400 text-xs hover:text-blue-300 cursor-pointer"
                >
                  Dùng lại
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-ns-card border border-ns rounded-2xl p-6 space-y-4 shadow-card">
            <h3 className="font-heading font-semibold text-ns-primary mb-2">Gói dịch vụ</h3>
            <div className="flex items-center justify-between p-4 bg-ns-page rounded-xl">
              <div>
                <p className="text-ns-primary text-sm font-medium">Gói hiện tại: <span className="text-ns-muted">{planName}</span></p>
                {plan.expiresAt && <p className="text-ns-faint text-xs mt-1">Hết hạn: {formatPlanExpiry(plan.expiresAt)}</p>}
              </div>
              {plan.type === 'free' && (
                <button onClick={() => navigate('/pricing')} className="bg-blue-600/20 text-blue-400 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-600/30 cursor-pointer">
                  Nâng cấp
                </button>
              )}
            </div>
          </div>

          <div className="bg-ns-card border border-ns rounded-2xl p-6 space-y-4 shadow-card">
            <h3 className="font-heading font-semibold text-ns-primary mb-2">Thông báo</h3>
            {USE_API && <p className="text-ns-faint text-xs">Tùy chọn thông báo chưa thể lưu trên máy chủ; vui lòng liên hệ hỗ trợ nếu cần thay đổi.</p>}
            {Object.entries(NOTIFICATION_SETTING_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-ns-secondary text-sm">{label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={USE_API}
                    checked={user.notificationSettings[key] ?? false}
                    onChange={e => {
                      toggleNotificationSetting(key, e.target.checked)
                      toast.info(e.target.checked ? `Đã bật ${label}` : `Đã tắt ${label}`)
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-ns-raised peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
            ))}
          </div>

          <div className="bg-ns-card border border-red-500/20 rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-ns-primary text-sm font-medium">Xóa tài khoản</p>
                <p className="text-ns-faint text-xs mt-0.5">{USE_API ? 'Tài khoản sẽ được đánh dấu đã xóa và không thể đăng nhập lại. Dữ liệu và giao dịch cũ vẫn được giữ trên máy chủ.' : 'Hành động này không thể hoàn tác'}</p>
              </div>
              <button onClick={() => { setDeleteError(null); setDeleteOpen(true) }} className="border border-red-500/40 text-red-400 text-sm px-4 py-2 rounded-lg hover:bg-red-500/10 transition cursor-pointer">Xóa tài khoản</button>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full border border-ns text-red-400 py-3 rounded-xl hover:bg-red-500/5 transition cursor-pointer font-medium">
            Đăng xuất
          </button>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title" onKeyDown={event => { if (event.key === 'Escape' && !deleting) setDeleteOpen(false) }} className="bg-ns-card border border-ns rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 id="delete-account-title" className="font-heading font-semibold text-ns-primary text-lg mb-2">Xóa tài khoản?</h3>
            <p className="text-ns-muted text-sm mb-6">{USE_API ? 'Máy chủ sẽ đánh dấu tài khoản đã xóa và thu hồi phiên đăng nhập. Dữ liệu hồ sơ, phân tích và giao dịch cũ không bị xóa vật lý ở bước này. Bạn sẽ không thể đăng nhập lại.' : 'Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác.'}</p>
            {deleteError && <p role="alert" className="text-red-400 text-sm mb-4">{deleteError}</p>}
            <div className="flex gap-3 justify-end">
              <button autoFocus onClick={() => setDeleteOpen(false)} disabled={deleting} className="border border-ns text-ns-secondary px-4 py-2 rounded-xl cursor-pointer">Hủy</button>
              <button onClick={() => void handleDelete()} disabled={deleting} className="bg-red-600 text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-red-700 disabled:opacity-60">{deleting ? 'Đang xóa…' : 'Xác nhận xóa'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
