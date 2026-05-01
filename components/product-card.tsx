'use client'

import { memo, useCallback, useState } from 'react'
import { Product } from '@/lib/types'
import { useCartStore } from '@/lib/store'
import { ShoppingCart, X, Package, Truck, Check } from 'lucide-react'
import Image from 'next/image'

export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)
  const onAdd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product)
  }, [addItem, product])

  const [showModal, setShowModal] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  const handleAddFromModal = useCallback(() => {
    addItem(product)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }, [addItem, product])

  return (
    <>
      {/* Card */}
      <div
        onClick={() => setShowModal(true)}
        className="bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-[2rem] overflow-hidden hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 group flex flex-col cursor-pointer"
      >
        <div className="relative aspect-square overflow-hidden bg-white/5">
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent z-10" />
          {product.image_url ? (
            <Image 
              src={product.image_url} 
              alt={product.name} 
              fill 
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-amber-500/50 font-serif text-2xl">
              🍯
            </div>
          )}
          {/* Stock badge */}
          <div className="absolute top-3 right-3 z-20">
            {product.stock > 0 ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 backdrop-blur-md border border-green-500/20">
                W magazynie
              </span>
            ) : (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 backdrop-blur-md border border-red-500/20">
                Wyprzedane
              </span>
            )}
          </div>
        </div>
        
        <div className="p-6 flex-1 flex flex-col relative z-20">
          <div className="flex justify-between items-start mb-3 gap-2">
            <h3 className="font-serif text-xl font-bold text-white group-hover:text-amber-400 transition-colors leading-tight">{product.name}</h3>
            <div className="text-right shrink-0">
              {product.old_price ? (
                <>
                  <span className="text-red-400/70 line-through text-xs block">{product.old_price.toFixed(2)} zł</span>
                  <span className="text-amber-400 font-bold whitespace-nowrap bg-red-500/10 px-3 py-1 rounded-full text-sm border border-red-500/20">{product.price.toFixed(2)} zł</span>
                </>
              ) : (
                <span className="text-amber-400 font-bold whitespace-nowrap bg-amber-500/10 px-3 py-1 rounded-full text-sm border border-amber-500/20">{product.price.toFixed(2)} zł</span>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-400/90 mb-4 flex-1 line-clamp-2 font-light leading-relaxed">
            {product.description}
          </p>

          {/* Stock info */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Package className="w-3.5 h-3.5" />
            <span>{product.stock > 0 ? `${product.stock} szt. dostępnych` : 'Brak w magazynie'}</span>
          </div>
          
          <button 
            type="button"
            onClick={onAdd}
            disabled={product.stock <= 0}
            className="w-full bg-white/5 hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-600 border border-white/10 hover:border-transparent text-white rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="font-semibold">{product.stock > 0 ? 'Do koszyka' : 'Niedostępny'}</span>
          </button>
        </div>
      </div>

      {/* Quick-view Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          onClick={() => setShowModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Modal content */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#111] border border-white/10 rounded-3xl shadow-2xl shadow-black/50 animate-fade-up"
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors backdrop-blur-md"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="md:w-1/2 relative aspect-square md:aspect-auto md:min-h-[400px] bg-white/5 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none overflow-hidden">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-500 font-serif text-4xl">
                    🍯
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
                {/* Category */}
                <div className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full mb-3 uppercase tracking-wider w-max border border-amber-500/20">
                  {product.category || 'Miód naturalny'}
                </div>

                <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-3">
                  {product.name}
                </h2>

                <div className="text-2xl font-bold text-amber-400 mb-4">
                  {product.old_price ? (
                    <div className="flex items-center gap-3">
                      <span>{product.price.toFixed(2)} zł</span>
                      <span className="text-red-400/70 line-through text-base">{product.old_price.toFixed(2)} zł</span>
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">Promocja</span>
                    </div>
                  ) : (
                    <span>{product.price.toFixed(2)} zł</span>
                  )}
                </div>

                {/* Description — full, no line clamp */}
                <p className="text-gray-400 text-sm md:text-base mb-6 leading-relaxed whitespace-pre-line flex-1">
                  {product.description || 'Naturalny miód z naszej rodzinnej pasieki. Zbierany z dbałością o najwyższą jakość i smak.'}
                </p>

                {/* Stock & shipping info */}
                <div className="space-y-3 py-4 border-t border-white/10 mb-6">
                  <div className="flex items-center gap-2.5 text-sm">
                    <Package className="w-4 h-4 text-amber-500 shrink-0" />
                    {product.stock > 0 ? (
                      <span className="text-green-400">
                        Dostępne <span className="font-bold">{product.stock} szt.</span> w magazynie
                      </span>
                    ) : (
                      <span className="text-red-400 font-medium">Brak w magazynie</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-500">
                    <Truck className="w-4 h-4 text-amber-500/60 shrink-0" />
                    <span>Wysyłka w 24h, ekologiczne opakowanie</span>
                  </div>
                  {product.old_price && (
                    <div className="flex items-center gap-2.5 text-xs text-gray-500">
                      <span>ℹ️</span>
                      <span>Najniższa cena z ostatnich 30 dni: <span className="text-amber-400 font-semibold">{product.price.toFixed(2)} zł</span></span>
                    </div>
                  )}
                </div>

                {/* Add to cart button */}
                <button
                  onClick={handleAddFromModal}
                  disabled={product.stock <= 0}
                  className={`w-full rounded-xl py-4 px-6 flex items-center justify-center gap-3 font-bold text-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                    addedToCart
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5'
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Dodano!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>{product.stock > 0 ? 'Dodaj do koszyka' : 'Niedostępny'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
})
