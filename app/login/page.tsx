'use client'

import { useState, Suspense } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { r } from '@/lib/l'
import { authErrorMessage } from '@/lib/auth/messages'
import { LogIn, UserPlus, Lock, KeyRound, Eye, EyeOff } from 'lucide-react'

type Mode = 'login' | 'register' | 'reset'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  const searchParams = useSearchParams()
  const redirectParams = r(searchParams.get('redirect'))
  const isAdminTarget = redirectParams.startsWith('/admin')

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)
    const supabase = createClient()
    const address = email.trim()

    try {
      if (mode === 'reset') {
        const recovery = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
        )
        const { error } = await recovery.auth.resetPasswordForEmail(address, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setNotice('Jeśli konto z tym adresem istnieje, wysłaliśmy na nie link do ustawienia nowego hasła. Link możesz otworzyć w dowolnej przeglądarce.')
      } else if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: address,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })
        if (error) throw error
        if (data.user && data.user.identities?.length === 0) {
          setError(authErrorMessage({ code: 'user_already_exists' }))
          setMode('login')
          return
        }
        setNotice('Konto zostało utworzone. Sprawdź skrzynkę e-mail i kliknij link aktywacyjny, a potem zaloguj się.')
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: address,
          password
        })
        if (error) throw error
        await supabase.rpc('sync_profile')
        window.location.href = redirectParams
      }
    } catch (err) {
      setError(authErrorMessage(err as { code?: string; message?: string }))
    } finally {
      setLoading(false)
    }
  }

  const trackCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(e.getModifierState('CapsLock'))
  }

  const title = mode === 'register' ? 'Utwórz konto' : mode === 'reset' ? 'Nowe hasło' : 'Zaloguj się'
  const subtitle = mode === 'register'
    ? 'Dołącz do nas — kupuj miody szybciej i wygodniej'
    : mode === 'reset'
      ? 'Podaj adres e-mail konta — wyślemy link do ustawienia nowego hasła.'
      : 'Witaj z powrotem! Zaloguj się, by kontynuować.'

  return (
    <div className="pt-32 pb-16 px-4 flex items-center justify-center min-h-[80vh]">
      <div className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="mb-3 flex justify-center">
            {mode === 'register' ? (
              <UserPlus className="w-12 h-12 text-amber-500" />
            ) : mode === 'reset' ? (
              <KeyRound className="w-12 h-12 text-amber-500" />
            ) : (
              <LogIn className="w-12 h-12 text-amber-500" />
            )}
          </div>
          <h1 className="font-serif text-3xl font-bold text-amber-500 mb-2">{title}</h1>
          <p className="text-gray-400">{subtitle}</p>
          {isAdminTarget && mode === 'login' && (
            <p className="mt-4 text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 flex items-center gap-2 text-left justify-start">
              <Lock className="w-5 h-5 text-amber-500 shrink-0" />
              <span>
                Logujesz się do <span className="font-semibold">panelu administratora</span>. Konto musi mieć rolę{' '}
                <code className="text-amber-400">admin</code> w tabeli{' '}
                <code className="text-amber-400">profiles</code>.
              </span>
            </p>
          )}
        </div>

        {error && (
          <div role="alert" className="p-4 rounded-xl mb-6 text-sm bg-red-500/10 text-red-400">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="p-4 rounded-xl mb-6 text-sm bg-green-500/10 text-green-400">
            {notice}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">Adres e-mail</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="twoj@email.pl"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-400">Hasło</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
                  >
                    Nie pamiętasz hasła?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={trackCapsLock}
                  onKeyDown={trackCapsLock}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-amber-500 transition-colors"
                  aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                  title={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {capsLock && (
                <p className="mt-2 text-xs text-amber-400">Włączony Caps Lock — hasło może zostać wpisane wielkimi literami.</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl py-4 font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>⏳ Przetwarzanie...</span>
            ) : mode === 'register' ? (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Zarejestruj się</span>
              </>
            ) : mode === 'reset' ? (
              <>
                <KeyRound className="w-5 h-5" />
                <span>Wyślij link</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Zaloguj się</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/10 pt-6">
          {mode === 'reset' ? (
            <button
              onClick={() => switchMode('login')}
              className="text-amber-500 font-bold hover:text-amber-400 transition-colors"
            >
              Wróć do logowania
            </button>
          ) : (
            <>
              <p className="text-gray-400">
                {mode === 'register' ? 'Masz już konto?' : 'Nie masz jeszcze konta?'}
              </p>
              <button
                onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}
                className="text-amber-500 font-bold mt-2 hover:text-amber-400 transition-colors"
              >
                {mode === 'register' ? 'Zaloguj się tutaj' : 'Zarejestruj się'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="pt-32 pb-16 px-4 text-center text-amber-500">⏳ Wczytywanie...</div>}>
      <LoginContent />
    </Suspense>
  )
}
