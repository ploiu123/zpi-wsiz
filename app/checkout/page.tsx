'use client'

import { useCartStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, clearCart, cartId } = useCartStore()
  
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postal, setPostal] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // Redirection for non-logged users
        router.push('/login?redirect=/checkout')
      } else {
        setUserId(user.id)
        // Opcjonalnie załaduj z bazy (profiles) dane
        supabase.from('profiles').select('address, city, postal_code').eq('id', user.id).single()
          .then(({data}) => {
             if(data) {
               if(data.address) setAddress(data.address)
               if(data.city) setCity(data.city)
               if(data.postal_code) setPostal(data.postal_code)
             }
          })
      }
    })
  }, [router])

  if (!mounted) return null
  if (items.length === 0) {
    return (
      <div className="pt-32 text-center text-gray-400">
        <div className="text-4xl mb-4">📭</div>
        Twój koszyk jest pusty. Dodaj produkty, zanim przejdziesz do kasy.
      </div>
    )
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      // Użycie RPC dla zapewnienia atomowej zmiany stocku
      const orderItemsToInsert = items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      }))

      const { data: orderId, error: rpcError } = await supabase.rpc('place_order_with_stock', {
        p_user_id: userId,
        p_total_amount: getTotal(),
        p_address: address,
        p_city: city,
        p_postal: postal,
        p_items: orderItemsToInsert,
        p_cart_id: cartId
      })

      if (rpcError) throw new Error(rpcError.message)

      // Sukces
      clearCart();
      router.push(`/dashboard?success=true&order_id=${orderId}`);

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Wystąpił problem ze złożeniem zamówienia.')
      setLoading(false)
    }
  }

  return (
    <div className="pt-32 pb-16 px-4 md:px-8 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div>
        <h1 className="font-serif text-3xl font-bold text-amber-500 mb-8 border-b border-white/10 pb-4">
          📦 Dostawa i płatność
        </h1>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 mb-8">
          <h2 className="text-xl font-bold mb-6 text-white">🏠 Dane do wysyłki</h2>
          <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Adres (ulica i nr)</label>
              <input 
                type="text" required
                value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="np. ul. Pszczela 12"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Kod pocztowy</label>
                <input 
                  type="text" required
                  value={postal} onChange={(e) => setPostal(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="00-000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Miejscowość</label>
                <input 
                  type="text" required
                  value={city} onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="np. Warszawa"
                />
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/10 mt-6">
              <h2 className="text-xl font-bold mb-4 text-white">💳 Metoda płatności</h2>
              <div className="p-4 border border-amber-500/50 bg-amber-500/10 rounded-xl">
                 <div className="font-bold text-amber-500 mb-1">🤝 Płatność przy odbiorze</div>
                 <div className="text-sm text-gray-400">Zamówienie jest realizowane od razu, a płacisz przy dostawie — wygodnie i bezpiecznie.</div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div>
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 sticky top-24">
          <h2 className="font-serif text-2xl font-bold text-white mb-6">📋 Podsumowanie</h2>
          
          <div className="space-y-4 mb-6">
            {items.map(item => (
              <div key={item.product.id} className="flex justify-between text-sm">
                 <div className="text-gray-300">
                    <span className="font-bold mr-2">{item.quantity}x</span>
                    {item.product.name}
                 </div>
                 <div className="text-white font-medium">
                    {(item.product.price * item.quantity).toFixed(2)} zł
                 </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-6 mb-8">
            <div className="flex justify-between text-2xl font-bold text-white">
              <span>Do zapłaty</span>
              <span className="text-amber-500">{getTotal().toFixed(2)} zł</span>
            </div>
          </div>

          <button 
            type="submit"
            form="checkout-form"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl py-4 font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? '⏳ Przetwarzanie...' : '✅ Złóż zamówienie'}
          </button>
        </div>
      </div>
    </div>
  )
}
