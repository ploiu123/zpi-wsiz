import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface CartStore {
  cartId: string
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => Promise<boolean>
  removeItem: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>
  clearCart: () => Promise<void>
  getTotal: () => number
  getItemCount: () => number
  syncCart: () => Promise<string[]>
}

// Bezpieczny generator UUID na kliencie
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
      items: [],

      addItem: async (product, quantity = 1) => {
        // Inicjalizacja cartId jeśli puste
        let currentCartId = get().cartId
        if (!currentCartId) {
          currentCartId = generateUUID()
          set({ cartId: currentCartId })
        }

        const existing = get().items.find((i) => i.product.id === product.id)
        const targetQty = (existing?.quantity || 0) + quantity

        const supabase = createClient()
        try {
          // Rezerwacja w bazie danych
          const { error } = await supabase.rpc('update_cart_reservation', {
            p_cart_id: currentCartId,
            p_product_id: product.id,
            p_target_qty: targetQty
          })

          if (error) {
            console.error('Błąd rezerwacji w bazie:', error.message)
            return false
          }

          // Aktualizacja stanu lokalnego
          set((state) => {
            const hasExisting = state.items.some((i) => i.product.id === product.id)
            if (hasExisting) {
              return {
                items: state.items.map((i) =>
                  i.product.id === product.id
                    ? { ...i, quantity: i.quantity + quantity }
                    : i
                ),
              }
            }
            return { items: [...state.items, { product, quantity }] }
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

        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }))
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
          // Usuń wszystkie rezerwacje z bazy danych dla tego koszyka
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
        set({ items: [] })
      },

      syncCart: async () => {
        let currentCartId = get().cartId
        if (!currentCartId) {
          currentCartId = generateUUID()
          set({ cartId: currentCartId })
          return []
        }

        const items = get().items
        if (items.length === 0) return []

        const supabase = createClient()
        const updatedItems = []
        const warnings = []

        // Sprzątamy wygasłe rezerwacje w bazie
        await supabase.rpc('cleanup_expired_reservations')

        // Pobieramy nasze aktualne aktywne rezerwacje z bazy danych
        const { data: dbRes, error } = await supabase
          .from('cart_reservations')
          .select('product_id, quantity')
          .eq('cart_id', currentCartId)

        if (error) {
          console.error('Błąd pobierania rezerwacji do synchronizacji:', error.message)
          return []
        }

        // Mapujemy aktywne rezerwacje
        const activeResMap = new Map(dbRes?.map((r) => [r.product_id, r.quantity]) || [])

        for (const item of items) {
          const activeQty = activeResMap.get(item.product.id)

          if (activeQty === undefined || activeQty === null) {
            // Rezerwacja wygasła i nie ma jej w bazie. Spróbujmy ją odtworzyć!
            const { error: reserveError } = await supabase.rpc('update_cart_reservation', {
              p_cart_id: currentCartId,
              p_product_id: item.product.id,
              p_target_qty: item.quantity
            })

            if (reserveError) {
              // Odtworzenie się nie powiodło (brak w magazynie)
              // Sprawdzamy ile jest aktualnie wolnych sztuk
              const { data: prod } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.product.id)
                .maybeSingle()

              const available = prod?.stock || 0
              if (available > 0) {
                // Rezerwujemy to co zostało
                await supabase.rpc('update_cart_reservation', {
                  p_cart_id: currentCartId,
                  p_product_id: item.product.id,
                  p_target_qty: available
                })
                updatedItems.push({ ...item, quantity: available })
                warnings.push(`Zmniejszono ilość produktu "${item.product.name}" do ${available} sztuk z powodu braku zapasów.`)
              } else {
                warnings.push(`Produkt "${item.product.name}" nie jest już dostępny w magazynie i został usunięty z koszyka.`)
              }
            } else {
              // Udało się odtworzyć rezerwację
              updatedItems.push(item)
            }
          } else if (activeQty !== item.quantity) {
            // Różnica w ilości (np. zmiana przez admina lub inną sesję)
            updatedItems.push({ ...item, quantity: activeQty })
            warnings.push(`Zaktualizowano ilość produktu "${item.product.name}" w koszyku do ${activeQty} sztuk.`)
          } else {
            // Wszystko w porządku, rezerwacja jest aktywna
            updatedItems.push(item)
          }
        }

        set({ items: updatedItems })
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
    }
  )
)
