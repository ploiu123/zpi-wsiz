'use client'

import { Product } from '@/lib/types'
import { useCartStore } from '@/lib/store'
import { ShoppingCart } from 'lucide-react'
import Image from 'next/image'

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)

  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all group flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        {product.image_url ? (
          <Image 
            src={product.image_url} 
            alt={product.name} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-500">
            Miód
          </div>
        )}
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-serif text-xl font-bold text-gray-100">{product.name}</h3>
          <span className="text-amber-400 font-bold whitespace-nowrap ml-3">{product.price.toFixed(2)} zł</span>
        </div>
        
        <p className="text-sm text-gray-400 mb-6 flex-1 line-clamp-4">
          {product.description}
        </p>
        
        <button 
          onClick={() => addItem(product)}
          className="w-full bg-white/5 hover:bg-amber-500 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-colors group-hover:text-white"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Dodaj do koszyka</span>
        </button>
      </div>
    </div>
  )
}
