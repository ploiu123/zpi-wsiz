'use client'

import { useCartStore } from '@/lib/store'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function CartPage() {
  const [mounted, setMounted] = useState(false)
  const { items, removeItem, updateQuantity, getTotal } = useCartStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-16 px-4 max-w-4xl mx-auto text-center">
        <h1 className="font-serif text-3xl font-bold text-white mb-6">Koszyk</h1>
        <div className="bg-[#111] border border-white/10 rounded-2xl p-12">
          <p className="text-gray-400 mb-8 max-w-md mx-auto text-lg">
            Twój koszyk jest pusty. Odwiedź nasz sklep, aby dodać pyszne, naturalne miody.
          </p>
          <Link 
            href="/#produkty" 
            className="inline-flex py-3 px-8 bg-amber-500 text-white rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5"
          >
            Przejdź do produktów
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-32 pb-16 px-4 md:px-8 max-w-5xl mx-auto">
      <h1 className="font-serif text-3xl font-bold text-white mb-8 border-b border-white/10 pb-4">Twój Koszyk</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="bg-[#111] border border-white/10 rounded-2xl p-4 flex gap-4 md:gap-6 items-center">
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-500 text-xs">Miód</div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <Link href={`/product/${product.id}`} className="font-serif text-lg font-bold text-white hover:text-amber-500 transition-colors line-clamp-1">
                  {product.name}
                </Link>
                <div className="text-amber-400 font-bold mt-1">{product.price.toFixed(2)} zł</div>
              </div>

              <div className="flex items-center gap-3 bg-black/50 p-2 rounded-xl border border-white/5">
                <button 
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="p-1 hover:text-amber-500 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-4 text-center font-medium">{quantity}</span>
                <button 
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  className="p-1 hover:text-amber-500 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-shrink-0 pl-2">
                <button 
                  onClick={() => removeItem(product.id)}
                  className="p-2 text-gray-400 hover:text-red-500 bg-black/30 rounded-xl hover:bg-black/50 transition-colors"
                  title="Usuń z koszyka"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 sticky top-24">
            <h2 className="font-serif text-xl font-bold text-white mb-6 pb-4 border-b border-white/10">Podsumowanie</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-400">
                <span>Wartość koszyka</span>
                <span>{getTotal().toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between flex-wrap text-green-400 text-sm">
                <span>Koszt dostawy (obliczany w kasie)</span>
              </div>
            </div>

            <div className="flex justify-between text-xl font-bold text-white mb-8 pt-4 border-t border-white/10">
              <span>Suma</span>
              <span className="text-amber-400">{getTotal().toFixed(2)} zł</span>
            </div>

            <Link 
              href="/checkout"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl py-4 flex items-center justify-center gap-2 font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5"
            >
              Przejdź do kasy
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link href="/" className="block w-full text-center mt-4 text-sm text-gray-400 hover:text-white transition-colors">
              Kontynuuj zakupy
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
