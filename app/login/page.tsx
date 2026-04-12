'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParams = searchParams.get('redirect') || '/'

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // No confirmation needed inside test env
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })
        if (error) throw error
        setError('Zarejestrowano pomyślnie. Możesz się teraz zalogować!')
        setIsRegistering(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        router.push(redirectParams)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas uwierzytelniania.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-32 pb-16 px-4 flex items-center justify-center min-h-[80vh]">
      <div className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-amber-500 mb-2">
            {isRegistering ? 'Utwórz konto' : 'Zaloguj się'}
          </h1>
          <p className="text-gray-400">
            {isRegistering 
              ? 'Dołącz do nas i łatwiej kupuj miody' 
              : 'Witaj z powrotem! Zaloguj się, aby kontynuować.'}
          </p>
        </div>

        {error && (
          <div className={`p-4 rounded-xl mb-6 text-sm ${error.includes('pomyślnie') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Adres e-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="twoj@email.pl"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Hasło</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl py-4 font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Przetwarzanie...' : (isRegistering ? 'Zarejestruj się' : 'Zaloguj się')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/10 pt-6">
          <p className="text-gray-400">
            {isRegistering ? 'Masz już konto?' : 'Nie masz jeszcze konta?'}
          </p>
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-amber-500 font-bold mt-2 hover:text-amber-400 transition-colors"
          >
            {isRegistering ? 'Zaloguj się tutaj' : 'Zarejestruj się'}
          </button>
        </div>
      </div>
    </div>
  )
}
