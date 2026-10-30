import { apiRequest } from './client'

export interface BillingPlan {
  sku: string
  status: 'preview' | 'active'
  planType: 'premium' | 'vip'
  durationDays: number
  priceVnd: number
  vipSessions: number
  scanLimitPerMonth: number
}

export interface BillingCatalog {
  catalogVersion: string
  checkoutEnabled: boolean
  plans: BillingPlan[]
}

export interface BillingOrder {
  orderId: string
  sku: string
  status: 'processing' | 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired' | 'needs-support'
  amountVnd: number
  paymentCode: string | null
  beneficiary: { bankCode: string; accountNumber: string; accountName: string } | null
  qrImageUrl: string | null
  checkoutExpiresAt: string | null
}

export interface BillingEntitlement {
  planType: 'free' | 'premium' | 'vip'
  status: 'active' | 'expired' | 'suspended'
  startedAt: string | null
  expiresAt: string | null
  vipSessionsLeft: number
  scanLimitPerMonth: number
  sourceOrderId: string | null
}

export const getBillingCatalog = () => apiRequest<BillingCatalog>('/billing/plans')
export const getBillingMe = () => apiRequest<BillingEntitlement>('/billing/me')
export const getBillingOrder = (orderId: string) => apiRequest<BillingOrder>(`/billing/orders/${encodeURIComponent(orderId)}`)

export const createBillingCheckout = (sku: string, catalogVersion: string, idempotencyKey: string) =>
  apiRequest<BillingOrder>('/billing/checkout', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ sku, catalogVersion }),
  })
