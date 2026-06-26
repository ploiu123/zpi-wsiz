import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import { Product } from '@/lib/types'

export const metadata = {
  title: 'Nasze Produkty | Złote Miody'
}

export default async function ProductsPage() {
  const supabase = await createClient()
  
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Błąd pobierania produktów:', error.message)
  }

  const items = (products as Product[]) || []

  return (
    <div className="pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto min-h-[80vh]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 border-b border-white/10 pb-4 gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold text-amber-500"> Wszystkie produkty</h1>
          <p className="text-gray-400 text-sm mt-1">Kliknij na produkt, żeby zobaczyć pełny opis i szczegóły</p>
        </div>
        <div className="text-sm text-gray-500">
          {items.length > 0 && `${items.length} ${items.length === 1 ? 'produkt' : items.length < 5 ? 'produkty' : 'produktów'}`}
        </div>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-4"></div>
          Brak produktów w bazie danych. Wróć tu niedługo — uzupełniamy asortyment!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
