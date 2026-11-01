import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { USE_API } from '../lib/config'
import { createBillingCheckout, getBillingCatalog, getBillingMe } from '../lib/api/billing'
import type { BillingCatalog, BillingEntitlement, BillingPlan } from '../lib/api/billing'
import { useApp } from '../contexts/AppContext'
import { ApiError } from '../lib/api/client'

const preview: BillingCatalog = {
  catalogVersion: 'local-preview', checkoutEnabled: false,
  plans: [
    { sku: 'premium-30', planType: 'premium', durationDays: 30, priceVnd: 49000, vipSessions: 0, scanLimitPerMonth: 15, status: 'preview' },
    { sku: 'premium-90', planType: 'premium', durationDays: 90, priceVnd: 99000, vipSessions: 0, scanLimitPerMonth: 15, status: 'preview' },
    { sku: 'vip-30', planType: 'vip', durationDays: 30, priceVnd: 149000, vipSessions: 5, scanLimitPerMonth: 15, status: 'preview' },
    { sku: 'vip-90', planType: 'vip', durationDays: 90, priceVnd: 299000, vipSessions: 15, scanLimitPerMonth: 15, status: 'preview' },
  ],
}

function description(plan: BillingPlan): string {
  const scan = `${plan.scanLimitPerMonth} lượt phân tích CV/tháng`
  return plan.planType === 'vip' ? `${scan} · ${plan.vipSessions} lượt phỏng vấn` : scan
}

export default function PricingPage() {
  const navigate = useNavigate()
  const { user } = useApp()
  const [catalog, setCatalog] = useState<BillingCatalog>(preview)
  const [entitlement, setEntitlement] = useState<BillingEntitlement | null>(null)
  const [entitlementReady, setEntitlementReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busySku, setBusySku] = useState<string | null>(null)
  const keys = useRef<Record<string, string>>({})
  const hasPaidTier = entitlementReady && !!entitlement && entitlement.planType !== 'free'
  const showFreeCard = !user || (entitlementReady && entitlement?.planType === 'free')

  useEffect(() => {
    if (!USE_API) return
    let mounted = true
    setCatalog(preview)
    getBillingCatalog()
      .then(data => { if (mounted) setCatalog(data) })
      .catch(() => { if (mounted) setError('Chưa tải được bảng giá từ máy chủ. Thanh toán không khả dụng.') })
    return () => { mounted = false }
  }, [user?.id])

  useEffect(() => {
    setEntitlement(null)
    setEntitlementReady(false)
    if (!USE_API || !user) return
    let mounted = true
    getBillingMe()
      .then(data => { if (mounted) { setEntitlement(data); setEntitlementReady(true) } })
      .catch(() => { if (mounted) { setEntitlementReady(false); setError('Chưa xác minh được gói hiện tại. Thanh toán tạm không khả dụng.') } })
    return () => { mounted = false }
  }, [user?.id])

  const checkout = async (plan: BillingPlan) => {
    if (!USE_API || !catalog.checkoutEnabled || plan.status !== 'active' || !entitlementReady ||
        !entitlement || entitlement.status === 'suspended' ||
        (entitlement.planType !== 'free' && entitlement.planType !== plan.planType)) return
    setBusySku(plan.sku)
    setError(null)
    const key = keys.current[plan.sku] ?? crypto.randomUUID()
    keys.current[plan.sku] = key
    try {
      const order = await createBillingCheckout(plan.sku, catalog.catalogVersion, key)
      navigate(`/payment?orderId=${encodeURIComponent(order.orderId)}`)
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'OPEN_ORDER_EXISTS' &&
          typeof caught.details === 'object' && caught.details !== null &&
          'orderId' in caught.details && typeof caught.details.orderId === 'string') {
        navigate(`/payment?orderId=${encodeURIComponent(caught.details.orderId)}`)
        return
      }
      setError('Không thể tạo giao dịch. Vui lòng thử lại hoặc liên hệ hỗ trợ.')
      setBusySku(null)
    }
  }

  return (
    <main className="relative max-w-5xl mx-auto px-6 pb-6 pt-16 space-y-8 animate-page-in">
      <Link to={user ? '/dashboard' : '/'} aria-label="Đóng trang gói dịch vụ" className="absolute right-6 top-6 rounded-lg border border-ns p-2 text-ns-secondary hover:text-ns-primary hover:bg-ns-raised focus-visible:outline-2 focus-visible:outline-blue-500">
        <X size={20} aria-hidden="true" />
      </Link>
      <div className="text-center space-y-3">
        <h1 className="font-heading text-3xl font-bold text-ns-primary">Các gói NextStep</h1>
        {!catalog.checkoutEnabled && <p className="text-ns-secondary">Thanh toán hiện chưa khả dụng. Các gói dưới đây chỉ để tham khảo.</p>}
        {user && !entitlementReady && !error && <p className="text-ns-secondary">Đang xác minh gói hiện tại…</p>}
        {user && entitlementReady && entitlement?.planType === 'free' && <p className="text-ns-secondary">Gói hiện tại: Free</p>}
        {error && <p role="alert" className="text-red-400">{error}</p>}
      </div>
      {hasPaidTier && entitlement && (
        <section className="rounded-2xl border-2 border-blue-500 bg-ns-card p-6 shadow-card" aria-label="Trạng thái gói trả phí">
          <p className="text-blue-400 text-sm font-semibold">{entitlement.status === 'active' ? 'Gói đang sử dụng' : 'Gói đã đăng ký'}</p>
          <h2 className="font-heading text-2xl font-bold text-ns-primary mt-1">{entitlement.planType === 'vip' ? 'VIP' : 'Premium'}</h2>
          <p className="text-ns-secondary mt-2">
            {entitlement.status === 'suspended' ? 'Quyền sử dụng tạm khóa · Cần hỗ trợ' : entitlement.status === 'expired' ? 'Gói đã hết hạn' : `${entitlement.scanLimitPerMonth} lượt phân tích CV/tháng`}
            {entitlement.expiresAt ? ` · Hết hạn ${new Date(entitlement.expiresAt).toLocaleDateString('vi-VN')}` : ''}
          </p>
          {entitlement.status === 'active' && <p className="text-ns-muted text-sm mt-2">Bạn có thể mua tiếp cùng hạng; thời hạn sẽ được nối thêm sau khi thanh toán.</p>}
          <Link to="/dashboard" className="inline-block mt-4 rounded-xl border border-blue-500/40 px-4 py-2 text-blue-400 hover:bg-blue-500/10">Về tổng quan</Link>
        </section>
      )}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {showFreeCard && <section className="rounded-2xl border border-ns bg-ns-card p-6 space-y-4">
          <h2 className="text-xl font-bold text-ns-primary">Free</h2>
          <p className="text-2xl font-bold text-ns-primary">Miễn phí</p>
          <p className="text-ns-secondary">3 lượt phân tích CV mỗi tháng.</p>
          <Link to="/dashboard" className="inline-block rounded-xl border border-ns px-4 py-2 text-ns-primary">Tiếp tục dùng miễn phí</Link>
        </section>}
        {catalog.plans.map(plan => {
          const eligibleTier = entitlement?.planType === 'free' || entitlement?.planType === plan.planType
          const canBuy = USE_API && !!user && entitlementReady && !!entitlement && entitlement.status !== 'suspended' && eligibleTier && catalog.checkoutEnabled && plan.status === 'active'
          const currentTier = hasPaidTier && entitlement?.planType === plan.planType
          return <section key={plan.sku} className={`rounded-2xl border bg-ns-card p-6 space-y-4 ${currentTier ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-ns'}`}>
            <h2 className="text-xl font-bold text-ns-primary">{plan.planType === 'vip' ? 'VIP' : 'Premium'} · {plan.durationDays} ngày</h2>
            <p className="text-2xl font-bold text-ns-primary">{plan.priceVnd.toLocaleString('vi-VN')}đ</p>
            {currentTier && <p className="text-xs font-semibold text-blue-400">Cùng hạng đang sử dụng · Có thể mua nối hạn</p>}
            {!canBuy && <p className="text-xs font-semibold text-ns-muted">{!catalog.checkoutEnabled || plan.status !== 'active' ? 'Chưa nhận thanh toán' : !user ? 'Đăng nhập để thanh toán' : !entitlementReady ? 'Đang xác minh gói hiện tại' : !eligibleTier ? 'Không hỗ trợ đổi hạng giữa kỳ' : 'Liên hệ hỗ trợ để tiếp tục'}</p>}
            <p className="text-ns-secondary">{description(plan)}</p>
            <p className="text-ns-muted text-xs">Mua trước một lần, không tự gia hạn.</p>
            {canBuy && <button type="button" disabled={busySku !== null} onClick={() => void checkout(plan)} className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
              {busySku === plan.sku ? 'Đang tạo đơn…' : currentTier ? `Mua thêm ${plan.durationDays} ngày` : 'Tạo mã chuyển khoản'}
            </button>}
          </section>
        })}
      </div>
    </main>
  )
}
