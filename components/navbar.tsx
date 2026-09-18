'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/lib/store'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAdminRole } from '@/lib/roles'
import { logoutAndClearCart } from '@/lib/auth/logout'
import { isAdminEmail } from '@/lib/admin-emails'
import { useIsClient, useIsElectron } from '@/lib/client-info'
import { applyTheme, readResolvedTheme, storeTheme, subscribeResolvedTheme } from '@/lib/theme'
import { ShoppingCart, User, Menu, X, LogOut, Moon, Sun, Settings } from 'lucide-react'

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
  const mounted = useIsClient()
  const isElectron = useIsElectron()
  const itemCount = useCartStore((s) => s.getItemCount())
  const isDark = useSyncExternalStore(subscribeResolvedTheme, () => readResolvedTheme() === 'dark', () => true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUser({ id: user.id, email: user.email || '' })
      await supabase.rpc('sync_profile')
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      if (isAdminRole(data?.role) || isAdminEmail(user.email)) setIsAdmin(true)
    })
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark'
    storeTheme(next)
    applyTheme(next)
  }, [isDark])

  const handleLogout = useCallback(async () => {
    setMenuOpen(false)
    await logoutAndClearCart()
    setUser(null)
    setIsAdmin(false)
    window.location.href = '/'
  }, [])

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/60 backdrop-blur-2xl border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-amber-500/30 group-hover:border-amber-500/70 transition-all duration-300 shadow-lg shadow-amber-500/10 group-hover:shadow-amber-500/25">
            <img src="/logo.png" alt="Złote Miody" className="w-full h-full object-contain bg-black/10" />
          </div>
          <span className="font-serif text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 tracking-wide">
            Złote Miody
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            if (isElectron && link.href === '/download') return null;
            return (
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
            )
          })}
          {isAdmin && (
            <Link href="/admin" className="px-4 py-2 rounded-full text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
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
              <Link href="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:text-amber-500 hover:bg-white/5" role="menuitem">
                <div className="flex items-center gap-2"><Settings className="w-4 h-4" /> Ustawienia</div>
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

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-full hover:bg-white/5"
            aria-label={menuOpen ? 'Zamknij menu' : 'Otwórz menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X className="w-5 h-5 text-gray-300" /> : <Menu className="w-5 h-5 text-gray-300" />}
          </button>
        </div>
      </div>
    </nav>

    {menuOpen && (
      <div id="mobile-menu" className="md:hidden fixed inset-x-0 top-20 bottom-0 z-40 overflow-y-auto bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/5 mobile-menu-overlay flex flex-col p-6">
        <div className="flex-1 space-y-4 mobile-menu-content">
          {NAV_LINKS.map((link) => {
            if (isElectron && link.href === '/download') return null;
            return (
              <Link key={link.href} href={link.href} onClick={closeMenu}
                className={`block px-4 py-4 rounded-xl text-lg font-medium transition-all ${
                  pathname === link.href ? 'bg-amber-500/15 text-amber-400' : 'text-gray-300 hover:bg-white/5 hover:text-amber-400'
                }`}>
                {link.label}
              </Link>
            )
          })}

          <div className="h-px w-full bg-white/10 my-4"></div>

          {user ? (
            <>
              <Link href="/dashboard" onClick={closeMenu} className="block px-4 py-4 rounded-xl text-lg font-medium text-gray-300 hover:bg-white/5">Moje konto</Link>
              <Link href="/settings" onClick={closeMenu} className="flex items-center gap-2 px-4 py-4 rounded-xl text-lg font-medium text-gray-300 hover:bg-white/5">
                <Settings className="w-5 h-5" /> Ustawienia
              </Link>
              {isAdmin && <Link href="/admin" onClick={closeMenu} className="block px-4 py-4 rounded-xl text-lg font-medium text-red-400 hover:bg-red-500/10">Panel Admina</Link>}
              <button onClick={handleLogout} className="w-full text-left px-4 py-4 rounded-xl text-lg font-medium text-gray-400 hover:bg-white/5">Wyloguj się</button>
            </>
          ) : (
            <Link href="/login" onClick={closeMenu} className="block text-center px-4 py-4 mt-8 rounded-xl text-lg font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 shadow-lg shadow-amber-500/20">Zaloguj się</Link>
          )}
        </div>
      </div>
    )}
    </>
  )
}
