import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import { Product } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()
  
  // Pobranie produktów z bazy Supabase
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Błąd pobierania produktów:', error.message)
  }

  const items = (products as Product[]) || []

  return (
    <div className="pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden rounded-[2.5rem] mb-24 min-h-[85vh] flex items-center justify-center border border-white/5 shadow-2xl shadow-amber-900/20">
        {/* Tło graficzne z gradientem */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1587049352851-8d4e89134a6d?auto=format&fit=crop&w=1920&q=80" 
            alt="Pasieka tło" 
            className="w-full h-full object-cover opacity-40 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
        </div>

        {/* Zawartość */}
        <div className="relative z-10 text-center px-4 md:px-8 max-w-4xl mx-auto space-y-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold mb-4 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            🐝 Naturalne zbiory z rodzinnej pasieki
          </div>
          
          <h1 className="font-serif text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-amber-500 drop-shadow-sm leading-tight">
            Prawdziwe Złoto <br /> z Naszej Pasieki
          </h1>
          
          <p className="text-gray-300 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed font-light">
            Trzy pokolenia pszczelarzy, czyste lasy i zero chemii. Każdy słoik to gwarancja 
            smaku, który pamiętasz z dzieciństwa — prosto od nas do Twojego stołu.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#produkty"
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/40 transition-all hover:-translate-y-1 w-full sm:w-auto"
            >
              🍯 Zobacz produkty
            </a>
            <Link
              href="/historia"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white rounded-full font-semibold transition-all hover:-translate-y-1 w-full sm:w-auto"
            >
              📖 Poznaj naszą historię
            </Link>
          </div>
        </div>
      </section>

      {/* Info cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-20">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center hover:border-amber-500/20 transition-colors">
          <div className="text-3xl mb-3">🌿</div>
          <h3 className="font-serif text-lg font-bold text-white mb-2">100% Naturalny</h3>
          <p className="text-gray-400 text-sm">Bez cukru, bez konserwantów, bez sztucznych barwników. Czysty miód z naszych uli.</p>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center hover:border-amber-500/20 transition-colors">
          <div className="text-3xl mb-3">📦</div>
          <h3 className="font-serif text-lg font-bold text-white mb-2">Wysyłka 24h</h3>
          <p className="text-gray-400 text-sm">Pakujemy w ekologiczne materiały i wysyłamy następnego dnia roboczego.</p>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center hover:border-amber-500/20 transition-colors">
          <div className="text-3xl mb-3">🏆</div>
          <h3 className="font-serif text-lg font-bold text-white mb-2">Sprawdzona jakość</h3>
          <p className="text-gray-400 text-sm">Każda partia miodu przechodzi kontrolę jakości. Znamy historię każdej ramki.</p>
        </div>
      </section>

      {/* Produkty */}
      <section id="produkty" className="scroll-mt-24">
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
          <div>
            <h2 className="font-serif text-3xl font-bold text-white">🍯 Nasza oferta</h2>
            <p className="text-gray-400 text-sm mt-1">Kliknij na produkt, żeby zobaczyć szczegóły</p>
          </div>
          <Link href="/products" className="text-amber-500 hover:text-amber-400 text-sm font-semibold transition-colors">
            Wszystkie →
          </Link>
        </div>
        
        {items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            Brak produktów w bazie danych. Dodaj je przez panel administracyjny.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Pobranie Aplikacji */}
      <section className="mt-24 border border-amber-500/30 bg-[#111] rounded-3xl p-8 md:p-14 text-center hide-in-electron">
        <div className="text-4xl mb-4">💻</div>
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
          Aplikacja desktopowa już dostępna!
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-8">
          Kupuj miody bez otwierania przeglądarki. Szybka, stabilna aplikacja na macOS — idealna do powtórnych zamówień.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/download" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full font-bold transition-all w-full sm:w-auto">
            📋 Dowiedz się więcej
          </a>
          <a href="/download#macos" className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 w-full sm:w-auto">
            ⬇️ Pobierz teraz
          </a>
        </div>
      </section>
    </div>
  )
}
