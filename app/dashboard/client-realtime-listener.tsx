'use client'

import { useClientRealtimeOrderStatus } from '@/lib/realtime'

export function ClientRealtimeListener({ userId }: { userId: string | null }) {
  useClientRealtimeOrderStatus(userId || '')
  return null
}
