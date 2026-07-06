import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Crown, Zap, ArrowLeft, Shield, Clock, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'

type PlanKey = 'premium' | 'vip'
type Billing = 'monthly' | 'quarterly'
type PaymentMethod = 'momo' | 'vnpay' | 'zalopay' | 'bank'
type PageState = 'form' | 'processing' | 'success' | 'failed'

const PLAN_INFO = {
  premium: {
    name: 'Premium Analysis',
    icon: Zap,
    iconBg: 'bg-blue-400/10',
    iconColor: 'text-blue-400',
    accentColor: 'text-blue-400',
    badgeBg: 'bg-blue-600',
    price: { monthly: 49000, quarterly: 99000 },
    savings: { monthly: null, quarterly: 'Tiết kiệm 30%' },
    features: [
      'Phân tích CV không giới hạn',
      'ATS check chi tiết + từ khoá',
      'Gợi ý công ty phù hợp với CV',
      'AI đề xuất khoá học theo điểm yếu',
      'Báo cáo PDF xuất khẩu',
      'Lịch sử không giới hạn',
      'Priority support',
    ],
    validity: { monthly: '30 ngày', quarterly: '90 ngày' },
  },
  vip: {
    name: 'VIP Interview',
    icon: Crown,
    iconBg: 'bg-yellow-400/10',
    iconColor: 'text-yellow-400',
    accentColor: 'text-yellow-400',
    badgeBg: 'bg-purple-600',
    price: { monthly: 149000, quarterly: 299000 },
    savings: { monthly: null, quarterly: 'Tiết kiệm 30%' },
    features: [
      'Tất cả tính năng Premium',
      '5 lượt phỏng vấn AI / gói',
      'Câu hỏi theo ngành & vị trí cụ thể',
      'Phân tích giọng nói & ngôn ngữ',
      'Feedback chi tiết từng câu trả lời',
      'Báo cáo điểm yếu & lộ trình cải thiện',
    ],
    validity: { monthly: '30 ngày', quarterly: '90 ngày' },
  },
}

const PAYMENT_METHODS: { id: PaymentMethod; name: string; logo: string; color: string }[] = [
  { id: 'momo', name: 'MoMo', logo: '🟣', color: 'border-pink-500/40 hover:border-pink-500' },
  { id: 'vnpay', name: 'VNPay', logo: '🔵', color: 'border-blue-500/40 hover:border-blue-500' },
  { id: 'zalopay', name: 'ZaloPay', logo: '🟦', color: 'border-sky-500/40 hover:border-sky-500' },
  { id: 'bank', name: 'Chuyển khoản', logo: '🏦', color: 'border-green-500/40 hover:border-green-500' },
]

function formatVnd(amount: number) {
  return amount.toLocaleString('vi-VN') + 'đ'
}

export default function PaymentPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { plan: currentPlan, upgradePlan, user } = useApp()
  const [searchParams] = useSearchParams()

  const planParam = searchParams.get('plan') as PlanKey | null
  const billingParam = searchParams.get('billing') as Billing | null

  const planKey: PlanKey = planParam === 'vip' ? 'vip' : 'premium'
  const billing: Billing = billingParam === 'quarterly' ? 'quarterly' : 'monthly'

  const [method, setMethod] = useState<PaymentMethod>('momo')
  const [pageState, setPageState] = useState<PageState>('form')
  const [progress, setProgress] = useState(0)

  const info = PLAN_INFO[planKey]
  const price = info.price[billing]
  const PlanIcon = info.icon

  useEffect(() => {
    if (currentPlan.type === planKey) {
      navigate('/pricing', { replace: true })
    }
  }, [currentPlan.type, planKey, navigate])

  const handleConfirm = async () => {
    setPageState('processing')
    setProgress(0)

    // Simulate checkout → confirm flow
    const steps = [20, 45, 70, 90, 100]
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 400))
      setProgress(step)
    }

    await new Promise(r => setTimeout(r, 300))

    // 95% success rate for demo
    if (Math.random() < 0.95) {
      upgradePlan(planKey, billing)
      setPageState('success')
    } else {
      setPageState('failed')
    }
  }

  const handleSuccessContinue = () => {
    if (planKey === 'vip') {
      toast.success('Nâng cấp VIP thành công', '5 buổi phỏng vấn AI đã được kích hoạt')
      navigate('/mock-interview')
    } else {
      toast.success('Nâng cấp Premium thành công', 'Đã mở khóa gợi ý công ty và khoá học')
      navigate('/dashboard')
    }
  }

  const handleRetry = () => {
    setPageState('form')
    setProgress(0)
  }

  if (pageState === 'processing') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-ns-card border border-ns rounded-2xl p-10 max-w-sm w-full text-center shadow-card">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6 relative">
            <RefreshCw size={28} className="keep-accent text-blue-400 animate-spin" />
          </div>
          <h2 className="font-heading font-bold text-ns-primary text-xl mb-2">Đang xử lý thanh toán</h2>
          <p className="text-ns-muted text-sm mb-8">Vui lòng không đóng trang này...</p>
          <div className="w-full bg-ns-raised rounded-full h-2 mb-3 overflow-hidden">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-ns-faint text-xs">{progress}%</p>
        </div>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-ns-card border border-ns rounded-2xl p-10 max-w-md w-full text-center shadow-card">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="keep-accent text-green-400" />
          </div>
          <h2 className="font-heading font-bold text-ns-primary text-2xl mb-2">Thanh toán thành công!</h2>
          <p className="text-ns-muted text-sm mb-2">
            Gói <span className="font-semibold text-ns-primary">{info.name}</span> đã được kích hoạt
          </p>
          <p className="text-ns-faint text-xs mb-8">
            Hiệu lực: {info.validity[billing]} kể từ hôm nay
          </p>
          <div className="bg-ns-raised border border-ns rounded-xl p-4 mb-8 text-left">
            <p className="text-ns-faint text-xs font-medium mb-3 uppercase tracking-wide">Tính năng đã mở khoá</p>
            <ul className="space-y-2">
              {info.features.slice(0, 4).map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-ns-secondary">
                  <Check size={14} className="keep-accent text-green-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
              {info.features.length > 4 && (
                <li className="text-ns-faint text-xs pl-5">+{info.features.length - 4} tính năng khác...</li>
              )}
            </ul>
          </div>
          <button type="button" onClick={handleSuccessContinue} className="btn-primary w-full text-sm py-3">
            {planKey === 'vip' ? 'Bắt đầu phỏng vấn AI →' : 'Đến Dashboard →'}
          </button>
        </div>
      </div>
    )
  }

  if (pageState === 'failed') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-ns-card border border-ns rounded-2xl p-10 max-w-sm w-full text-center shadow-card">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} className="keep-accent text-red-400" />
          </div>
          <h2 className="font-heading font-bold text-ns-primary text-xl mb-2">Thanh toán thất bại</h2>
          <p className="text-ns-muted text-sm mb-8">Không thể xử lý thanh toán. Vui lòng thử lại hoặc chọn phương thức khác.</p>
          <div className="flex flex-col gap-3">
            <button type="button" onClick={handleRetry} className="btn-primary text-sm py-3">Thử lại</button>
            <button type="button" onClick={() => navigate('/pricing')} className="border border-ns text-ns-secondary px-4 py-3 rounded-xl text-sm hover:bg-ns-raised transition cursor-pointer">
              Quay về bảng giá
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto animate-page-in">
      <button
        type="button"
        onClick={() => navigate('/pricing')}
        className="flex items-center gap-2 text-ns-muted hover:text-ns-primary text-sm mb-6 cursor-pointer transition"
      >
        <ArrowLeft size={16} />
        Quay lại bảng giá
      </button>

      <h1 className="font-heading font-bold text-ns-primary text-2xl mb-1">Xác nhận thanh toán</h1>
      <p className="text-ns-muted text-sm mb-8">Kiểm tra thông tin đơn hàng và chọn phương thức thanh toán</p>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* Left: Payment method */}
        <div className="space-y-5">
          <div className="bg-ns-card border border-ns rounded-2xl p-6 shadow-card">
            <h2 className="font-heading font-semibold text-ns-primary text-base mb-4">Phương thức thanh toán</h2>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition text-left cursor-pointer ${
                    method === m.id
                      ? 'border-blue-500 bg-blue-500/5'
                      : `border-ns bg-ns-raised/50 ${m.color}`
                  }`}
                >
                  <span className="text-2xl leading-none">{m.logo}</span>
                  <div>
                    <p className="text-ns-primary text-sm font-semibold">{m.name}</p>
                    {method === m.id && (
                      <p className="keep-accent text-blue-400 text-xs mt-0.5">Đã chọn</p>
                    )}
                  </div>
                  {method === m.id && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Payment info block */}
          {method === 'bank' ? (
            <div className="bg-ns-card border border-ns rounded-2xl p-6 shadow-card">
              <h2 className="font-heading font-semibold text-ns-primary text-base mb-4">Thông tin chuyển khoản</h2>
              <div className="space-y-3">
                {[
                  { label: 'Ngân hàng', value: 'Vietcombank' },
                  { label: 'Số tài khoản', value: '1234 5678 9012 3456' },
                  { label: 'Chủ tài khoản', value: 'NEXTSTEP AI PLATFORM' },
                  { label: 'Nội dung CK', value: `NEXTSTEP ${user?.email ?? 'user'} ${planKey.toUpperCase()}` },
                  { label: 'Số tiền', value: formatVnd(price) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-ns last:border-0">
                    <span className="text-ns-muted text-sm">{label}</span>
                    <span className="text-ns-primary text-sm font-medium font-mono">{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-ns-faint text-xs mt-4">Tài khoản sẽ được kích hoạt trong vòng 1-2 giờ sau khi chúng tôi xác nhận thanh toán.</p>
            </div>
          ) : (
            <div className="bg-ns-card border border-ns rounded-2xl p-6 shadow-card">
              <h2 className="font-heading font-semibold text-ns-primary text-base mb-1">
                Thanh toán qua {PAYMENT_METHODS.find(m => m.id === method)?.name}
              </h2>
              <p className="text-ns-muted text-sm mb-4">
                Nhấn "Xác nhận thanh toán" để được chuyển đến cổng thanh toán {PAYMENT_METHODS.find(m => m.id === method)?.name}.
              </p>
              <div className="bg-ns-raised rounded-xl p-4 border border-ns">
                <p className="text-ns-faint text-xs">Demo MVP — Thanh toán sẽ được mô phỏng, không thu phí thật.</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-ns-faint text-xs">
            <span className="flex items-center gap-1.5"><Shield size={12} /> Bảo mật SSL 256-bit</span>
            <span className="flex items-center gap-1.5"><Clock size={12} /> Kích hoạt ngay lập tức</span>
            <span className="flex items-center gap-1.5"><RefreshCw size={12} /> Hủy bất cứ lúc nào</span>
          </div>
        </div>

        {/* Right: Order summary */}
        <div className="space-y-5">
          <div className="bg-ns-card border border-ns rounded-2xl p-6 shadow-card">
            <h2 className="font-heading font-semibold text-ns-primary text-base mb-5">Tóm tắt đơn hàng</h2>

            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-ns">
              <div className={`w-12 h-12 ${info.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <PlanIcon size={22} className={`keep-accent ${info.iconColor}`} />
              </div>
              <div>
                <p className="font-heading font-bold text-ns-primary text-base">{info.name}</p>
                <p className="text-ns-muted text-sm">
                  {billing === 'monthly' ? 'Hàng tháng' : 'Combo 3 tháng'}
                  {info.savings[billing] && (
                    <span className="keep-accent text-green-400 ml-2 text-xs font-semibold">· {info.savings[billing]}</span>
                  )}
                </p>
              </div>
            </div>

            <ul className="space-y-2 mb-5 pb-5 border-b border-ns">
              {info.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-ns-secondary">
                  <Check size={14} className={`keep-accent ${info.iconColor} flex-shrink-0 mt-0.5`} />
                  {f}
                </li>
              ))}
            </ul>

            <div className="space-y-2 mb-5 pb-5 border-b border-ns">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ns-muted">Gói</span>
                <span className="text-ns-secondary">{info.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ns-muted">Thời hạn</span>
                <span className="text-ns-secondary">{info.validity[billing]}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ns-muted">Phương thức</span>
                <span className="text-ns-secondary">{PAYMENT_METHODS.find(m => m.id === method)?.name}</span>
              </div>
              {billing === 'quarterly' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ns-muted">Ưu đãi</span>
                  <span className="keep-accent text-green-400 font-semibold">Tiết kiệm 30%</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-6">
              <span className="font-heading font-semibold text-ns-primary">Tổng cộng</span>
              <span className="font-heading font-bold text-ns-primary text-2xl">{formatVnd(price)}</span>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="btn-primary w-full py-3.5 text-sm font-semibold rounded-xl"
            >
              Xác nhận thanh toán · {formatVnd(price)}
            </button>
            <p className="text-ns-faint text-xs text-center mt-3">
              Bằng cách thanh toán, bạn đồng ý với <span className="underline cursor-pointer">Điều khoản dịch vụ</span> của chúng tôi
            </p>
          </div>

          <div className="bg-ns-card border border-ns rounded-2xl p-5 shadow-card">
            <h3 className="font-heading font-semibold text-ns-primary text-sm mb-3">Chính sách hoàn tiền</h3>
            <ul className="space-y-2">
              {[
                'Hoàn tiền 100% trong 24 giờ đầu nếu chưa dùng',
                'Hủy bất cứ lúc nào, giữ quyền dùng đến hết chu kỳ',
                'Hỗ trợ 24/7 qua live chat & email',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-xs text-ns-muted">
                  <Check size={12} className="keep-accent text-green-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
