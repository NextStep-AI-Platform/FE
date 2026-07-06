import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Crown, Zap, ArrowLeft, Shield, Clock, Copy, CheckCircle2, RefreshCw } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'

type PlanKey = 'premium' | 'vip'
type Billing = 'monthly' | 'quarterly'
type PaymentMethod = 'momo' | 'vnpay' | 'zalopay' | 'bank'
type PageState = 'form' | 'qr' | 'processing' | 'success'

// ─── Plan metadata ───────────────────────────────────────────────────────────

const PLAN_INFO = {
  premium: {
    name: 'Premium Analysis',
    icon: Zap,
    iconBg: 'bg-blue-400/10',
    iconColor: 'text-blue-400',
    price: { monthly: 49000, quarterly: 99000 },
    savings: { monthly: null as null, quarterly: 'Tiết kiệm 30%' },
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
    price: { monthly: 149000, quarterly: 299000 },
    savings: { monthly: null as null, quarterly: 'Tiết kiệm 30%' },
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

// ─── Payment method metadata ─────────────────────────────────────────────────

const METHODS: Record<PaymentMethod, {
  name: string
  emoji: string
  qrColor: string
  badgeBg: string
  badgeText: string
  borderActive: string
  borderHover: string
  instruction: string
  appNote: string
}> = {
  momo: {
    name: 'MoMo',
    emoji: '🟣',
    qrColor: '#a50064',
    badgeBg: 'bg-pink-600/15',
    badgeText: 'text-pink-400',
    borderActive: 'border-pink-500 bg-pink-500/5',
    borderHover: 'border-ns hover:border-pink-400',
    instruction: 'Mở app MoMo → Quét mã QR → Xác nhận thanh toán',
    appNote: 'Yêu cầu app MoMo phiên bản 4.0 trở lên',
  },
  vnpay: {
    name: 'VNPay QR',
    emoji: '🔵',
    qrColor: '#0038a8',
    badgeBg: 'bg-blue-600/15',
    badgeText: 'text-blue-400',
    borderActive: 'border-blue-500 bg-blue-500/5',
    borderHover: 'border-ns hover:border-blue-400',
    instruction: 'Mở app VNPay hoặc app ngân hàng → Quét QR → Xác nhận',
    appNote: 'Hỗ trợ tất cả ứng dụng ngân hàng có VNPay QR',
  },
  zalopay: {
    name: 'ZaloPay',
    emoji: '🟦',
    qrColor: '#006dff',
    badgeBg: 'bg-sky-600/15',
    badgeText: 'text-sky-400',
    borderActive: 'border-sky-500 bg-sky-500/5',
    borderHover: 'border-ns hover:border-sky-400',
    instruction: 'Mở app ZaloPay → Quét mã → Nhập mã PIN → Xác nhận',
    appNote: 'Yêu cầu đăng nhập ZaloPay trước khi quét',
  },
  bank: {
    name: 'Chuyển khoản',
    emoji: '🏦',
    qrColor: '#166534',
    badgeBg: 'bg-green-600/15',
    badgeText: 'text-green-400',
    borderActive: 'border-green-500 bg-green-500/5',
    borderHover: 'border-ns hover:border-green-400',
    instruction: 'Mở app ngân hàng → Chuyển khoản → Quét VietQR',
    appNote: 'Hỗ trợ tất cả ngân hàng tích hợp VietQR',
  },
}

// ─── Fake QR SVG ─────────────────────────────────────────────────────────────

function makeQRGrid(seed: number): number[][] {
  const N = 21
  const grid: number[][] = Array.from({ length: N }, () => Array(N).fill(0))

  function drawFinder(r: number, c: number) {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const border = i === 0 || i === 6 || j === 0 || j === 6
        const inner = i >= 2 && i <= 4 && j >= 2 && j <= 4
        grid[r + i][c + j] = border || inner ? 1 : 0
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(0, 14)
  drawFinder(14, 0)

  // Timing patterns
  for (let i = 8; i <= 12; i++) {
    grid[6][i] = i % 2 === 0 ? 1 : 0
    grid[i][6] = i % 2 === 0 ? 1 : 0
  }

  // Separators
  for (let i = 0; i <= 7; i++) {
    grid[7][i] = 0; grid[i][7] = 0
    grid[7][N - 1 - i] = 0; grid[i][N - 8] = 0
    grid[N - 8][i] = 0; grid[N - 1 - i][7] = 0
  }

  // Alignment pattern (version 2 QR)
  const ap = [[16, 16]]
  for (const [ar, ac] of ap) {
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const border = Math.abs(i) === 2 || Math.abs(j) === 2
        const center = i === 0 && j === 0
        grid[ar + i][ac + j] = border || center ? 1 : 0
      }
    }
  }

  // Pseudo-random data modules
  let s = seed
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 16) & 1 }

  const isReserved = (r: number, c: number) => {
    if (r < 9 && c < 9) return true   // TL finder + separator
    if (r < 9 && c > N - 9) return true // TR finder + separator
    if (r > N - 9 && c < 9) return true // BL finder + separator
    if (r === 6 || c === 6) return true  // timing
    if (r >= 14 && r <= 18 && c >= 14 && c <= 18) return true // alignment
    return false
  }

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!isReserved(r, c)) grid[r][c] = rand()
    }
  }

  return grid
}

const QR_GRIDS: Record<PaymentMethod, number[][]> = {
  momo:    makeQRGrid(0xA50064),
  vnpay:   makeQRGrid(0x0038A8),
  zalopay: makeQRGrid(0x006DFF),
  bank:    makeQRGrid(0x166534),
}

function QRCode({ method, size = 200 }: { method: PaymentMethod; size?: number }) {
  const grid = QR_GRIDS[method]
  const N = grid.length
  const cell = size / N
  const color = METHODS[method].qrColor

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <rect width={size} height={size} fill="white" />
      {grid.flatMap((row, r) =>
        row.map((val, c) =>
          val === 1 ? (
            <rect
              key={`${r}-${c}`}
              x={c * cell + 0.5}
              y={r * cell + 0.5}
              width={cell - 0.5}
              height={cell - 0.5}
              fill={color}
              rx={cell * 0.15}
            />
          ) : null,
        ),
      )}
    </svg>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatVnd(n: number) {
  return n.toLocaleString('vi-VN') + 'đ'
}

function genOrderId() {
  return 'NS' + Date.now().toString(36).toUpperCase().slice(-6)
}

// ─── Component ───────────────────────────────────────────────────────────────

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
  const [orderId] = useState(genOrderId)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const info = PLAN_INFO[planKey]
  const price = info.price[billing]
  const PlanIcon = info.icon
  const m = METHODS[method]

  useEffect(() => {
    if (currentPlan.type === planKey) navigate('/pricing', { replace: true })
  }, [currentPlan.type, planKey, navigate])

  // Auto-navigate after 5s on success screen
  useEffect(() => {
    if (pageState !== 'success') return
    setCountdown(5)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          const msg = planKey === 'vip'
            ? ['Nâng cấp VIP thành công', '5 buổi phỏng vấn AI đã được kích hoạt']
            : ['Nâng cấp Premium thành công', 'Đã mở khóa gợi ý công ty và khoá học']
          toast.success(msg[0], msg[1])
          navigate('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(countdownRef.current!)
  }, [pageState])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirm = () => setPageState('qr')

  const handlePaid = async () => {
    setPageState('processing')
    await new Promise(r => setTimeout(r, 2000))
    upgradePlan(planKey, billing)
    setPageState('success')
  }

  // ── Processing ────────────────────────────────────────────────────────────
  if (pageState === 'processing') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-ns-card border border-ns rounded-2xl p-10 max-w-sm w-full text-center shadow-card">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
            <RefreshCw size={36} className="keep-accent text-blue-400 animate-spin" />
          </div>
          <h2 className="font-heading font-bold text-ns-primary text-xl mb-2">Đang xác nhận thanh toán</h2>
          <p className="text-ns-muted text-sm">Vui lòng đợi trong giây lát...</p>
        </div>
      </div>
    )
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-ns-card border border-ns rounded-2xl p-10 max-w-md w-full text-center shadow-card">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={42} className="keep-accent text-green-400" />
          </div>
          <h2 className="font-heading font-bold text-ns-primary text-2xl mb-2">Thanh toán thành công!</h2>
          <p className="text-ns-muted text-sm mb-1">
            Gói <span className="font-semibold text-ns-primary">{info.name}</span> đã được kích hoạt
          </p>
          <p className="text-ns-faint text-xs mb-8">
            Mã đơn hàng: <span className="font-mono">{orderId}</span> · Hiệu lực {info.validity[billing]}
          </p>
          <div className="bg-ns-raised border border-ns rounded-xl p-4 mb-8 text-left">
            <p className="text-ns-faint text-xs font-semibold uppercase tracking-wide mb-3">Tính năng đã mở khoá</p>
            <ul className="space-y-2">
              {info.features.slice(0, 4).map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-ns-secondary">
                  <Check size={14} className="keep-accent text-green-400 flex-shrink-0" /> {f}
                </li>
              ))}
              {info.features.length > 4 && (
                <li className="text-ns-faint text-xs pl-5">+{info.features.length - 4} tính năng khác</li>
              )}
            </ul>
          </div>
          {/* Countdown ring */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-ns-raised" />
              <circle
                cx="18" cy="18" r="15"
                fill="none" stroke="currentColor" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 15}`}
                strokeDashoffset={`${2 * Math.PI * 15 * (countdown / 5)}`}
                strokeLinecap="round"
                className="keep-accent text-blue-400 transition-all duration-1000"
              />
            </svg>
            <p className="text-ns-muted text-sm">
              Tự động chuyển về Dashboard sau <span className="font-bold text-ns-primary">{countdown}s</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearInterval(countdownRef.current!)
              const msg = planKey === 'vip'
                ? ['Nâng cấp VIP thành công', '5 buổi phỏng vấn AI đã được kích hoạt']
                : ['Nâng cấp Premium thành công', 'Đã mở khóa gợi ý công ty và khoá học']
              toast.success(msg[0], msg[1])
              navigate('/dashboard')
            }}
            className="btn-primary w-full py-3.5 text-sm font-semibold"
          >
            Đến Dashboard ngay →
          </button>
        </div>
      </div>
    )
  }

  // ── QR screen ──────────────────────────────────────────────────────────────
  if (pageState === 'qr') {
    const bankDetails = [
      { label: 'Ngân hàng', value: 'Vietcombank (VCB)' },
      { label: 'Số tài khoản', value: '1234 5678 9012 3456' },
      { label: 'Chủ tài khoản', value: 'NEXTSTEP AI PLATFORM' },
      { label: 'Số tiền', value: formatVnd(price) },
      { label: 'Nội dung', value: `NEXTSTEP ${orderId} ${planKey.toUpperCase()}` },
    ]

    return (
      <div className="p-6 max-w-lg mx-auto animate-page-in">
        <button
          type="button"
          onClick={() => setPageState('form')}
          className="flex items-center gap-2 text-ns-muted hover:text-ns-primary text-sm mb-6 cursor-pointer transition"
        >
          <ArrowLeft size={16} /> Thay đổi phương thức
        </button>

        <div className="bg-ns-card border border-ns rounded-2xl overflow-hidden shadow-card">
          {/* Header */}
          <div className={`px-6 py-4 border-b border-ns flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{m.emoji}</span>
              <div>
                <p className="font-heading font-bold text-ns-primary text-base">Thanh toán qua {m.name}</p>
                <p className="text-ns-muted text-xs">{m.instruction}</p>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${m.badgeBg} ${m.badgeText}`}>
              {formatVnd(price)}
            </span>
          </div>

          {/* QR + details */}
          <div className="p-6">
            {/* QR code */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                <QRCode method={method} size={200} />
              </div>
            </div>

            <p className="text-center text-ns-faint text-xs mb-6">{m.appNote}</p>

            {/* Bank-specific account details */}
            {method === 'bank' && (
              <div className="space-y-2 mb-6">
                {bankDetails.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-ns last:border-0">
                    <span className="text-ns-muted text-sm">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-ns-primary text-sm font-mono">{value}</span>
                      {(label === 'Số tài khoản' || label === 'Nội dung') && (
                        <button
                          type="button"
                          onClick={() => handleCopy(value)}
                          className="text-ns-faint hover:text-ns-primary transition cursor-pointer"
                        >
                          {copied ? <Check size={13} className="keep-accent text-green-400" /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Order ref */}
            {method !== 'bank' && (
              <div className="bg-ns-raised border border-ns rounded-xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-ns-faint text-xs mb-0.5">Mã đơn hàng</p>
                  <p className="text-ns-primary text-sm font-mono font-semibold">{orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-ns-faint text-xs mb-0.5">Số tiền</p>
                  <p className="font-heading font-bold text-ns-primary">{formatVnd(price)}</p>
                </div>
              </div>
            )}

            {/* CTA */}
            <button
              type="button"
              onClick={handlePaid}
              className="btn-primary w-full py-3.5 text-sm font-semibold mb-3"
            >
              <CheckCircle2 size={16} className="inline mr-2 -mt-0.5" />
              Tôi đã thanh toán thành công
            </button>
            <p className="text-ns-faint text-xs text-center">
              Nhấn nút sau khi hoàn tất thanh toán để kích hoạt gói ngay lập tức
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Form (method selection) ────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto animate-page-in">
      <button
        type="button"
        onClick={() => navigate('/pricing')}
        className="flex items-center gap-2 text-ns-muted hover:text-ns-primary text-sm mb-6 cursor-pointer transition"
      >
        <ArrowLeft size={16} /> Quay lại bảng giá
      </button>

      <h1 className="font-heading font-bold text-ns-primary text-2xl mb-1">Xác nhận thanh toán</h1>
      <p className="text-ns-muted text-sm mb-8">Chọn phương thức thanh toán và xác nhận đơn hàng</p>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* Left */}
        <div className="space-y-5">
          <div className="bg-ns-card border border-ns rounded-2xl p-6 shadow-card">
            <h2 className="font-heading font-semibold text-ns-primary text-base mb-4">Phương thức thanh toán</h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(METHODS) as [PaymentMethod, typeof METHODS[PaymentMethod]][]).map(([id, meta]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition text-left cursor-pointer ${
                    method === id ? meta.borderActive : `bg-ns-raised/50 ${meta.borderHover}`
                  }`}
                >
                  <span className="text-2xl leading-none">{meta.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-ns-primary text-sm font-semibold">{meta.name}</p>
                    {method === id && <p className={`text-xs mt-0.5 ${meta.badgeText}`}>Đã chọn</p>}
                  </div>
                  {method === id && (
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-ns-card border border-ns rounded-2xl p-6 shadow-card">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{m.emoji}</span>
              <div>
                <p className="font-heading font-semibold text-ns-primary text-sm">{m.name}</p>
                <p className="text-ns-muted text-xs mt-0.5">{m.instruction}</p>
              </div>
            </div>
            <div className="bg-ns-raised rounded-xl px-4 py-3 border border-ns">
              <p className="text-ns-faint text-xs">{m.appNote}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-ns-faint text-xs">
            <span className="flex items-center gap-1.5"><Shield size={12} /> Bảo mật SSL 256-bit</span>
            <span className="flex items-center gap-1.5"><Clock size={12} /> Kích hoạt ngay lập tức</span>
            <span className="flex items-center gap-1.5"><Check size={12} /> Hủy bất cứ lúc nào</span>
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
                    <span className="keep-accent text-green-400 ml-2 text-xs font-semibold">
                      · {info.savings[billing]}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <ul className="space-y-2 mb-5 pb-5 border-b border-ns">
              {info.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-ns-secondary">
                  <Check size={14} className={`keep-accent ${info.iconColor} flex-shrink-0 mt-0.5`} /> {f}
                </li>
              ))}
            </ul>

            <div className="space-y-2 mb-5 pb-5 border-b border-ns text-sm">
              {[
                { label: 'Gói', value: info.name },
                { label: 'Thời hạn', value: info.validity[billing] },
                { label: 'Phương thức', value: m.name },
                ...(billing === 'quarterly'
                  ? [{ label: 'Ưu đãi', value: 'Tiết kiệm 30%', accent: true }]
                  : []),
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-ns-muted">{row.label}</span>
                  <span className={row.accent ? 'keep-accent text-green-400 font-semibold' : 'text-ns-secondary'}>
                    {row.value}
                  </span>
                </div>
              ))}
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
              Tiếp tục thanh toán · {formatVnd(price)}
            </button>
            <p className="text-ns-faint text-xs text-center mt-3">
              Bằng cách thanh toán, bạn đồng ý với{' '}
              <span className="underline cursor-pointer">Điều khoản dịch vụ</span>
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
                  <Check size={12} className="keep-accent text-green-400 flex-shrink-0 mt-0.5" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
