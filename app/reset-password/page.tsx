'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { authErrorMessage } from '@/lib/auth/messages'
import { KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

type Stage = 'checking' | 'ready' | 'invalid' | 'done'

const INVALID_LINK = 'Link do ustawienia hasła jest nieprawidłowy albo wygasł. Poproś o nowy na stronie logowania.'

export default function ResetPasswordPage() {
  const [stage, setStage] = useState<Stage>('checking')
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.title = 'Nowe hasło | Złote Miody'
    const supabase = createClient()
    const hash = new URLSearchParams(window.location.hash.slice(1))

    const prepare = async () => {
      const errorCode = hash.get('error_code')
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      if (window.location.hash) window.history.replaceState(null, '', window.location.pathname)

      if (errorCode) {
        setError(authErrorMessage({ code: errorCode, message: hash.get('error_description') ?? '' }))
        setStage('invalid')
        return
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (error) {
          setError(INVALID_LINK)
          setStage('invalid')
          return
        }
        setStage('ready')
        return
      }

      await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setStage('ready')
      } else {
        setError(INVALID_LINK)
        setStage('invalid')
      }
    }

    void prepare()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.')
      return
    }
    if (password !== repeat) {
      setError('Hasła nie są takie same.')
      return
    }
    setSaving(true)
    const { error } = await createClient().auth.updateUser({ password })
    setSaving(false)
    if (error) {
      setError(authErrorMessage(error))
      return
    }
    setStage('done')
  }

  return (
    <div className="pt-32 pb-16 px-4 flex items-center justify-center min-h-[80vh]">
      <div className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="mb-3 flex justify-center">
            {stage === 'done' ? (
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            ) : (
              <KeyRound className="w-12 h-12 text-amber-500" />
            )}
          </div>
          <h1 className="font-serif text-3xl font-bold text-amber-500 mb-2">
            {stage === 'done' ? 'Hasło zmienione' : 'Ustaw nowe hasło'}
          </h1>
          {stage === 'ready' && <p className="text-gray-400">Wpisz nowe hasło do swojego konta.</p>}
          {stage === 'checking' && <p className="text-gray-400">⏳ Sprawdzanie linku...</p>}
        </div>

        {error && (
          <div role="alert" className="p-4 rounded-xl mb-6 text-sm bg-red-500/10 text-red-400">
            {error}
          </div>
        )}

        {stage === 'ready' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-400 mb-2">Nowe hasło</label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-amber-500 transition-colors"
                  aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="repeat-password" className="block text-sm font-medium text-gray-400 mb-2">Powtórz hasło</label>
              <input
                id="repeat-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl py-4 font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '⏳ Zapisywanie...' : 'Zapisz nowe hasło'}
            </button>
          </form>
        )}

        {stage === 'done' && (
          <div className="space-y-4 text-center">
            <p className="text-gray-300">Nowe hasło zostało zapisane i jesteś zalogowany. Tym samym hasłem zalogujesz się też w aplikacji desktopowej.</p>
            <Link href="/" className="block w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl py-4 font-bold">
              Przejdź do sklepu
            </Link>
          </div>
        )}

        {stage === 'invalid' && (
          <Link href="/login" className="block text-center text-amber-500 font-bold hover:text-amber-400 transition-colors">
            Wróć do logowania
          </Link>
        )}
      </div>
    </div>
  )
}
