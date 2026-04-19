'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ORDER_STATUS_OPTIONS, type OrderStatusValue } from '@/lib/order-status'

export function OrderStatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: string
}) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatusValue
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

  const styleFor = (s: string) => {
    if (s === 'dostarczone') return 'text-green-400 border-green-500/30'
    if (s === 'anulowane') return 'text-red-400 border-red-500/30'
    if (s === 'wysłane') return 'text-blue-400 border-blue-500/30'
    if (s === 'nowe') return 'text-amber-500 border-amber-500/30'
    return 'text-gray-200 border-white/20'
  }

  return (
    <div className="relative inline-block w-full max-w-[200px]">
      <select
        value={status}
        onChange={handleStatusChange}
        disabled={loading}
        className={`w-full appearance-none bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer outline-none focus:border-amber-500 ${styleFor(status)}`}
      >
        {ORDER_STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value} className="bg-[#111] text-white">
            {s.label}
          </option>
        ))}
      </select>
      {loading && <span className="absolute right-[-20px] top-2 text-xs text-amber-500">...</span>}
    </div>
  )
}
