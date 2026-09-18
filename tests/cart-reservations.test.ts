import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchCartReservations } from '@/lib/cart-reservations'

const ROW = { product_id: 'p1', quantity: 2, expires_at: '2026-09-18T12:30:00Z' }

function fakeClient(rpcResult: { data: unknown; error: { code: string; message: string } | null }) {
  const calls: string[] = []
  const client = {
    rpc: async (name: string) => {
      calls.push('rpc:' + name)
      return rpcResult
    },
    from: (table: string) => {
      calls.push('from:' + table)
      return {
        select: () => ({
          eq: () => ({
            order: async () => ({ data: [ROW], error: null }),
          }),
        }),
      }
    },
  }
  return { client: client as unknown as SupabaseClient, calls }
}

describe('pobieranie rezerwacji koszyka', () => {
  it('korzysta z funkcji get_cart_reservations', async () => {
    const { client, calls } = fakeClient({ data: [ROW], error: null })
    const { data, error } = await fetchCartReservations(client, 'cart-123')
    expect(error).toBeNull()
    expect(data).toEqual([ROW])
    expect(calls).toEqual(['rpc:get_cart_reservations'])
  })

  it('przy starej bazie bez funkcji czyta tabelę', async () => {
    const { client, calls } = fakeClient({ data: null, error: { code: 'PGRST202', message: 'not found' } })
    const { data, error } = await fetchCartReservations(client, 'cart-123')
    expect(error).toBeNull()
    expect(data).toEqual([ROW])
    expect(calls).toEqual(['rpc:get_cart_reservations', 'from:cart_reservations'])
  })

  it('inny błąd funkcji zwraca bez czytania tabeli', async () => {
    const { client, calls } = fakeClient({ data: null, error: { code: '42501', message: 'permission denied' } })
    const { data, error } = await fetchCartReservations(client, 'cart-123')
    expect(data).toBeNull()
    expect(error?.code).toBe('42501')
    expect(calls).toEqual(['rpc:get_cart_reservations'])
  })
})
