import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { getBillingMe, getBillingOrder } from '../lib/api/billing'
import type { BillingOrder } from '../lib/api/billing'
import { fetchMe } from '../lib/api/auth'
import { USE_API } from '../lib/config'
import { useApp } from '../contexts/AppContext'

const messages: Record<BillingOrder['status'], string> = {
  pending: 'Đang chờ SePay ghi nhận chuyển khoản. Vui lòng kiểm tra lại sau.',
  processing: 'Đang xác minh chuyển khoản. Vui lòng kiểm tra lại sau.',
  paid: 'Thanh toán đã ghi nhận; đang xác minh quyền sử dụng.',
  failed: 'Giao dịch không thành công. Bạn chưa bị cấp quyền trả phí.',
  cancelled: 'Giao dịch đã hủy. Bạn chưa bị cấp quyền trả phí.',
  expired: 'Đơn đã hết thời gian thanh toán. Bạn có thể tạo đơn mới khi checkout mở.',
  'needs-support': 'Giao dịch cần đối soát thủ công. Vui lòng liên hệ hỗ trợ và cung cấp mã đơn.',
}

export default function PaymentPage() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId')
  const location = useLocation()
  const { refreshSession, isAuthenticated, isAuthReady } = useApp()
  const [order, setOrder] = useState<BillingOrder | null>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!USE_API || !orderId || !isAuthenticated) return
    try {
      const next = await getBillingOrder(orderId)
      setOrder(next)
      if (next.status === 'paid') {
        const [entitlement, session] = await Promise.all([getBillingMe(), fetchMe()])
        // A later renewal can replace sourceOrderId while this paid order remains valid.
        setActive(entitlement.status === 'active' && entitlement.planType === (next.sku.startsWith('vip') ? 'vip' : 'premium') && session.plan.type === entitlement.planType)
        await refreshSession()
      } else {
        setActive(false)
      }
      setError(null)
    } catch {
      setError('Không thể kiểm tra trạng thái đơn. Vui lòng đăng nhập lại hoặc liên hệ hỗ trợ.')
    }
  }, [orderId, refreshSession, isAuthenticated])

  useEffect(() => {
    if (!USE_API || !orderId || !isAuthenticated) return
    void refresh()
    const onFocus = () => { void refresh() }
    window.addEventListener('focus', onFocus)
    const timer = window.setInterval(() => { void refresh() }, 10000)
    return () => { window.removeEventListener('focus', onFocus); window.clearInterval(timer) }
  }, [orderId, refresh, isAuthenticated])

  return <main className="max-w-xl mx-auto p-8 text-center space-y-5">
    <h1 className="font-heading text-3xl font-bold text-ns-primary">Trạng thái thanh toán</h1>
    {!USE_API || !orderId ? (
      <p className="text-ns-secondary">Thanh toán chưa mở. Trang này không tạo QR, nhận tiền hoặc tự cấp quyền.</p>
    ) : !isAuthReady ? (
      <p className="text-ns-secondary">Đang kiểm tra phiên đăng nhập…</p>
    ) : !isAuthenticated ? (
      <p className="text-ns-secondary">Bạn cần <Link to="/auth" state={{ from: location }} className="underline">đăng nhập</Link> để xem đơn của mình.</p>
    ) : error ? (
      <p role="alert" className="text-red-400">{error}</p>
    ) : !order ? (
      <p className="text-ns-secondary">Đang kiểm tra đơn từ máy chủ…</p>
    ) : (
      <div className="space-y-3">
        <p className="text-ns-secondary">Mã đơn: {order.orderId}</p>
        <p role="status" className="text-ns-primary">{order.status === 'paid' && active ? 'Thanh toán thành công; quyền sử dụng đã được kích hoạt.' : messages[order.status]}</p>
        {order.status === 'pending' && order.paymentCode && order.beneficiary && <div className="rounded-2xl border border-ns bg-ns-card p-5 text-left space-y-3">
          <p>Chuyển đúng <strong>{order.amountVnd.toLocaleString('vi-VN')}đ</strong> tới tài khoản dưới đây trong 15 phút. Giữ nguyên số tiền và nội dung chuyển khoản.</p>
          {order.qrImageUrl && <img src={order.qrImageUrl} alt={`QR chuyển khoản ${order.paymentCode}`} className="mx-auto max-w-64 rounded-lg" />}
          <p>Ngân hàng: <strong>{order.beneficiary.bankCode}</strong></p>
          <p>Chủ tài khoản: <strong>{order.beneficiary.accountName}</strong></p>
          <p>Số tài khoản: <strong>{order.beneficiary.accountNumber}</strong> <button type="button" onClick={() => void navigator.clipboard.writeText(order.beneficiary!.accountNumber)} className="underline">Sao chép</button></p>
          <p>Nội dung chuyển khoản: <strong>{order.paymentCode}</strong> <button type="button" onClick={() => void navigator.clipboard.writeText(order.paymentCode!)} className="underline">Sao chép</button></p>
          {order.checkoutExpiresAt && <p>Hạn chuyển khoản: {new Date(order.checkoutExpiresAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>}
          <p className="text-sm text-ns-secondary">Trạng thái được cập nhật từ máy chủ. Nếu đã chuyển mà đơn chưa ghi nhận hoặc hết hạn, hãy liên hệ hỗ trợ với mã đơn; đừng chuyển thêm lần nữa.</p>
        </div>}
        {(order.status === 'pending' || order.status === 'processing') && <button type="button" onClick={() => void refresh()} className="rounded-xl border border-ns px-4 py-2 text-ns-primary">Kiểm tra lại</button>}
      </div>
    )}
    <div><Link to="/pricing" className="inline-block rounded-xl border border-ns px-5 py-3 text-ns-primary">Quay lại các gói</Link></div>
  </main>
}
