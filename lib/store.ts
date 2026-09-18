import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export const RESERVATION_MS = 30 * 60 * 1000

interface PersistedCart {
  cartId: string
  ownerId: string | null
  items: CartItem[]
  reservedUntil: number | null
}

interface CartStore extends PersistedCart {
  addItem: (product: Product, quantity?: number) => Promise<boolean>
  removeItem: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>
  clearCart: () => Promise<void>
  bindToUser: (userId: string | null) => void
  pruneIfExpired: () => boolean
  getTotal: () => number
  getItemCount: () => number
  syncCart: () => Promise<string[]>
}

function generateUUID() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cartId: '',
      ownerId: null,
      items: [],
      reservedUntil: null,

      addItem: async (product, quantity = 1) => {
        let currentCartId = get().cartId
        if (!currentCartId) {
          currentCartId = generateUUID()
          set({ cartId: currentCartId })
        }

        const existing = get().items.find((i) => i.product.id === product.id)
        const targetQty = (existing?.quantity || 0) + quantity

        const supabase = createClient()
        try {
          const { error } = await supabase.rpc('update_cart_reservation', {
            p_cart_id: currentCartId,
            p_product_id: product.id,
            p_target_qty: targetQty
          })

          if (error) {
            console.error('Błąd rezerwacji w bazie:', error.message)
            return false
          }

          set((state) => {
            const reservedUntil = Date.now() + RESERVATION_MS
            const hasExisting = state.items.some((i) => i.product.id === product.id)
            if (hasExisting) {
              return {
                reservedUntil,
                items: state.items.map((i) =>
                  i.product.id === product.id
                    ? { ...i, quantity: i.quantity + quantity }
                    : i
                ),
              }
            }
            return { reservedUntil, items: [...state.items, { product, quantity }] }
          })
          return true
        } catch (err) {
          console.error('Wyjątek rezerwacji:', err)
          return false
        }
      },

      removeItem: async (productId) => {
        const currentCartId = get().cartId
        if (currentCartId) {
          const supabase = createClient()
          try {
            await supabase.rpc('update_cart_reservation', {
              p_cart_id: currentCartId,
              p_product_id: productId,
              p_target_qty: 0
            })
          } catch (err) {
            console.error('Błąd usuwania rezerwacji z bazy:', err)
          }
        }

        set((state) => {
          const items = state.items.filter((i) => i.product.id !== productId)
          return { items, reservedUntil: items.length > 0 ? state.reservedUntil : null }
        })
      },

      updateQuantity: async (productId, quantity) => {
        const currentCartId = get().cartId
        if (!currentCartId) return false

        if (quantity <= 0) {
          await get().removeItem(productId)
          return true
        }

        const supabase = createClient()
        try {
          const { error } = await supabase.rpc('update_cart_reservation', {
            p_cart_id: currentCartId,
            p_product_id: productId,
            p_target_qty: quantity
          })

          if (error) {
            console.error('Błąd zmiany rezerwacji w bazie:', error.message)
            return false
          }

          set((state) => ({
            reservedUntil: Date.now() + RESERVATION_MS,
            items: state.items.map((i) =>
              i.product.id === productId ? { ...i, quantity } : i
            ),
          }))
          return true
        } catch (err) {
          console.error('Wyjątek zmiany rezerwacji:', err)
          return false
        }
      },

      clearCart: async () => {
        const currentCartId = get().cartId
        const items = get().items
        if (currentCartId && items.length > 0) {
          const supabase = createClient()
          for (const item of items) {
            try {
              await supabase.rpc('update_cart_reservation', {
                p_cart_id: currentCartId,
                p_product_id: item.product.id,
                p_target_qty: 0
              })
            } catch (err) {
              console.error('Błąd czyszczenia pojedynczej rezerwacji:', err)
            }
          }
        }
        set({ items: [], reservedUntil: null })
      },

      bindToUser: (userId) => {
        const { ownerId } = get()
        if (ownerId === userId) return
        set({ ownerId: userId, items: [], reservedUntil: null, cartId: '' })
      },

      pruneIfExpired: () => {
        const { reservedUntil, items } = get()
        if (reservedUntil !== null && items.length > 0 && Date.now() > reservedUntil) {
          set({ items: [], reservedUntil: null })
          return true
        }
        return false
      },

      syncCart: async () => {
        let currentCartId = get().cartId
        if (!currentCartId) {
          currentCartId = generateUUID()
          set({ cartId: currentCartId })
        }

        const items = get().items
        if (items.length === 0) return []

        const supabase = createClient()
        const updatedItems: CartItem[] = []
        const warnings: string[] = []
        let renewed = false

        await supabase.rpc('cleanup_expired_reservations')

        const { data: dbRes, error } = await supabase.rpc('get_cart_reservations', {
          p_cart_id: currentCartId,
        })

        if (error) {
          console.error('Błąd pobierania rezerwacji do synchronizacji:', error.message)
          return []
        }

        const { data: freshProducts, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', items.map((item) => item.product.id))

        const freshMap = new Map<string, Product>(
          ((freshProducts ?? []) as Product[]).map((product) => [product.id, product])
        )

        const activeResMap = new Map<string, number>(
          ((dbRes ?? []) as { product_id: string; quantity: number }[]).map((r) => [r.product_id, r.quantity])
        )

        for (const current of items) {
          const fresh = freshMap.get(current.product.id)
          if (!productsError && !fresh) {
            warnings.push(`Produkt "${current.product.name}" nie jest już dostępny i został usunięty z koszyka.`)
            continue
          }

          const item: CartItem = fresh ? { ...current, product: fresh } : current
          if (fresh && Number(fresh.price) !== Number(current.product.price)) {
            warnings.push(`Cena produktu "${fresh.name}" zmieniła się na ${Number(fresh.price).toFixed(2)} zł.`)
          }

          const activeQty = activeResMap.get(item.product.id)

          if (activeQty === undefined || activeQty === null) {
            const { error: reserveError } = await supabase.rpc('update_cart_reservation', {
              p_cart_id: currentCartId,
              p_product_id: item.product.id,
              p_target_qty: item.quantity
            })

            if (reserveError) {
              const { data: prod } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.product.id)
                .maybeSingle()

              const available = prod?.stock || 0
              if (available > 0) {
                const { error: retryError } = await supabase.rpc('update_cart_reservation', {
                  p_cart_id: currentCartId,
                  p_product_id: item.product.id,
                  p_target_qty: available
                })
                if (!retryError) renewed = true
                updatedItems.push({ ...item, quantity: available })
                warnings.push(`Zmniejszono ilość produktu "${item.product.name}" do ${available} sztuk z powodu braku zapasów.`)
              } else {
                warnings.push(`Produkt "${item.product.name}" nie jest już dostępny w magazynie i został usunięty z koszyka.`)
              }
            } else {
              renewed = true
              updatedItems.push(item)
            }
          } else if (activeQty !== item.quantity) {
            updatedItems.push({ ...item, quantity: activeQty })
            warnings.push(`Zaktualizowano ilość produktu "${item.product.name}" w koszyku do ${activeQty} sztuk.`)
          } else {
            updatedItems.push(item)
          }
        }

        set((state) => ({
          items: updatedItems,
          reservedUntil:
            updatedItems.length === 0 ? null : renewed ? Date.now() + RESERVATION_MS : state.reservedUntil,
        }))
        return warnings
      },

      getTotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        )
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'zlote-miody-cart',
      version: 2,
      partialize: (state): PersistedCart => ({
        cartId: state.cartId,
        ownerId: state.ownerId,
        items: state.items,
        reservedUntil: state.reservedUntil,
      }),
      migrate: (persisted: unknown, version: number) => {
        const prev = (persisted ?? {}) as Partial<PersistedCart>
        if (version < 2 || prev.ownerId === undefined) {
          return { cartId: '', ownerId: null, items: [], reservedUntil: null } as PersistedCart
        }
        return prev as PersistedCart
      },
      onRehydrateStorage: () => (state) => {
        state?.pruneIfExpired()
      },
    }
  )
)
