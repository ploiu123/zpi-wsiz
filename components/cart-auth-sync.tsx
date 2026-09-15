'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store'

/** Co ile sprawdzamy, czy rezerwacja koszyka nie wygasła. */
const PRUNE_INTERVAL_MS = 30_000

/**
 * Pilnuje, żeby koszyk nie przeżył sesji użytkownika.
 *
 * Podpięcie do onAuthStateChange łapie wszystkie drogi zakończenia sesji, nie tylko
 * kliknięcie „Wyloguj": wygaśnięcie tokenu, wylogowanie w innej karcie (Supabase
 * synchronizuje sesję między kartami) oraz odświeżenie tokenu.
 *
 * Komponent nic nie renderuje.
 */
export function CartAuthSync() {
  useEffect(() => {
    const supabase = createClient()

    // Stan wyjściowy — zanim przyjdzie pierwsze zdarzenie.
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

    // Rezerwacja mogła wygasnąć, gdy karta była zamknięta.
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
