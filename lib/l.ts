const REDIRECT_BASE = 'http://localhost'

export function r(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return '/'
  try {
    const url = new URL(raw, REDIRECT_BASE)
    if (url.origin !== REDIRECT_BASE) return '/'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/'
  }
}

export { normalizeOrderStatus as n, orderStatusLabel as e, ORDER_STATUS_OPTIONS as O } from './order-status'
export type { OrderStatusValue as V } from './order-status'
