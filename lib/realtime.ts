'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/toast'
import { useRouter } from 'next/navigation'

export function useRealtimeTable(
  table: string,
  onInsert?: (payload: any) => void,
  onUpdate?: (payload: any) => void,
  onDelete?: (payload: any) => void
) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel(`realtime_${table}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table },
        (payload) => {
          if (onInsert) onInsert(payload)
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table },
        (payload) => {
          if (onUpdate) onUpdate(payload)
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table },
        (payload) => {
          if (onDelete) onDelete(payload)
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, onInsert, onUpdate, onDelete, router])
}

export function useAdminRealtimeOrders() {
  const { addToast } = useToast()
  useRealtimeTable(
    'orders',
    (payload) => {
      addToast('info', `đź”” Nowe zamĂłwienie! WartoĹ›Ä‡: ${payload.new.total_amount} zĹ‚`)
    }
  )
}

export function useAdminRealtimeProducts() {
  const { addToast } = useToast()
  useRealtimeTable(
    'products',
    (payload) => {
    }
  )
}

export function useClientRealtimeOrderStatus(userId: string) {
  const { addToast } = useToast()
  
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`client_orders_${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.old.status !== payload.new.status) {
            addToast('success', `Status Twojego zamĂłwienia zmieniĹ‚ siÄ™ na: ${payload.new.status}`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, addToast])
}
