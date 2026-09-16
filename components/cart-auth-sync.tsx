'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store'

const PRUNE_INTERVAL_MS = 30_000

export function CartAuthSync() {
  useEffect(() => {
    const supabase = createClient()

    void supabase.auth.getSession().then(({ data: { session } }) => {
      useCartStore.getState().bindToUser(session?.user?.id ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        void useCartStore.getState().clearCart()
        return
      }
      useCartStore.getState().bindToUser(session?.user?.id ?? null)
    })

    useCartStore.getState().pruneIfExpired()
    const timer = setInterval(() => {
      useCartStore.getState().pruneIfExpired()
    }, PRUNE_INTERVAL_MS)

    return () => {
      subscription.unsubscribe()
      clearInterval(timer)
    }
  }, [])

  return null
}
