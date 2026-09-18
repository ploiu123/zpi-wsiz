import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import type { CartItem, Product } from '@/lib/types'

const storage = globalThis.localStorage

const db = vi.hoisted(() => ({
  reservations: [] as { product_id: string; quantity: number; expires_at: string }[],
  products: [] as unknown[],
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    rpc: async (name: string) =>
      name === 'get_cart_reservations'
        ? { data: db.reservations, error: null }
        : { data: null, error: null },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        in: async () => ({ data: db.products, error: null }),
      }),
      delete: () => ({ eq: async () => ({ data: null, error: null }) }),
    }),
    auth: {
      getUser: async () => ({ data: { user: { id: 'A' } }, error: null }),
      signOut: async () => ({ error: null }),
    },
  }),
}))

const { useCartStore, RESERVATION_MS } = await import('@/lib/store')

const PRODUCT = {
  id: 'p1', name: 'Miód akacjowy', description: '', price: 29.9, old_price: null,
  image_url: '', stock: 10, category: 'miód', featured: false,
  created_at: '', updated_at: '',
} satisfies Product

const ITEM: CartItem = { product: PRODUCT, quantity: 2 }
const STORAGE_KEY = 'zlote-miody-cart'

function seedCart(ownerId: string | null, reservedUntil: number | null = Date.now() + RESERVATION_MS) {
  useCartStore.setState({ cartId: 'cart-123', ownerId, items: [ITEM], reservedUntil })
}

beforeEach(() => {
  db.reservations = []
  db.products = []
  storage.clear()
  useCartStore.setState({ cartId: '', ownerId: null, items: [], reservedUntil: null })
})
afterEach(() => { vi.useRealTimers() })

describe('izolacja koszyka między kontami', () => {
  it('przełączenie konta A -> B czyści koszyk', () => {
    seedCart('user-A')
    expect(useCartStore.getState().items).toHaveLength(1)

    useCartStore.getState().bindToUser('user-B')

    expect(useCartStore.getState().items).toEqual([])
    expect(useCartStore.getState().ownerId).toBe('user-B')
    expect(useCartStore.getState().reservedUntil).toBeNull()
  })

  it('sama zmiana sesji, bez wywołania clearCart, też czyści koszyk', () => {
    seedCart('user-A')
    const clearCartSpy = vi.spyOn(useCartStore.getState(), 'clearCart')

    const session = { user: { id: 'user-B' } }
    useCartStore.getState().bindToUser(session?.user?.id ?? null)

    expect(clearCartSpy).not.toHaveBeenCalled()
    expect(useCartStore.getState().items).toEqual([])
  })

  it('wylogowanie do gościa (userId null) też czyści', () => {
    seedCart('user-A')
    useCartStore.getState().bindToUser(null)
    expect(useCartStore.getState().items).toEqual([])
    expect(useCartStore.getState().ownerId).toBeNull()
  })

  it('ten sam użytkownik zachowuje swój koszyk', () => {
    seedCart('user-A')
    useCartStore.getState().bindToUser('user-A')
    expect(useCartStore.getState().items).toHaveLength(1)
  })
})

describe('rezerwacja 30 minut', () => {
  it('nie gaśnie po 29 minutach', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-15T12:00:00Z'))
    seedCart('user-A', Date.now() + RESERVATION_MS)

    vi.setSystemTime(new Date('2026-09-15T12:29:00Z'))

    expect(useCartStore.getState().pruneIfExpired()).toBe(false)
    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('gaśnie po 30 minutach', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-15T12:00:00Z'))
    seedCart('user-A', Date.now() + RESERVATION_MS)

    vi.setSystemTime(new Date('2026-09-15T12:30:01Z'))

    expect(useCartStore.getState().pruneIfExpired()).toBe(true)
    expect(useCartStore.getState().items).toEqual([])
    expect(useCartStore.getState().reservedUntil).toBeNull()
  })

  it('dodanie produktu ustawia rezerwację na 30 minut', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-15T12:00:00Z'))

    const ok = await useCartStore.getState().addItem(PRODUCT, 1)

    expect(ok).toBe(true)
    expect(useCartStore.getState().reservedUntil).toBe(Date.now() + RESERVATION_MS)
  })

  it('zmiana ilości odświeża rezerwację', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-15T12:00:00Z'))
    await useCartStore.getState().addItem(PRODUCT, 1)

    vi.setSystemTime(new Date('2026-09-15T12:20:00Z'))
    await useCartStore.getState().updateQuantity(PRODUCT.id, 3)

    expect(useCartStore.getState().reservedUntil).toBe(Date.now() + RESERVATION_MS)
  })
})

describe('zawartość localStorage', () => {
  it('nie zapisuje funkcji — tylko dane', async () => {
    await useCartStore.getState().addItem(PRODUCT, 1)

    const raw = storage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()

    const parsed = JSON.parse(raw as string)
    expect(Object.keys(parsed.state).sort()).toEqual(
      ['cartId', 'items', 'ownerId', 'reservedUntil']
    )
    for (const [key, value] of Object.entries(parsed.state)) {
      expect(typeof value, `pole ${key}`).not.toBe('function')
    }
    for (const fn of ['addItem', 'removeItem', 'clearCart', 'bindToUser', 'pruneIfExpired', 'syncCart', 'getTotal', 'getItemCount']) {
      expect(raw).not.toContain(fn)
    }
    expect(parsed.version).toBe(2)
  })

  it('migracja porzuca stary koszyk bez ownerId', () => {
    const legacy = JSON.stringify({ state: { cartId: 'stary', items: [ITEM] }, version: 1 })
    storage.setItem(STORAGE_KEY, legacy)

    useCartStore.persist.rehydrate()

    expect(useCartStore.getState().items).toEqual([])
    expect(useCartStore.getState().ownerId).toBeNull()
  })
})

describe('synchronizacja koszyka z bazą', () => {
  it('aktualizuje cenę produktu i informuje o zmianie', async () => {
    seedCart('user-A')
    db.reservations = [{ product_id: PRODUCT.id, quantity: 2, expires_at: new Date().toISOString() }]
    db.products = [{ ...PRODUCT, price: 35 }]

    const warnings = await useCartStore.getState().syncCart()

    expect(useCartStore.getState().items[0].product.price).toBe(35)
    expect(useCartStore.getState().getTotal()).toBe(70)
    expect(warnings).toEqual(['Cena produktu "Miód akacjowy" zmieniła się na 35.00 zł.'])
  })

  it('usuwa produkt, którego nie ma już w sklepie', async () => {
    seedCart('user-A')
    db.reservations = [{ product_id: PRODUCT.id, quantity: 2, expires_at: new Date().toISOString() }]
    db.products = []

    const warnings = await useCartStore.getState().syncCart()

    expect(useCartStore.getState().items).toEqual([])
    expect(useCartStore.getState().reservedUntil).toBeNull()
    expect(warnings).toHaveLength(1)
  })

  it('przyjmuje ilość z rezerwacji zapisanej w bazie', async () => {
    seedCart('user-A')
    db.reservations = [{ product_id: PRODUCT.id, quantity: 1, expires_at: new Date().toISOString() }]
    db.products = [PRODUCT]

    const warnings = await useCartStore.getState().syncCart()

    expect(useCartStore.getState().items[0].quantity).toBe(1)
    expect(warnings).toEqual(['Zaktualizowano ilość produktu "Miód akacjowy" w koszyku do 1 sztuk.'])
  })
})
