export function r(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

export { normalizeOrderStatus as n, orderStatusLabel as e, ORDER_STATUS_OPTIONS as O } from './order-status'
export type { OrderStatusValue as V } from './order-status'
