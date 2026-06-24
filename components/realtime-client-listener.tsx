'use client'

import { useRealtimeTable } from '@/lib/realtime'

export function RealtimeClientListener() {
  // Nasłuchiwanie zmian w produktach i rezerwacjach w czasie rzeczywistym
  // Gdy inny użytkownik doda produkt do koszyka lub jego rezerwacja wygaśnie,
  // strona automatycznie odświeży dane (wywoła router.refresh()).
  useRealtimeTable('products')
  useRealtimeTable('cart_reservations')

  return null
}
