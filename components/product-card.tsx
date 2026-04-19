'use client'

import { memo, useCallback } from 'react'
import { Product } from '@/lib/types'
import { useCartStore } from '@/lib/store'
import { ShoppingCart } from 'lucide-react'
import Image from 'next/image'

export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)
  const onAdd = useCallback(() => addItem(product), [addItem, product])

  return (
    <div className="bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-[2rem] overflow-hidden hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 group flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent z-10" />
        {product.image_url ? (
          <Image 
            src={product.image_url} 
            alt={product.name} 
            fill 
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-500/50 font-serif text-2xl">
            Złote Miody
          </div>
        )}
      </div>
      
      <div className="p-6 flex-1 flex flex-col relative z-20">
        <div className="flex justify-between items-start mb-3 gap-2">
          <h3 className="font-serif text-xl font-bold text-white group-hover:text-amber-400 transition-colors leading-tight">{product.name}</h3>
          <span className="text-amber-400 font-bold whitespace-nowrap bg-amber-500/10 px-3 py-1 rounded-full text-sm border border-amber-500/20">{product.price.toFixed(2)} zł</span>
        </div>
        
        <p className="text-sm text-gray-400/90 mb-8 flex-1 line-clamp-3 font-light leading-relaxed">
          {product.description}
        </p>
        
        <button 
          type="button"
          onClick={onAdd}
          className="w-full bg-white/5 hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-600 border border-white/10 hover:border-transparent text-white rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-amber-500/20"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="font-semibold">Do koszyka</span>
        </button>
      </div>
    </div>
  )
})
