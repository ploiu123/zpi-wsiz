'use client'

import { useRealtimeTable } from '@/lib/realtime'

export function RealtimeClientListener() {
  useRealtimeTable('products')

  return null
}
