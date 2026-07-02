import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { User, Mail, Phone, Briefcase, Building2, Edit3, FileText, Camera, Check } from 'lucide-react'
import { NOTIFICATION_SETTING_LABELS } from '../constants'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import { formatDateTime, formatFileSize, formatPlanExpiry, getInitials } from '../lib/utils'

type Tab = 'info' | 'history' | 'settings'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()
  const {
    user, plan, scans, cvFiles, logout, deleteAccount, updateUser,
    toggleNotificationSetting, scansRemaining,
  } = useApp()

  const tabParam = searchParams.get('tab') as Tab | null
  const [activeTab, setActiveTab] = useState<Tab>(tabParam === 'settings' ? 'settings' : 'info')
  const [isEditing, setIsEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
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
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone ?? '',
        targetRole: user.targetRole ?? '',
        targetIndustry: user.targetIndustry ?? '',
      })
    }
  }, [user])

  if (!user) return null

  const bestScore = scans.length ? Math.max(...scans.map(s => s.overallScore)) : 0
  const planName = plan.type === 'vip' ? 'VIP Interview' : plan.type === 'premium' ? 'Premium' : 'Freemium'

  const handleTab = (key: Tab) => {
    setActiveTab(key)
    if (key === 'settings') setSearchParams({ tab: 'settings' })
    else setSearchParams({})
  }

  const handleSave = () => {
    updateUser({
      name: formData.name,
      phone: formData.phone,
      targetRole: formData.targetRole,
      targetIndustry: formData.targetIndustry,
    })
    setIsEditing(false)
    toast.success('Đã lưu thay đổi')
  }

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updateUser({ avatarUrl: reader.result as string })
      toast.success('Đã cập nhật ảnh đại diện')
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = () => {
    deleteAccount()
    toast.success('Đã xóa tài khoản thành công')
    navigate('/')
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
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center border-2 border-ns-sub cursor-pointer hover:bg-blue-700"
            >
              <Camera size={12} className="text-white" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
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
            {plan.expiresAt && plan.type !== 'free' && (
              <p className="text-ns-faint text-xs mt-2">Hết hạn: {formatPlanExpiry(plan.expiresAt)}</p>
            )}
            {plan.type === 'vip' && (
              <p className="text-purple-400 text-xs mt-1">Còn {plan.interviewSessionsLeft} buổi phỏng vấn</p>
            )}
            {plan.type === 'free' && (
              <button onClick={() => navigate('/pricing')} className="mt-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:opacity-90 transition cursor-pointer">
                Nâng cấp Premium
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-ns">
          {[
            { label: 'Tổng lần phân tích', value: scans.length },
            { label: 'Điểm cao nhất', value: bestScore ? `${bestScore}/100` : '—' },
            { label: 'Scan còn lại', value: plan.type === 'free' ? scansRemaining() : '∞' },
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
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="flex items-center gap-1.5 text-blue-400 text-sm hover:text-blue-300 cursor-pointer border border-blue-500/30 px-3 py-1.5 rounded-lg hover:bg-blue-500/10 transition"
            >
              <Edit3 size={13} /> {isEditing ? 'Lưu thay đổi' : 'Chỉnh sửa'}
            </button>
          </div>
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
          <h3 className="font-heading font-semibold text-ns-primary">Lịch sử CV đã tải lên</h3>
          {cvFiles.length === 0 ? (
            <div className="bg-ns-card border border-ns rounded-xl p-8 text-center">
              <p className="text-ns-muted text-sm">Chưa có CV nào được tải lên (chỉ ghi nhận file upload)</p>
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
            {Object.entries(NOTIFICATION_SETTING_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-ns-secondary text-sm">{label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
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
            <h3 className="font-heading font-semibold text-red-400 mb-3">Vùng nguy hiểm</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-ns-primary text-sm font-medium">Xóa tài khoản</p>
                <p className="text-ns-faint text-xs mt-0.5">Hành động này không thể hoàn tác</p>
              </div>
              <button onClick={() => setDeleteOpen(true)} className="border border-red-500/40 text-red-400 text-sm px-4 py-2 rounded-lg hover:bg-red-500/10 transition cursor-pointer">
                Xóa tài khoản
              </button>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full border border-ns text-red-400 py-3 rounded-xl hover:bg-red-500/5 transition cursor-pointer font-medium">
            Đăng xuất
          </button>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-ns-card border border-ns rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-heading font-semibold text-ns-primary text-lg mb-2">Xóa tài khoản?</h3>
            <p className="text-ns-muted text-sm mb-6">Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteOpen(false)} className="border border-ns text-ns-secondary px-4 py-2 rounded-xl cursor-pointer">Hủy</button>
              <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-red-700">Xóa tài khoản</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
