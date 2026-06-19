import { createClient } from '@/lib/supabase/server'
import { AddProductForm } from './add-product-form'
import { OrderStatusUpdater } from './order-status-updater'
import { AdminProductCatalog } from './admin-product-catalog'
import { AdminRealtimeListener } from './admin-realtime-listener'
import type { Product } from '@/lib/types'
import { isAdminRole } from '@/lib/roles'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

  const { data: orders } = await supabase
    .from('orders')
    .select('*, profiles(email, full_name)')
    .order('created_at', { ascending: false })

  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false })

  const profileRows = profiles ?? []
  const orderRows = orders ?? []

  return (
    <div className="px-4 md:px-8 max-w-7xl mx-auto py-8">
      <AdminRealtimeListener />
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-amber-500 mb-2">Panel administratora</h1>
          <p className="text-gray-400">
            Zarządzaj asortymentem, zamówieniami i kontami klientów. Dostęp mają wyłącznie konta z rolą{' '}
            <span className="text-amber-500/90 font-semibold">admin</span> w tabeli <code className="text-gray-500">profiles</code>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <AddProductForm />
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Katalog produktów</h2>
            <AdminProductCatalog initialProducts={(products as Product[]) || []} />
          </div>

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
                    {orderRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center">
                          Brak zamówień.
                        </td>
                      </tr>
                    ) : (
                      orderRows.map((order) => (
                        <tr key={order.id} className="border-t border-white/5 hover:bg-white/5">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(order.created_at).toLocaleDateString('pl-PL')}
                          </td>
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

          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Klienci</h2>
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
                    {profileRows.map((profile) => (
                      <tr key={profile.id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div className="text-white">{profile.full_name || '—'}</div>
                          <div className="text-xs">{profile.email}</div>
                        </td>
                        <td className="px-6 py-4">{profile.phone || '—'}</td>
                        <td className="px-6 py-4">{profile.city || '—'}</td>
                        <td className="px-6 py-4">
                          {isAdminRole(profile.role) ? (
                            <span className="text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded">ADMIN</span>
                          ) : (
                            <span className="text-gray-400">USER</span>
                          )}
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
