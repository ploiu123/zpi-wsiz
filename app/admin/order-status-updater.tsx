'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const STATUSES = [
  'Nowe',
  'W trakcie realizacji',
  'Wysłane do kuriera',
  'Zakończone',
  'Anulowane'
];

export function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    setStatus(newStatus)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    setLoading(false)
    if (!error) {
      router.refresh()
    } else {
      alert('Błąd aktualizacji statusu: ' + error.message)
    }
  }

  return (
    <div className="relative inline-block w-full max-w-[180px]">
      <select
        value={status}
        onChange={handleStatusChange}
        disabled={loading}
        className={`w-full appearance-none bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer outline-none focus:border-amber-500
          ${status === 'Zakończone' ? 'text-green-400 border-green-500/30' : ''}
          ${status === 'Anulowane' ? 'text-red-400 border-red-500/30' : ''}
          ${status === 'Wysłane do kuriera' ? 'text-blue-400 border-blue-500/30' : ''}
          ${status === 'Nowe' ? 'text-amber-500 border-amber-500/30' : ''}
        `}
      >
        {STATUSES.map(s => (
          <option key={s} value={s} className="bg-[#111] text-white">{s}</option>
        ))}
      </select>
      {loading && <span className="absolute right-[-20px] top-2 text-xs text-amber-500">...</span>}
    </div>
  )
}
