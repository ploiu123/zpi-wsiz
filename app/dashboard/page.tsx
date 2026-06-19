'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { OrderWithItems, Profile } from '@/lib/types'
import { e } from '@/lib/l'
import { ClientRealtimeListener } from './client-realtime-listener'

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'
  const notice = searchParams.get('notice')
  
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  
  const [saveStatus, setSaveStatus] = useState<{success: boolean, msg: string} | null>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser({ id: user.id, email: user.email || '' })

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (profileData) {
        setProfile(profileData)
        setFullName(profileData.full_name || '')
        setPhone(profileData.phone || '')
        setAddress(profileData.address || '')
        setCity(profileData.city || '')
        setPostalCode(profileData.postal_code || '')
      }

      const { data: ordersData } = await supabase
        .from('orders')
        .select(`*, order_items (*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersData) {
        setOrders(ordersData as unknown as OrderWithItems[])
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveStatus(null)
    
    if (!user) return
    const supabase = createClient()
    
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      phone: phone,
      address: address,
      city: city,
      postal_code: postalCode,
      updated_at: new Date().toISOString()
    }).eq('id', user.id)

    if (error) {
       setSaveStatus({ success: false, msg: 'Wystąpił błąd podczas zapisywania: ' + error.message })
    } else {
       setSaveStatus({ success: true, msg: 'Pomyślnie zaktualizowano dane profilowe.' })
    }
  }

  if (loading) return <div className="pt-32 pb-16 px-4 text-center text-amber-500">Wczytywanie pulpitu...</div>

  return (
    <div className="pt-32 pb-16 px-4 md:px-8 max-w-6xl mx-auto min-h-[80vh]">
      <ClientRealtimeListener userId={user?.id || null} />
      {isSuccess && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-6 rounded-2xl mb-8 flex items-center justify-center text-center">
          <div>
            <h2 className="font-bold text-xl mb-2">Dziękujemy za zamówienie!</h2>
            <p>Zostało ono poprawnie zapisane w naszym systemie.</p>
          </div>
        </div>
      )}

      {notice === 'admin_only' && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-6 rounded-2xl mb-8 text-center">
          <h2 className="font-bold text-lg mb-1">Dostęp wyłącznie dla administratora</h2>
          <p className="text-sm text-gray-400">
            Adres <span className="text-gray-200">/admin</span> jest zarezerwowany dla kont z rolą administratora. Jeśli prowadzisz sklep, nadaj rolę w panelu Supabase (tabela{' '}
            <code className="text-amber-400/90">profiles</code>).
          </p>
        </div>
      )}

      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-amber-500 mb-2">Moje konto</h1>
          <p className="text-gray-400">Zarządzaj swoimi danymi do wysyłki oraz przeglądaj historię zakupów.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lewa kolumna - Profil */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
            <h2 className="font-bold text-white text-xl mb-6">Dane klienta</h2>
            
             {saveStatus && (
               <div className={`p-4 rounded-xl mb-6 text-sm ${saveStatus.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                 {saveStatus.msg}
               </div>
             )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email (nieedytowalny)</label>
                <input disabled value={user?.email || ''} className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-2 text-gray-400 cursor-not-allowed" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Imię i nazwisko</label>
                <input required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Telefon</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Adres wysyłki (ulica, nr)</label>
                <input required value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Kod pocztowy</label>
                  <input required value={postalCode} onChange={e => setPostalCode(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" />
                 </div>
                 <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Miasto</label>
                  <input required value={city} onChange={e => setCity(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500" />
                 </div>
              </div>

              <button type="submit" className="w-full bg-white/10 hover:bg-amber-500 hover:text-white text-amber-500 font-bold py-3 mt-4 rounded-xl transition-all">
                Zapisz zmiany
              </button>
            </form>
          </div>
        </div>

        {/* Prawa kolumna - Zamówienia */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="font-bold text-white text-2xl px-2">Historia zamówień</h2>
          
          {orders.length === 0 ? (
            <div className="bg-[#111] border border-white/10 rounded-2xl p-12 text-center text-gray-400">
              Nie masz jeszcze żadnych złożonych zamówień.
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-[#111] border border-white/10 rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 pb-4 border-b border-white/10">
                    <div>
                      <div className="text-sm text-gray-400">Zamówienie w trakcie realizacji</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">Stworzono: {new Date(order.created_at).toLocaleDateString('pl-PL')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-500 font-bold text-xl">{order.total_amount.toFixed(2)} zł</div>
                      <div className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full mt-2 uppercase tracking-wider">
                        {e(order.status)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div className="text-gray-300">
                          <span className="font-bold text-amber-500 mr-2">{item.quantity}x</span>
                          {item.product_name}
                        </div>
                        <div className="font-medium text-gray-300">
                          {(item.price * item.quantity).toFixed(2)} zł
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10 text-sm">
                     <div className="text-gray-500 text-xs mb-1">Dostarczymy do:</div>
                     <div className="text-gray-300 bg-black/30 p-3 rounded-lg mt-1 outline outline-1 outline-white/5">
                        {order.shipping_address}, {order.shipping_postal_code} {order.shipping_city}
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="pt-32 pb-16 px-4 text-center text-amber-500">Wczytywanie pulpitu...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
