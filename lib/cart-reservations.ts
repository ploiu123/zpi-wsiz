import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'

export interface CartReservation {
  product_id: string
  quantity: number
  expires_at: string
}

const FUNCTION_NOT_FOUND = 'PGRST202'

export async function fetchCartReservations(
  supabase: SupabaseClient,
  cartId: string
): Promise<{ data: CartReservation[] | null; error: PostgrestError | null }> {
  const rpc = await supabase.rpc('get_cart_reservations', { p_cart_id: cartId })
  if (!rpc.error) return { data: (rpc.data ?? []) as CartReservation[], error: null }
  if (rpc.error.code !== FUNCTION_NOT_FOUND) return { data: null, error: rpc.error }

  const table = await supabase
    .from('cart_reservations')
    .select('product_id, quantity, expires_at')
    .eq('cart_id', cartId)
    .order('expires_at', { ascending: true })
  return { data: (table.data ?? null) as CartReservation[] | null, error: table.error }
}
