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

  const [isDark, setIsDark] = useState(true)

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

    // Read current theme from DOM (set by blocking script)
    const isCurrentlyLight = document.documentElement.classList.contains('light')
    setIsDark(!isCurrentlyLight)
  }, [])

  const toggleTheme = useCallback(() => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }, [isDark])

  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    window.location.href = '/'
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/60 backdrop-blur-2xl border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20">
        {/* Logo — prostokątne zaokrąglone, nie okrągłe */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-11 h-9 rounded-xl overflow-hidden border-2 border-amber-500/30 group-hover:border-amber-500/70 transition-all duration-300 shadow-lg shadow-amber-500/10 group-hover:shadow-amber-500/25">
            <img src="/logo.jpg" alt="Złote Miody" className="w-full h-full object-cover" />
          </div>
          <span className="font-serif text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 tracking-wide">
            Złote Miody
          </span>
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
              } ${link.href === '/download' ? 'hide-in-electron' : ''}`}
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
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="relative p-2.5 rounded-full hover:bg-white/5 transition-all group/theme"
            title={isDark ? 'Włącz jasny tryb' : 'Włącz ciemny tryb'}
            aria-label="Zmień motyw"
          >
            {mounted && isDark ? (
              <Sun className="w-5 h-5 text-amber-400 group-hover/theme:text-amber-300 transition-colors" />
            ) : mounted ? (
              <Moon className="w-5 h-5 text-amber-600 group-hover/theme:text-amber-500 transition-colors" />
            ) : (
              <div className="w-5 h-5" />
            )}
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
              className={`block px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-amber-400 transition-all ${link.href === '/download' ? 'hide-in-electron' : ''}`}>
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
