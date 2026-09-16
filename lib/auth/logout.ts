import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store'

export async function logoutAndClearCart(): Promise<void> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  await useCartStore.getState().clearCart()

  await supabase.auth.signOut()

  useCartStore.getState().bindToUser(null)
}
