'use client'

import { useCartStore } from '@/lib/store'
import { Product } from '@/lib/types'
import { ShoppingCart } from 'lucide-react'

export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)

  return (
    <button 
      onClick={() => addItem(product)}
      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 font-bold text-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5"
    >
      <ShoppingCart className="w-5 h-5" />
      <span>Dodaj do koszyka</span>
    </button>
  )
}
