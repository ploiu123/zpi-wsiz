'use client'

import { useRealtimeTable } from '@/lib/realtime'

export function RealtimeClientListener() {
  useRealtimeTable('products')
  useRealtimeTable('cart_reservations')

  return null
}
