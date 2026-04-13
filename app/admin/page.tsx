import { createClient } from '@/lib/supabase/server'
import { AddProductForm } from './add-product-form'
import { OrderStatusUpdater } from './order-status-updater'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = await createClient()

  // 1. Ochrona Ścieżki - czy użytkownik jest adminem?
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login?redirect=/admin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/') // Odrzucenie intruza na stronę główną
  }

  // Pobranie klientów
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Pobranie wszystkich zamówień
  const { data: orders } = await supabase
    .from('orders')
    .select('*, profiles(email, full_name)')
    .order('created_at', { ascending: false })

  // Pobranie wszystkich istniejących produktów do możliwości modyfikacji
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="px-4 md:px-8 max-w-7xl mx-auto py-8">
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-amber-500 mb-2">Prywatny Panel Sterowania (Admin)</h1>
          <p className="text-gray-400">Zarządzaj całym asortymentem na żywo, dodawaj promocje i przeglądaj system zamówień sklepu.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lewa kolumna - Nowy Produkt */}
        <div className="lg:col-span-1 space-y-6">
           <AddProductForm />
        </div>

        {/* Prawa kolumna - Zarządzanie */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Zarządzanie Produktami (Katalog) */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Obecny Asortyment (Katalog Shop)</h2>
            <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-400">
                   <thead className="bg-white/5 text-gray-200">
                     <tr>
                       <th className="px-6 py-4 font-medium">Zdjęcie / Nazwa</th>
                       <th className="px-6 py-4 font-medium">Cena</th>
                       <th className="px-6 py-4 font-medium">Stan Mag.</th>
                       <th className="px-6 py-4 font-medium">Status / Edycja</th>
                     </tr>
                   </thead>
                   <tbody>
                     {products?.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center border-t border-white/5">Brak produktów w bazie. Należy je dodać formularzem.</td></tr>
                     ) : (
                       products?.map(product => (
                         <tr key={product.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                           <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                {product.image_url ? 
                                 <img src={product.image_url} alt="img" className="w-10 h-10 object-cover rounded shadow border border-white/10" /> 
                                 : <div className="w-10 h-10 bg-white/5 rounded border border-white/10 flex items-center justify-center">?</div>}
                                <div className="text-white font-bold">{product.name}</div>
                             </div>
                           </td>
                           <td className="px-6 py-4 text-amber-500 font-bold">{product.price.toFixed(2)} zł</td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {product.stock > 0 ? `${product.stock} sztuk` : 'Wyprzedane'}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              {product.featured && <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-1 rounded mr-2">WYRÓŻNIONY</span>}
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>

          {/* Zamowienia */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Ostatnie zamówienia</h2>
            <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-400">
                   <thead className="bg-white/5 text-gray-200">
                     <tr>
                       <th className="px-6 py-4 font-medium">Data</th>
                       <th className="px-6 py-4 font-medium">Klient</th>
                       <th className="px-6 py-4 font-medium">Kwota</th>
                       <th className="px-6 py-4 font-medium">Status</th>
                     </tr>
                   </thead>
                   <tbody>
                     {orders?.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center">Brak zamówień.</td></tr>
                     ) : (
                       orders?.map(order => (
                         <tr key={order.id} className="border-t border-white/5 hover:bg-white/5">
                           <td className="px-6 py-4 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString('pl-PL')}</td>
                           <td className="px-6 py-4">
                             <div className="text-white">{order.profiles?.full_name || 'Nieznany'}</div>
                             <div className="text-xs">{order.profiles?.email}</div>
                           </td>
                           <td className="px-6 py-4 font-bold text-amber-500">{order.total_amount.toFixed(2)} zł</td>
                           <td className="px-6 py-4">
                              <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>

          {/* Klienci */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Baza Klientów</h2>
            <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-400">
                   <thead className="bg-white/5 text-gray-200">
                     <tr>
                       <th className="px-6 py-4 font-medium">Użytkownik</th>
                       <th className="px-6 py-4 font-medium">Telefon</th>
                       <th className="px-6 py-4 font-medium">Miasto</th>
                       <th className="px-6 py-4 font-medium">Rola</th>
                     </tr>
                   </thead>
                   <tbody>
                     {profiles?.map(profile => (
                       <tr key={profile.id} className="border-t border-white/5 hover:bg-white/5">
                         <td className="px-6 py-4">
                            <div className="text-white">{profile.full_name || '-'}</div>
                            <div className="text-xs">{profile.email}</div>
                         </td>
                         <td className="px-6 py-4">{profile.phone || '-'}</td>
                         <td className="px-6 py-4">{profile.city || '-'}</td>
                         <td className="px-6 py-4">
                            {profile.role === 'admin' 
                              ? <span className="text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded">ADMIN</span> 
                              : <span className="text-gray-400">USER</span>}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
