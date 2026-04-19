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
      <section className="mb-20 text-center space-y-6">
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-amber-500">
          Złote Miody
        </h1>
        <p className="text-gray-400 max-w-3xl mx-auto text-lg md:text-xl leading-relaxed">
          Złote Miody to nie tylko sklep, to wielopokoleniowa historia naszej rodziny. Pasja do pszczelarstwa 
          przechodziła w naszej rodzinie z dziadka na ojca. Dbamy o każdą pszczołę i najdrobniejszy szczegół, 
          by dostarczyć Ci 100% bezpieczny i naturalny miód bezpośrednio z uli zlokalizowanych w najczystszych lasach. 
          Zamów raz, a już nigdy nie wrócisz do miodów ze sklepowych półek.
        </p>
        <p className="text-center mt-6">
          <Link
            href="/historia"
            className="inline-flex items-center justify-center text-amber-400 font-semibold hover:text-amber-300 underline underline-offset-4 decoration-amber-500/40"
          >
            Przeczytaj pełną historię sklepu
          </Link>
        </p>
      </section>

      {/* Produkty */}
      <section id="produkty" className="scroll-mt-24">
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
          <h2 className="font-serif text-3xl font-bold text-white">Nasza oferta</h2>
        </div>
        
        {items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            Brak produktów w bazie danych. Dodaj je przez panel Supabase.
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
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
          Odkryj naszą nową aplikację desktopową!
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-8">
          Kupuj nasze pyszne miody prosto z Twojego ekranu bez używania przeglądarki. Zainstaluj stabilną i superszybką aplikację przeznaczoną na Twój system operacyjny.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/download" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full font-bold transition-all w-full sm:w-auto">
            Dowiedz się więcej
          </a>
          <a href="/download#windows" className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 w-full sm:w-auto">
            Pobierz Aplikację
          </a>
        </div>
      </section>
    </div>
  )
}
