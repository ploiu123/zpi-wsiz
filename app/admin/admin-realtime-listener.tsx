'use client'

import { useAdminRealtimeOrders, useAdminRealtimeProducts } from '@/lib/realtime'

export function AdminRealtimeListener() {
  useAdminRealtimeOrders()
  useAdminRealtimeProducts()
  
  return null
}
