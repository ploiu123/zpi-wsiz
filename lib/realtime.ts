'use client'

import { useEffect, useId, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/toast'
import { useRouter } from 'next/navigation'

/**
 * Nasłuch zmian w tabeli przez Supabase Realtime.
 *
 * Dwie rzeczy są tu krytyczne i obie były wcześniej źle zrobione:
 *
 * 1. Callbacki trafiają do ref-a, a efekt zależy wyłącznie od nazwy tabeli.
 *    Wcześniej figurowały w tablicy zależności, a wywołania przekazują funkcje
 *    tworzone w locie — nowa tożsamość przy każdym renderze kazała efektowi
 *    subskrybować kanał od nowa w kółko.
 *
 * 2. Nazwa kanału jest unikalna dla każdego zamontowania komponentu.
 *    supabase.channel(nazwa) zwraca ISTNIEJĄCY kanał o tej nazwie, a ponieważ
 *    removeChannel działa asynchronicznie, ponowne uruchomienie efektu trafiało
 *    na kanał już zasubskrybowany. Dopięcie do niego nasłuchu kończyło się
 *    błędem "cannot add postgres_changes callbacks after subscribe()", który
 *    wywracał cały panel administratora.
 */
export function useRealtimeTable(
  table: string,
  onInsert?: (payload: any) => void,
  onUpdate?: (payload: any) => void,
  onDelete?: (payload: any) => void
) {
  const router = useRouter()
  const instanceId = useId()

  const handlers = useRef({ onInsert, onUpdate, onDelete })
  handlers.current = { onInsert, onUpdate, onDelete }

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
    addToast('info', `🔔 Nowe zamówienie! Wartość: ${payload.new.total_amount} zł`)
  })
}

export function useAdminRealtimeProducts() {
  useRealtimeTable('products')
}

export function useClientRealtimeOrderStatus(userId: string) {
  const { addToast } = useToast()
  const instanceId = useId()
  const notify = useRef(addToast)
  notify.current = addToast

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
