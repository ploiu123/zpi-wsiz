'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store'
import { Product } from '@/lib/types'
import { useToast } from '@/components/toast'
import { ShoppingCart, PackageX } from 'lucide-react'

export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)
  const { addToast } = useToast()
  const [busy, setBusy] = useState(false)
  const soldOut = product.stock <= 0

  const handleClick = async () => {
    setBusy(true)
    const success = await addItem(product)
    setBusy(false)
    if (success) {
      addToast('cart', `Dodano do koszyka: ${product.name}`)
    } else {
      addToast('error', 'Nie udało się zarezerwować produktu — brak wystarczającej ilości w magazynie.')
    }
  }

  if (soldOut) {
    return (
      <button
        type="button"
        disabled
        className="w-full bg-white/5 border border-red-500/30 text-red-400 rounded-2xl py-4 px-6 flex items-center justify-center gap-3 font-bold text-lg cursor-not-allowed"
      >
        <PackageX className="w-5 h-5" />
        <span>Brak w magazynie</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 font-bold text-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-60"
    >
      <ShoppingCart className="w-5 h-5" />
      <span>{busy ? 'Dodawanie…' : 'Dodaj do koszyka'}</span>
    </button>
  )
}
