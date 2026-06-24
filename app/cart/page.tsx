'use client'

import { useCartStore } from '@/lib/store'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus, ArrowRight, Clock, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/toast'

export default function CartPage() {
  const [mounted, setMounted] = useState(false)
  const { items, removeItem, updateQuantity, getTotal, cartId, syncCart, clearCart } = useCartStore()
  const { addToast } = useToast()

  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)

    // 1. Synchronizacja koszyka na starcie
    syncCart().then((syncWarnings) => {
      if (syncWarnings && syncWarnings.length > 0) {
        setWarnings(syncWarnings)
      }
    })

    // 2. Pobranie najwcześniejszego czasu wygaśnięcia rezerwacji z bazy
    const supabase = createClient()
    const fetchExpiration = async () => {
      if (!cartId) return
      const { data } = await supabase
        .from('cart_reservations')
        .select('expires_at')
        .eq('cart_id', cartId)
        .order('expires_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (data && data.expires_at) {
        const expiresTime = new Date(data.expires_at).getTime()
        const now = Date.now()
        const diff = Math.max(0, Math.floor((expiresTime - now) / 1000))
        setTimeLeft(diff)
      } else {
        setTimeLeft(null)
      }
    }

    fetchExpiration()
    const interval = setInterval(fetchExpiration, 10000) // odpytuj bazę co 10s

    return () => clearInterval(interval)
  }, [cartId, syncCart])

  // Odliczanie czasu rezerwacji na kliencie
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          clearCart().then(() => {
            addToast('error', 'Rezerwacja wygasła. Produkty wróciły do sklepu, a koszyk został opróżniony.')
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, clearCart, addToast])

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-16 px-4 max-w-4xl mx-auto text-center">
        <h1 className="font-serif text-3xl font-bold text-white mb-6">🛒 Koszyk</h1>
        <div className="bg-[#111] border border-white/10 rounded-2xl p-12">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-400 mb-8 max-w-md mx-auto text-lg">
            Twój koszyk jest pusty. Sprawdź naszą ofertę i dodaj swoje ulubione miody!
          </p>
          <Link 
            href="/#produkty" 
            className="inline-flex py-3 px-8 bg-amber-500 text-white rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5"
          >
            🍯 Przejdź do produktów
          </Link>
        </div>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <div className="pt-32 pb-16 px-4 md:px-8 max-w-5xl mx-auto animate-fade-in">
      <h1 className="font-serif text-3xl font-bold text-white mb-6 border-b border-white/10 pb-4">🛒 Twój koszyk</h1>
      
      {/* Banner rezerwacji */}
      {timeLeft !== null && timeLeft > 0 && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 animate-pulse-glow">
          <Clock className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="text-sm md:text-base text-gray-300">
            Wybrane produkty zostały zarezerwowane specjalnie dla Ciebie na:{' '}
            <span className="font-mono font-bold text-amber-400 text-lg bg-black/40 px-2 py-0.5 rounded border border-amber-500/20 ml-1">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      )}

      {/* Ostrzeżenia o zmianach w koszyku */}
      {warnings.length > 0 && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl space-y-2">
          {warnings.map((w, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="bg-[#111] border border-white/10 rounded-2xl p-4 flex gap-4 md:gap-6 items-center">
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="96px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-500 text-2xl">🍯</div>
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
                  onClick={async () => {
                    const success = await updateQuantity(product.id, quantity - 1)
                    if (!success) addToast('error', 'Brak wystarczającej ilości produktu w magazynie.')
                  }}
                  className="p-1 hover:text-amber-500 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-4 text-center font-medium">{quantity}</span>
                <button 
                  onClick={async () => {
                    const success = await updateQuantity(product.id, quantity + 1)
                    if (!success) addToast('error', 'Brak wystarczającej ilości produktu w magazynie.')
                  }}
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
            <h2 className="font-serif text-xl font-bold text-white mb-6 pb-4 border-b border-white/10">📋 Podsumowanie</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-400">
                <span>Wartość koszyka</span>
                <span>{getTotal().toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between flex-wrap text-green-400 text-sm">
                <span>📦 Koszt dostawy (obliczany w kasie)</span>
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
              ← Kontynuuj zakupy
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
