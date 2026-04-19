'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/lib/store'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAdminRole } from '@/lib/roles'
import { isAdminEmail } from '@/lib/admin-emails'
import { ShoppingCart, User, Menu, X, LogOut, Moon, Sun } from 'lucide-react'

const NAV_LINKS = [
  { href: '/', label: 'Strona główna' },
  { href: '/products', label: 'Produkty' },
  { href: '/historia', label: 'Historia sklepu' },
  { href: '/download', label: 'Aplikacja' },
] as const

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const itemCount = useCartStore((s) => s.getItemCount())

  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUser({ id: user.id, email: user.email || '' })
      await supabase.rpc('sync_profile')
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      if (isAdminRole(data?.role) || isAdminEmail(user.email)) setIsAdmin(true)
    })

    // Theme check
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      setIsLight(true)
      document.documentElement.classList.add('light-mode')
    }
  }, [])

  const toggleTheme = useCallback(() => {
    if (isLight) {
      document.documentElement.classList.remove('light-mode')
      localStorage.setItem('theme', 'dark')
      setIsLight(false)
    } else {
      document.documentElement.classList.add('light-mode')
      localStorage.setItem('theme', 'light')
      setIsLight(true)
    }
  }, [isLight])

  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    window.location.href = '/'
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Złote Miody" className="h-9 w-9 rounded-full" />
          <span className="font-serif text-lg font-bold text-amber-400">Złote Miody</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                pathname === link.href
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-gray-400 hover:text-amber-400 hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="px-4 py-2 rounded-full text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
              Admin
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-white/5 transition-all text-gray-300" title="Zmień motyw">
            {mounted && isLight ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
          </button>

          <Link href="/cart" className="relative p-2 rounded-full hover:bg-white/5 transition-all">
            <ShoppingCart className="w-5 h-5 text-gray-300" />
            {mounted && itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/dashboard" className="p-2 rounded-full hover:bg-white/5 transition-all">
                <User className="w-5 h-5 text-gray-300" />
              </Link>
              <button onClick={handleLogout} className="p-2 rounded-full hover:bg-white/5 transition-all" title="Wyloguj">
                <LogOut className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="hidden md:inline-flex px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all">
              Zaloguj
            </Link>
          )}

          {/* Mobile menu */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-full hover:bg-white/5">
            {menuOpen ? <X className="w-5 h-5 text-gray-300" /> : <Menu className="w-5 h-5 text-gray-300" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl px-4 py-4 space-y-2">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-amber-400 transition-all">
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5">Moje konto</Link>
              {isAdmin && <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10">Admin</Link>}
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5">Wyloguj</button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-semibold text-amber-400 bg-amber-500/10">Zaloguj się</Link>
          )}
        </div>
      )}
    </nav>
  )
}
