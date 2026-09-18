'use client'

import { useEffect, useId, useRef } from 'react'
import type {
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/toast'
import { useRouter } from 'next/navigation'

type Row = Record<string, unknown>

export function useRealtimeTable(
  table: string,
  onInsert?: (payload: RealtimePostgresInsertPayload<Row>) => void,
  onUpdate?: (payload: RealtimePostgresUpdatePayload<Row>) => void,
  onDelete?: (payload: RealtimePostgresDeletePayload<Row>) => void
) {
  const router = useRouter()
  const instanceId = useId()

  const handlers = useRef({ onInsert, onUpdate, onDelete })
  useEffect(() => {
    handlers.current = { onInsert, onUpdate, onDelete }
  })

  useEffect(() => {
    const supabase = createClient()
    const channelName = `realtime_${table}_${instanceId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table },
        (payload) => {
          handlers.current.onInsert?.(payload)
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table },
        (payload) => {
          handlers.current.onUpdate?.(payload)
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table },
        (payload) => {
          handlers.current.onDelete?.(payload)
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [table, instanceId, router])
}

export function useAdminRealtimeOrders() {
  const { addToast } = useToast()
  useRealtimeTable('orders', (payload) => {
    addToast('info', `🔔 Nowe zamówienie! Wartość: ${Number(payload.new.total_amount ?? 0).toFixed(2)} zł`)
  })
}

export function useAdminRealtimeProducts() {
  useRealtimeTable('products')
}

export function useClientRealtimeOrderStatus(userId: string) {
  const { addToast } = useToast()
  const instanceId = useId()
  const notify = useRef(addToast)
  useEffect(() => {
    notify.current = addToast
  })

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`client_orders_${userId}_${instanceId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.old.status !== payload.new.status) {
            notify.current('success', `Status Twojego zamówienia zmienił się na: ${payload.new.status}`)
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, instanceId])
}
