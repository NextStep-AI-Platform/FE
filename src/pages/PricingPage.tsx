import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Star, Zap, Crown, ChevronDown } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import { formatPlanExpiry } from '../lib/utils'
import type { PlanType } from '../types'

type Billing = 'monthly' | 'quarterly'
type PlanKey = 'free' | 'premium' | 'vip'
type ConfirmPlan = 'premium' | 'vip' | null

const PLANS = {
  free: {
    name: 'Freemium',
    icon: Star,
    iconColor: 'text-ns-muted',
    iconBg: 'bg-slate-400/10',
    price: { monthly: 0, quarterly: 0 },
    border: 'border-ns',
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
    iconColor: 'keep-accent text-blue-400',
    iconBg: 'bg-blue-400/10',
    price: { monthly: 49000, quarterly: 99000 },
    unit: (billing: Billing) => (billing === 'monthly' ? 'tháng' : '3 tháng'),
    badge: 'Phổ biến nhất',
    border: 'border-blue-500',
    features: [
      'Phân tích CV không giới hạn',
      'ATS check chi tiết + từ khoá',
      'Gợi ý công ty phù hợp với CV',
      'AI đề xuất khoá học theo điểm yếu',
      'Báo cáo PDF xuất khẩu',
      'Lịch sử không giới hạn',
      'Priority support',
    ],
    notIncluded: ['Phỏng vấn AI 1-on-1'],
  },
  vip: {
    name: 'VIP Interview',
    icon: Crown,
    iconColor: 'keep-accent text-yellow-400',
    iconBg: 'bg-yellow-400/10',
    price: { monthly: 149000, quarterly: 299000 },
    unit: (billing: Billing) => (billing === 'monthly' ? '5 lượt' : '15 lượt · 3 tháng'),
    badge: 'Cao cấp',
    border: 'border-purple-500/40',
    perSession: { min: 19000, max: 29000 },
    features: [
      'Tất cả tính năng Premium',
      '5 lượt phỏng vấn AI / gói',
      'Câu hỏi theo ngành & vị trí cụ thể',
      'Phân tích giọng nói & ngôn ngữ',
      'Feedback chi tiết từng câu trả lời',
      'Báo cáo điểm yếu & lộ trình cải thiện',
      'Luyện voice & text interview',
    ],
    notIncluded: [] as string[],
  },
}

const faqs = [
  { q: 'Tôi có thể dùng thử trước khi mua không?', a: 'Có! Gói Freemium miễn phí hoàn toàn với 3 lượt scan/tháng để bạn trải nghiệm.' },
  { q: 'Thanh toán qua những kênh nào?', a: 'Chúng tôi hỗ trợ MoMo, ZaloPay, thẻ ngân hàng nội địa và chuyển khoản.' },
  { q: 'Có thể hủy gói bất cứ lúc nào không?', a: 'Có. Bạn có thể hủy bất cứ lúc nào và giữ quyền dùng đến hết chu kỳ đã thanh toán.' },
  { q: 'Dữ liệu CV của tôi có được bảo mật không?', a: 'Hoàn toàn bảo mật. CV chỉ được dùng để phân tích và không chia sẻ với bên thứ ba.' },
]

function planButton(current: PlanType, target: PlanKey): { label: string; disabled: boolean; upgrade?: 'premium' | 'vip' } {
  if (current === target) return { label: 'Gói hiện tại', disabled: true }
  if (target === 'free') return { label: 'Freemium', disabled: true }
  if (current === 'vip') return { label: target === 'premium' ? 'Premium Analysis' : 'VIP Interview', disabled: true }
  if (target === 'premium') return { label: 'Bắt đầu dùng thử', disabled: false, upgrade: 'premium' }
  return { label: 'Nâng cấp VIP', disabled: false, upgrade: 'vip' }
}

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
    const btn = planButton(plan.type, type)
    if (btn.disabled || !btn.upgrade) return
    setConfirmPlan(type)
  }

  const confirmUpgrade = () => {
    if (!confirmPlan) return
    upgradePlan(confirmPlan, billing)
    if (confirmPlan === 'premium') {
      toast.success('Nâng cấp Premium thành công', 'Đã mở khóa gợi ý công ty phù hợp và khoá học')
      navigate('/dashboard')
    } else {
      toast.success('Nâng cấp VIP thành công', '5 buổi phỏng vấn AI — vào tab Phỏng vấn AI để bắt đầu')
      navigate('/mock-interview')
    }
    setConfirmPlan(null)
  }

  const freeBtn = planButton(plan.type, 'free')
  const premiumBtn = planButton(plan.type, 'premium')
  const vipBtn = planButton(plan.type, 'vip')

  const premiumPrice = billing === 'monthly' ? PLANS.premium.price.monthly : PLANS.premium.price.quarterly
  const vipPrice = billing === 'monthly' ? PLANS.vip.price.monthly : PLANS.vip.price.quarterly

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-12 animate-page-in">
      <div className="text-center">
        <h1 className="font-heading font-bold text-ns-primary text-3xl mb-3">Chọn gói phù hợp với bạn</h1>
        <p className="text-ns-muted text-base mb-4">Bắt đầu miễn phí, nâng cấp khi cần thêm sức mạnh từ AI</p>
        {plan.type !== 'free' && (
          <p className="keep-accent text-blue-400 text-sm mb-4">
            Gói hiện tại: {plan.type === 'vip' ? 'VIP' : 'Premium'}
            {plan.expiresAt && ` · Hết hạn ${formatPlanExpiry(plan.expiresAt)}`}
          </p>
        )}

        <div className="inline-flex items-center gap-1 pricing-toggle bg-ns-card border border-ns rounded-xl p-1">
          {(['monthly', 'quarterly'] as Billing[]).map(b => (
            <button
              key={b}
              type="button"
              onClick={() => setBilling(b)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${billing === b ? 'bg-blue-600 text-white' : 'text-ns-muted hover:text-ns-primary'}`}
            >
              {b === 'monthly' ? 'Hàng tháng' : 'Combo 3 tháng'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className={`pricing-plan-card bg-ns-card border ${PLANS.free.border} rounded-2xl p-7 flex flex-col card-interactive shadow-card ${plan.type === 'free' ? 'ring-2 ring-blue-500/30' : ''}`}>
          <div className={`w-12 h-12 ${PLANS.free.iconBg} stat-icon-tile rounded-xl flex items-center justify-center mb-5`}>
            <PLANS.free.icon size={22} className={PLANS.free.iconColor} />
          </div>
          <h3 className="font-heading font-bold text-ns-primary text-xl mb-1">{PLANS.free.name}</h3>
          <div className="mb-6">
            <span className="font-heading font-bold text-ns-primary text-4xl">Miễn phí</span>
            <span className="text-ns-faint text-sm"> mãi mãi</span>
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            {PLANS.free.features.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-ns-secondary">
                <Check size={15} className="keep-accent text-green-400 flex-shrink-0 mt-0.5" /> {f}
              </li>
            ))}
            {PLANS.free.notIncluded.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-ns-faint line-through">
                <Check size={15} className="text-ns-faint flex-shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>
          <button type="button" className="w-full py-3 rounded-xl font-semibold text-sm border border-ns text-ns-muted cursor-not-allowed opacity-70" disabled>
            {freeBtn.label}
          </button>
        </div>

        <div className={`pricing-plan-card pricing-plan-card-popular bg-ns-card border-2 ${PLANS.premium.border} rounded-2xl p-7 flex flex-col relative card-interactive shadow-card ${plan.type === 'premium' ? 'ring-2 ring-blue-500/40' : ''}`}>
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
            {PLANS.premium.badge}
          </div>
          <div className={`w-12 h-12 ${PLANS.premium.iconBg} stat-icon-tile stat-icon-tile-blue rounded-xl flex items-center justify-center mb-5`}>
            <PLANS.premium.icon size={22} className={PLANS.premium.iconColor} />
          </div>
          <h3 className="font-heading font-bold text-ns-primary text-xl mb-1">{PLANS.premium.name}</h3>
          <div className="mb-6 flex flex-col items-start gap-2">
            <span className="font-heading font-bold text-ns-primary text-4xl leading-none">{formatPrice(premiumPrice)}</span>
            {billing === 'quarterly' && (
              <span className="inline-flex items-center text-[11px] font-semibold leading-none keep-accent bg-green-600/15 text-green-400 px-2.5 py-1.5 rounded-full border border-green-500/20 whitespace-nowrap">
                Tiết kiệm 30%
              </span>
            )}
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            {PLANS.premium.features.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-ns-secondary">
                <Check size={15} className="keep-accent text-green-400 flex-shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => premiumBtn.upgrade && handleUpgrade(premiumBtn.upgrade)}
            disabled={premiumBtn.disabled}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition ${
              premiumBtn.disabled
                ? 'border border-ns text-ns-muted cursor-not-allowed opacity-70'
                : 'bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:opacity-90 cursor-pointer'
            }`}
          >
            {premiumBtn.label}
          </button>
        </div>

        <div className={`pricing-plan-card pricing-vip-card bg-ns-card border ${PLANS.vip.border} rounded-2xl p-7 flex flex-col relative card-interactive shadow-card ${plan.type === 'vip' ? 'ring-2 ring-purple-500/30' : ''}`}>
          <div className={`w-12 h-12 ${PLANS.vip.iconBg} stat-icon-tile stat-icon-tile-yellow rounded-xl flex items-center justify-center mb-5`}>
            <PLANS.vip.icon size={22} className={PLANS.vip.iconColor} />
          </div>
          <h3 className="font-heading font-bold text-ns-primary text-xl mb-1">{PLANS.vip.name}</h3>
          <div className="mb-6 flex flex-col items-start gap-2">
            <span className="font-heading font-bold text-ns-primary text-4xl leading-none">{formatPrice(vipPrice)}</span>
            {billing === 'quarterly' && (
              <span className="inline-flex items-center text-[11px] font-semibold leading-none keep-accent bg-green-600/15 text-green-400 px-2.5 py-1.5 rounded-full border border-green-500/20 whitespace-nowrap">
                Tiết kiệm 30%
              </span>
            )}
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            {PLANS.vip.features.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-ns-secondary">
                <Check size={15} className="keep-accent text-yellow-400 flex-shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => vipBtn.upgrade && handleUpgrade(vipBtn.upgrade)}
            disabled={vipBtn.disabled}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition ${
              vipBtn.disabled
                ? 'border border-ns text-ns-muted cursor-not-allowed opacity-70'
                : 'border border-purple-500/50 text-purple-400 keep-accent hover:bg-purple-500/10 cursor-pointer'
            }`}
          >
            {vipBtn.label}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { value: '10,000+', label: 'Người dùng' },
          { value: '95%', label: 'Hài lòng sau phân tích' },
          { value: '500+', label: 'Công ty trong dữ liệu' },
        ].map(({ value, label }) => (
          <div key={label} className="pricing-stat-tile bg-ns-card border border-ns rounded-xl p-4 shadow-card">
            <p className="font-heading font-bold keep-accent text-blue-400 text-2xl">{value}</p>
            <p className="text-ns-faint text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-heading font-bold text-ns-primary text-xl mb-5 text-center">Câu hỏi thường gặp</h2>
        <div className="space-y-2 max-w-2xl mx-auto">
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item bg-ns-card border border-ns rounded-xl overflow-hidden shadow-card">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
              >
                <span className="text-ns-primary text-sm font-medium">{faq.q}</span>
                <ChevronDown size={16} className={`text-ns-muted flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-ns-muted text-sm border-t border-ns pt-3">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {confirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-ns-card border border-ns rounded-2xl p-6 max-w-md w-full shadow-xl animate-slide-up">
            <h3 className="font-heading font-semibold text-ns-primary text-lg mb-2">
              Xác nhận nâng cấp {confirmPlan === 'premium' ? 'Premium' : 'VIP'}
            </h3>
            <p className="text-ns-muted text-sm mb-6">
              Demo MVP — không thu phí thật. Gói {billing === 'quarterly' ? '3 tháng' : 'hàng tháng'} sẽ được kích hoạt ngay.
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setConfirmPlan(null)} className="border border-ns text-ns-secondary px-4 py-2 rounded-xl cursor-pointer">Hủy</button>
              <button type="button" onClick={confirmUpgrade} className="btn-primary text-sm">Xác nhận nâng cấp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
