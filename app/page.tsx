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
            src="/hero.png" 
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
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center hover-lift hover-glow transition-all animate-fade-up animate-delay-100">
          <div className="text-3xl mb-3 animate-bounce-in animate-delay-100">🌿</div>
          <h3 className="font-serif text-lg font-bold text-white mb-2">100% Naturalny</h3>
          <p className="text-gray-400 text-sm">Bez cukru, bez konserwantów, bez sztucznych barwników. Czysty miód z naszych uli.</p>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center hover-lift hover-glow transition-all animate-fade-up animate-delay-200">
          <div className="text-3xl mb-3 animate-bounce-in animate-delay-200">📦</div>
          <h3 className="font-serif text-lg font-bold text-white mb-2">Wysyłka 24h</h3>
          <p className="text-gray-400 text-sm">Pakujemy w ekologiczne materiały i wysyłamy następnego dnia roboczego.</p>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center hover-lift hover-glow transition-all animate-fade-up animate-delay-300">
          <div className="text-3xl mb-3 animate-bounce-in animate-delay-300">🏆</div>
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

      {/* CTA Pobranie Aplikacji - Wersja Premium */}
      <section className="mt-32 mb-16 relative hide-in-electron group cursor-default">
        {/* Animated Glow Border Wrapper */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-500/30 via-amber-200/10 to-amber-500/30 rounded-[3rem] blur-sm group-hover:blur-md transition-all duration-500 opacity-70" />
        
        <div className="relative bg-[#080808] border border-white/10 rounded-[3rem] overflow-hidden p-10 md:p-16 lg:p-20 flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none -translate-x-1/2 translate-y-1/2" />
          
          <div className="relative z-10 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-amber-400 text-xs font-bold mb-6 uppercase tracking-widest backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Nowość
            </div>
            
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Kupuj miody <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">jeszcze szybciej</span>
            </h2>
            
            <p className="text-gray-400 text-lg mb-10 leading-relaxed font-light">
              Zainstaluj naszą dedykowaną aplikację na system macOS. Zamawiaj swoje ulubione słoiki prosto z pulpitu, bez konieczności otwierania przeglądarki. Bezpiecznie, stabilnie i w mgnieniu oka.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a 
                href="/download#macos" 
                className="group/btn relative px-8 py-4 bg-white text-black rounded-full font-bold transition-all hover:scale-105 hover:shadow-xl hover:shadow-white/10 w-full sm:w-auto flex items-center justify-center gap-2 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-amber-200 to-amber-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-2 z-10 group-hover/btn:text-black">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"/></svg>
                  Pobierz dla macOS
                </span>
              </a>
              <Link 
                href="/download" 
                className="px-8 py-4 bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/5 text-white rounded-full font-semibold transition-all w-full sm:w-auto flex items-center justify-center"
              >
                Więcej informacji
              </Link>
            </div>
          </div>
          
          {/* Mockup Illustration */}
          <div className="relative z-10 lg:w-1/3 w-full max-w-sm mx-auto lg:mx-0 aspect-[4/3] bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-2xl p-2 shadow-2xl flex items-center justify-center group-hover:-translate-y-2 group-hover:rotate-1 transition-all duration-500">
            <div className="w-full h-full bg-[#0a0a0a] rounded-xl overflow-hidden relative border border-white/5 flex flex-col">
              {/* Fake window header */}
              <div className="h-6 bg-white/5 border-b border-white/10 flex items-center px-3 gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 p-4 flex flex-col gap-3">
                 <div className="h-4 w-1/3 bg-white/10 rounded" />
                 <div className="h-16 w-full bg-gradient-to-r from-amber-500/20 to-transparent rounded-lg border border-amber-500/10" />
                 <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="h-20 bg-white/5 rounded-lg" />
                    <div className="h-20 bg-white/5 rounded-lg" />
                 </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-amber-500/20 blur-2xl rounded-full" />
          </div>
        </div>
      </section>
    </div>
  )
}
