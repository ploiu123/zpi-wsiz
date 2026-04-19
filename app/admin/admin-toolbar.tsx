'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Store } from 'lucide-react'

export function AdminToolbar({ email }: { email: string }) {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xs text-gray-500 truncate">
          Zalogowano jako <span className="text-gray-300 font-medium">{email}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/15 transition-colors"
          >
            <Store className="w-4 h-4" />
            Wróć do sklepu
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/5 text-gray-300 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Wyloguj
          </button>
        </div>
      </div>
    </div>
  )
}
