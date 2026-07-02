import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Star, Zap, Crown, ChevronDown } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import { formatPlanExpiry } from '../lib/utils'

type Billing = 'monthly' | 'quarterly'
type ConfirmPlan = 'premium' | 'vip' | null

const plans = {
  free: {
    name: 'Freemium',
    icon: Star,
    iconColor: 'text-ns-muted',
    iconBg: 'bg-slate-400/10',
    price: { monthly: 0, quarterly: 0 },
    unit: 'tháng',
    badge: null,
    border: 'border-ns',
    cta: 'Gói hiện tại',
    ctaStyle: 'border border-ns text-ns-muted cursor-not-allowed',
    features: [
      '3 lượt phân tích CV/tháng',
      'Điểm ATS & keyword cơ bản',
      'Đề xuất cải thiện tổng quát',
      'Lịch sử 7 ngày',
    ],
    notIncluded: [
      'Gợi ý công ty phù hợp',
      'Khoá học AI đề xuất',
      'Phỏng vấn AI',
      'Báo cáo chi tiết',
    ],
  },
  premium: {
    name: 'Premium Analysis',
    icon: Zap,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-400/10',
    price: { monthly: 49000, quarterly: 99000 },
    unit: (billing: Billing) => billing === 'monthly' ? 'tháng' : '3 tháng',
    badge: 'Phổ biến nhất',
    border: 'border-blue-500',
    cta: 'Bắt đầu dùng thử',
    ctaStyle: 'bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:opacity-90 cursor-pointer',
    features: [
      'Phân tích CV không giới hạn',
      'ATS check chi tiết + từ khoá',
      'Gợi ý công ty phù hợp với CV',
      'AI đề xuất khoá học theo điểm yếu',
      'Báo cáo PDF xuất khẩu',
      'Lịch sử không giới hạn',
      'Priority support',
    ],
    notIncluded: [
      'Phỏng vấn AI 1-on-1',
    ],
  },
  vip: {
    name: 'VIP Interview',
    icon: Crown,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-400/10',
    price: { monthly: 149000, quarterly: null },
    perSession: { min: 19000, max: 29000 },
    unit: '5 buổi',
    badge: 'Cao cấp',
    border: 'border-purple-500/40',
    cta: 'Nâng cấp gói',
    ctaStyle: 'border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 cursor-pointer',
    features: [
      'Tất cả tính năng Premium',
      '5 buổi phỏng vấn AI / gói',
      'Câu hỏi theo ngành & vị trí cụ thể',
      'Phân tích giọng nói & ngôn ngữ',
      'Feedback chi tiết từng câu trả lời',
      'Báo cáo điểm yếu & lộ trình cải thiện',
      'Luyện voice & text interview',
    ],
    notIncluded: [],
  },
}

const faqs = [
  { q: 'Tôi có thể dùng thử trước khi mua không?', a: 'Có! Gói Freemium miễn phí hoàn toàn với 3 lượt scan/tháng để bạn trải nghiệm.' },
  { q: 'Thanh toán qua những kênh nào?', a: 'Chúng tôi hỗ trợ MoMo, ZaloPay, thẻ ngân hàng nội địa và chuyển khoản.' },
  { q: 'Có thể hủy gói bất cứ lúc nào không?', a: 'Có. Bạn có thể hủy bất cứ lúc nào và giữ quyền dùng đến hết chu kỳ đã thanh toán.' },
  { q: 'Dữ liệu CV của tôi có được bảo mật không?', a: 'Hoàn toàn bảo mật. CV chỉ được dùng để phân tích và không chia sẻ với bên thứ ba.' },
]

export default function PricingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { plan, upgradePlan } = useApp()
  const [billing, setBilling] = useState<Billing>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [confirmPlan, setConfirmPlan] = useState<ConfirmPlan>(null)

  const formatPrice = (price: number) =>
    price === 0 ? 'Miễn phí' : `${price.toLocaleString('vi-VN')}đ`

  const handleUpgrade = (type: 'premium' | 'vip') => {
    if (plan.type === type || (type === 'premium' && plan.type === 'vip')) {
      toast.info('Bạn đang sử dụng gói này hoặc cao hơn')
      return
    }
    setConfirmPlan(type)
  }

  const confirmUpgrade = () => {
    if (!confirmPlan) return
    upgradePlan(confirmPlan, billing)
    if (confirmPlan === 'premium') {
      toast.success('Nâng cấp Premium thành công', 'Đã mở khóa Công việc phù hợp và Khoá học')
      navigate('/dashboard')
    } else {
      toast.success('Nâng cấp VIP thành công', 'Bạn có 5 buổi phỏng vấn AI')
      navigate('/mock-interview')
    }
    setConfirmPlan(null)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-heading font-bold text-ns-primary text-3xl mb-3">Chọn gói phù hợp với bạn</h1>
        <p className="text-ns-muted text-base mb-4">Bắt đầu miễn phí, nâng cấp khi cần thêm sức mạnh từ AI</p>
        {plan.type !== 'free' && (
          <p className="text-blue-400 text-sm mb-4">
            Gói hiện tại: {plan.type === 'vip' ? 'VIP' : 'Premium'}
            {plan.expiresAt && ` · Hết hạn ${formatPlanExpiry(plan.expiresAt)}`}
          </p>
        )}

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-1 bg-ns-card border border-ns rounded-xl p-1">
          {(['monthly', 'quarterly'] as Billing[]).map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${billing === b ? 'bg-blue-600 text-white' : 'text-ns-muted hover:text-ns-primary'}`}
            >
              {b === 'monthly' ? 'Hàng tháng' : '3 tháng -30%'}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Free */}
        <div className={`bg-ns-card border ${plans.free.border} rounded-2xl p-7 flex flex-col`}>
          <div className={`w-12 h-12 ${plans.free.iconBg} rounded-xl flex items-center justify-center mb-5`}>
            <plans.free.icon size={22} className={plans.free.iconColor} />
          </div>
          <h3 className="font-heading font-bold text-ns-primary text-xl mb-1">{plans.free.name}</h3>
          <div className="mb-6">
            <span className="font-heading font-bold text-ns-primary text-4xl">Miễn phí</span>
            <span className="text-ns-faint text-sm"> mãi mãi</span>
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            {plans.free.features.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-ns-secondary">
                <Check size={15} className="text-green-400 flex-shrink-0 mt-0.5" /> {f}
              </li>
            ))}
            {plans.free.notIncluded.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-ns-faint line-through">
                <Check size={15} className="text-ns-faint flex-shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>
          <button className={`w-full py-3 rounded-xl font-semibold text-sm ${plans.free.ctaStyle}`} disabled>
            {plans.free.cta}
          </button>
        </div>

        {/* Premium */}
        <div className={`bg-ns-card border-2 ${plans.premium.border} rounded-2xl p-7 flex flex-col relative`}>
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
            {plans.premium.badge}
          </div>
          <div className={`w-12 h-12 ${plans.premium.iconBg} rounded-xl flex items-center justify-center mb-5`}>
            <plans.premium.icon size={22} className={plans.premium.iconColor} />
          </div>
          <h3 className="font-heading font-bold text-ns-primary text-xl mb-1">{plans.premium.name}</h3>
          <div className="mb-6">
            <span className="font-heading font-bold text-ns-primary text-4xl">
              {formatPrice(billing === 'monthly' ? plans.premium.price.monthly : plans.premium.price.quarterly)}
            </span>
            <span className="text-ns-faint text-sm">/{typeof plans.premium.unit === 'function' ? plans.premium.unit(billing) : plans.premium.unit}</span>
            {billing === 'quarterly' && (
              <span className="ml-2 text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full">Tiết kiệm 30%</span>
            )}
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            {plans.premium.features.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-ns-secondary">
                <Check size={15} className="text-green-400 flex-shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleUpgrade('premium')}
            disabled={plan.type === 'premium' || plan.type === 'vip'}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plans.premium.ctaStyle} disabled:opacity-50`}
          >
            {plan.type === 'premium' || plan.type === 'vip' ? 'Đã nâng cấp' : plans.premium.cta}
          </button>
        </div>

        {/* VIP */}
        <div className={`bg-ns-card border ${plans.vip.border} rounded-2xl p-7 flex flex-col relative bg-gradient-to-b from-purple-900/10 to-transparent`}>
          <div className={`w-12 h-12 ${plans.vip.iconBg} rounded-xl flex items-center justify-center mb-5`}>
            <plans.vip.icon size={22} className={plans.vip.iconColor} />
          </div>
          <h3 className="font-heading font-bold text-ns-primary text-xl mb-1">{plans.vip.name}</h3>
          <div className="mb-2">
            <span className="font-heading font-bold text-ns-primary text-4xl">{formatPrice(plans.vip.price.monthly!)}</span>
            <span className="text-ns-faint text-sm">/{plans.vip.unit}</span>
          </div>
          <p className="text-ns-faint text-xs mb-6">hoặc {formatPrice(plans.vip.perSession.min)}–{formatPrice(plans.vip.perSession.max)}/buổi</p>
          <ul className="space-y-2.5 flex-1 mb-6">
            {plans.vip.features.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-ns-secondary">
                <Check size={15} className="text-yellow-400 flex-shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleUpgrade('vip')}
            disabled={plan.type === 'vip'}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plans.vip.ctaStyle} disabled:opacity-50`}
          >
            {plan.type === 'vip' ? 'Đã nâng cấp VIP' : plans.vip.cta}
          </button>
        </div>
      </div>

      {/* Trust signals */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { value: '10,000+', label: 'Người dùng' },
          { value: '95%', label: 'Hài lòng sau phân tích' },
          { value: '500+', label: 'Công ty trong dữ liệu' },
        ].map(({ value, label }) => (
          <div key={label} className="bg-ns-card border border-ns rounded-xl p-4">
            <p className="font-heading font-bold text-blue-400 text-2xl">{value}</p>
            <p className="text-ns-faint text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div>
        <h2 className="font-heading font-bold text-ns-primary text-xl mb-5 text-center">Câu hỏi thường gặp</h2>
        <div className="space-y-2 max-w-2xl mx-auto">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-ns-card border border-ns rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
              >
                <span className="text-ns-primary text-sm font-medium">{faq.q}</span>
                <ChevronDown size={16} className={`text-ns-muted flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-ns-muted text-sm border-t border-ns pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {confirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-ns-card border border-ns rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-heading font-semibold text-ns-primary text-lg mb-2">
              Xác nhận nâng cấp {confirmPlan === 'premium' ? 'Premium' : 'VIP'}
            </h3>
            <p className="text-ns-muted text-sm mb-6">
              Demo MVP — không thu phí thật. Gói sẽ được kích hoạt ngay trên tài khoản của bạn.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmPlan(null)} className="border border-ns text-ns-secondary px-4 py-2 rounded-xl cursor-pointer">Hủy</button>
              <button onClick={confirmUpgrade} className="btn-primary text-sm">Xác nhận nâng cấp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
