'use client'

import { useEffect } from 'react'

/**
 * Granica błędu dla /admin.
 *
 * Bez niej wyjątek w layoucie lub stronie kończył się pustą odpowiedzią 500,
 * którą przeglądarka pokazuje jako "This page couldn't load" — bez żadnej
 * informacji, co się właściwie stało.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin] błąd renderowania:', error)
  }, [error])

  return (
    <div className="pt-32 px-4 max-w-3xl mx-auto">
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-red-300">
        <h2 className="text-xl font-bold mb-4">Panel administratora nie mógł się załadować</h2>

        <p className="text-sm text-red-200/80 mb-2">Komunikat błędu:</p>
        <pre className="text-sm overflow-auto p-4 bg-black/50 rounded-lg whitespace-pre-wrap">
          {error?.message || String(error)}
        </pre>

        {error?.digest && (
          <>
            <p className="text-sm text-red-200/80 mt-4 mb-2">
              Identyfikator w logach serwera (digest):
            </p>
            <pre className="text-sm p-4 bg-black/50 rounded-lg">{error.digest}</pre>
          </>
        )}

        <button
          onClick={reset}
          className="mt-6 px-5 py-2.5 rounded-full bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors"
        >
          Spróbuj ponownie
        </button>
      </div>
    </div>
  )
}
