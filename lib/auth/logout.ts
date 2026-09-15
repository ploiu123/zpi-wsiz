import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store'

/**
 * Wylogowanie ze zwolnieniem rezerwacji koszyka.
 *
 * KOLEJNOŚĆ JEST KRYTYCZNA — rezerwacje zwalniamy, DOPÓKI sesja jeszcze żyje.
 * Po signOut() klient traci token, a przekierowanie po wylogowaniu ubija żądania
 * w locie, więc towar zostałby zablokowany aż do wygaśnięcia rezerwacji (30 minut).
 *
 * UWAGA: rezerwacja fizycznie zdejmuje sztuki z products.stock. Zwalniamy ją więc
 * przez RPC update_cart_reservation(..., 0), które oddaje towar do magazynu.
 * Samo DELETE z cart_reservations skasowałoby wiersz i bezpowrotnie zgubiłoby
 * te sztuki w stanie magazynowym.
 */
export async function logoutAndClearCart(): Promise<void> {
  const supabase = createClient()

  // 1. Kto wychodzi — póki sesja jest jeszcze ważna.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Zwolnij rezerwacje tego koszyka. Czytamy je z bazy, a nie z lokalnego
  //    stanu, żeby złapać też pozycje dodane na innym urządzeniu.
  const { cartId } = useCartStore.getState()
  if (cartId) {
    try {
      const { data: rows, error } = await supabase
        .from('cart_reservations')
        .select('product_id')
        .eq('cart_id', cartId)

      if (error) {
        console.error('Nie udało się pobrać rezerwacji do zwolnienia:', error.message)
      } else {
        for (const row of rows ?? []) {
          const { error: releaseError } = await supabase.rpc('update_cart_reservation', {
            p_cart_id: cartId,
            p_product_id: row.product_id,
            p_target_qty: 0,
          })
          if (releaseError) {
            console.error(
              `Nie udało się zwolnić rezerwacji produktu ${row.product_id}:`,
              releaseError.message
            )
          }
        }
      }
    } catch (err) {
      console.error('Wyjątek przy zwalnianiu rezerwacji użytkownika', user?.id ?? 'anon', err)
    }
  }

  // 3. Wyczyść koszyk lokalnie (domyka też rezerwacje widoczne w items).
  await useCartStore.getState().clearCart()

  // 4. Dopiero teraz kończymy sesję.
  await supabase.auth.signOut()

  // 5. Odepnij koszyk od konta — następne logowanie zaczyna od pustego.
  useCartStore.getState().bindToUser(null)
}
